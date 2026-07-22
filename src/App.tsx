import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Room, Idea, Participant, RoomColumn, NoteColor, RoomTemplate } from './types';
import { AVATARS, NOTE_COLORS, TEMPLATE_COLUMNS, KNOWN_COLUMN_ORDER } from './data';

import Onboarding from './components/Onboarding';
import Header from './components/Header';
import IdeaCard from './components/IdeaCard';
import SidebarParticipants from './components/SidebarParticipants';
import FacilitatorControls from './components/FacilitatorControls';
import ExportModal from './components/ExportModal';
import AdminConsole from './components/AdminConsole';
import ColumnInfoPopover from './components/ColumnInfoPopover';
import CapacityLimitModal from './components/CapacityLimitModal';

import { Plus, Check, Volume2, VolumeX, Sparkles, AlertCircle, Copy, CheckCircle2, LayoutGrid, Heart } from 'lucide-react';
import { generateUserId, normalizeUserId } from './lib/userIdentity';
import {
  createRoomInFirestore,
  joinRoomInFirestore,
  getParticipantsFromFirestore,
  subscribeToRoom,
  subscribeToColumns,
  subscribeToIdeas,
  subscribeToParticipants,
  updateRoomInFirestore,
  updateColumnInFirestore,
  addIdeaToFirestore,
  updateIdeaInFirestore,
  deleteIdeaInFirestore,
  updateParticipantInFirestore,
  terminateRoomInFirestore
} from './services/firebaseRoomService';

// Generates a random tab identifier
const getTabId = () => Math.random().toString(36).substring(2, 9);

// Procedural audio pop / click synthesizer using Web Audio API
const playSound = (type: 'pop' | 'click' | 'vote' | 'success') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'pop') {
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'click') {
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } else if (type === 'vote') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    // Silent fail if AudioContext is blocked
  }
};

export default function App() {
  const tabId = useRef(getTabId());
  
  // URL Prefilled PIN
  const [prefilledPin, setPrefilledPin] = useState('');

  // Admin routing state
  const [isAdminRoute, setIsAdminRoute] = useState(
    window.location.pathname === '/admin' || 
    window.location.hash === '#/admin' || 
    window.location.search.includes('admin=true')
  );

  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminRoute(
        window.location.pathname === '/admin' || 
        window.location.hash === '#/admin' || 
        window.location.search.includes('admin=true')
      );
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const handleNavigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setIsAdminRoute(true);
  };

  const handleNavigateFromAdmin = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
  };
  
  // Core Sync States
  const [room, setRoom] = useState<Room | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [columns, setColumns] = useState<RoomColumn[]>([]);
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);

  // Sound/Vibe Settings
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & UI States
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isNewIdeaOpen, setIsNewIdeaOpen] = useState(false);
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [newIdeaText, setNewIdeaText] = useState('');
  const [newIdeaColor, setNewIdeaColor] = useState<NoteColor>('yellow');
  const [newIdeaColumn, setNewIdeaColumn] = useState('');

  // Mobile Drawers & Navigation States
  const [isParticipantsOpenMobile, setIsParticipantsOpenMobile] = useState(false);
  const [isFacilitatorOpenMobile, setIsFacilitatorOpenMobile] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<string>('');

  const handleScrollToColumn = (colId: string) => {
    setActiveMobileTab(colId);
    const colElem = document.getElementById(`column_${colId}`);
    if (colElem) {
      colElem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  // Local BroadcastChannel for real-time synchronization
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // 1. Initial Mount: Check URL query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pinParam = params.get('room');
    if (pinParam && pinParam.length === 6) {
      setPrefilledPin(pinParam);
    }
  }, []);

  // 2. Real-Time BroadcastChannel Setup & Sync Listeners
  useEffect(() => {
    if (!room) return;

    const channel = new BroadcastChannel(`ideacao_room_${room.pin}`);
    broadcastChannelRef.current = channel;

    const handleBroadcast = (event: MessageEvent) => {
      const data = event.data;
      if (data.senderId === tabId.current) return; // skip self

      // Facilitator closed the room permanently
      if (data.type === 'ROOM_TERMINATED') {
        alert('A sala foi encerrada permanentemente pelo facilitador/proprietário.');
        setRoom(null);
        setIdeas([]);
        setParticipants([]);
        setColumns([]);
        setCurrentUser(null);
        return;
      }

      if (soundEnabled && (data.type === 'RELOAD_IDEAS' || data.type === 'RELOAD_ROOM' || data.type === 'NEW_POSTIT')) {
        playSound('pop');
      }

      // Reload local values from localStorage (the absolute source of truth)
      if (data.type === 'RELOAD_ROOM' || data.type === 'STATE_CHANGED') {
        const savedRoom = localStorage.getItem(`room_${room.pin}`);
        if (savedRoom) setRoom(JSON.parse(savedRoom));
        
        const savedColumns = localStorage.getItem(`columns_${room.pin}`);
        if (savedColumns) setColumns(JSON.parse(savedColumns));
      }

      if (data.type === 'RELOAD_IDEAS' || data.type === 'STATE_CHANGED' || data.type === 'NEW_POSTIT') {
        const savedIdeas = localStorage.getItem(`ideas_${room.pin}`);
        if (savedIdeas) setIdeas(JSON.parse(savedIdeas));
      }

      if (data.type === 'RELOAD_PARTICIPANTS' || data.type === 'STATE_CHANGED' || data.type === 'PARTICIPANT_JOINED') {
        const savedParticipants = localStorage.getItem(`participants_${room.pin}`);
        if (savedParticipants) {
          const parsed = JSON.parse(savedParticipants);
          setParticipants(parsed);
          
          // Keep the local current user's votesLeft and online status synced from local storage
          setCurrentUser(prev => {
            if (!prev) return null;
            const updatedSelf = parsed.find((p: any) => p.id === prev.id);
            return updatedSelf ? { ...prev, ...updatedSelf } : prev;
          });
        }
      }

      if (data.type === 'TOAST_ALERT') {
        showToast(data.payload);
      }
    };

    channel.addEventListener('message', handleBroadcast);

    // Alert other tabs that we are online / joined
    try {
      channel.postMessage({
        type: 'PARTICIPANT_JOINED',
        senderId: tabId.current
      });
    } catch (err) {
      console.warn('BroadcastChannel postMessage failed:', err);
    }

    return () => {
      channel.removeEventListener('message', handleBroadcast);
      if (broadcastChannelRef.current === channel) {
        broadcastChannelRef.current = null;
      }
      try {
        channel.close();
      } catch (err) {
        // channel already closed or cleanup error
      }
    };
  }, [room?.pin, soundEnabled]);

  // 3. Realtime Firestore Subscriptions
  useEffect(() => {
    if (!room?.pin) return;

    const currentPin = room.pin;

    // Subscribe to Room changes
    const unsubRoom = subscribeToRoom(currentPin, (updatedRoom) => {
      if (!updatedRoom) {
        setRoom(null);
        setIdeas([]);
        setParticipants([]);
        setColumns([]);
        setCurrentUser(null);
        return;
      }
      setRoom(updatedRoom);
      localStorage.setItem(`room_${currentPin}`, JSON.stringify(updatedRoom));
    });

    // Subscribe to Columns
    const unsubCols = subscribeToColumns(currentPin, (updatedCols) => {
      if (updatedCols.length > 0) {
        setColumns(updatedCols);
        localStorage.setItem(`columns_${currentPin}`, JSON.stringify(updatedCols));
      }
    });

    // Subscribe to Ideas
    const unsubIdeas = subscribeToIdeas(currentPin, (updatedIdeas) => {
      setIdeas(updatedIdeas);
      localStorage.setItem(`ideas_${currentPin}`, JSON.stringify(updatedIdeas));
    });

    // Subscribe to Participants
    const unsubParts = subscribeToParticipants(currentPin, (updatedParts) => {
      setParticipants(updatedParts);
      localStorage.setItem(`participants_${currentPin}`, JSON.stringify(updatedParts));
      setCurrentUser(prev => {
        if (!prev) return null;
        const updatedSelf = updatedParts.find(p => p.id === prev.id);
        return updatedSelf ? { ...prev, ...updatedSelf } : prev;
      });
    });

    return () => {
      unsubRoom();
      unsubCols();
      unsubIdeas();
      unsubParts();
    };
  }, [room?.pin]);

  // Sorted columns guaranteed order (Empatia, Definição, Ideação, Prototipagem, Testes)
  const sortedColumns = useMemo(() => {
    return [...columns].sort((a, b) => {
      const orderA = a.order ?? KNOWN_COLUMN_ORDER[a.id] ?? (parseInt(a.title) || 99);
      const orderB = b.order ?? KNOWN_COLUMN_ORDER[b.id] ?? (parseInt(b.title) || 99);
      if (orderA !== orderB) return orderA - orderB;
      return a.title.localeCompare(b.title);
    });
  }, [columns]);

  // Toast notifier helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 4000);
  };

  // Safe Audio Wrapper
  const triggerSound = (type: 'pop' | 'click' | 'vote' | 'success') => {
    if (soundEnabled) playSound(type);
  };

  // Helper: Trigger broad state reload alert
  const broadcastChange = (type: string, payload?: any) => {
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({
          type,
          payload,
          senderId: tabId.current
        });
      } catch (err) {
        console.warn('BroadcastChannel postMessage failed:', err);
      }
    }
  };

  // ONBOARDING ACTION: Join Existing Room
  const handleJoinRoom = async (pin: string, name: string, avatar: string, userIdInput?: string) => {
    triggerSound('success');

    // Retrieve room from localStorage as fallback initial state
    let roomObj: Room | null = null;
    let columnsObj: RoomColumn[] = [];
    let ideasObj: Idea[] = [];
    let participantsObj: Participant[] = [];

    const savedRoom = localStorage.getItem(`room_${pin}`);
    if (savedRoom) {
      roomObj = JSON.parse(savedRoom);
      columnsObj = JSON.parse(localStorage.getItem(`columns_${pin}`) || '[]');
      ideasObj = JSON.parse(localStorage.getItem(`ideas_${pin}`) || '[]');
      participantsObj = JSON.parse(localStorage.getItem(`participants_${pin}`) || '[]');
    }

    // Determine current user ID tag (e.g. LUCAS-8492 or #8492)
    const currentUserId = userIdInput ? normalizeUserId(userIdInput) : generateUserId(name);

    // Check if current user is the owner/facilitator of this room:
    // 1. Matching ownerUserId
    // 2. Exact match on facilitatorName
    const isFacil = roomObj ? (
      (roomObj.ownerUserId && roomObj.ownerUserId === currentUserId) ||
      (roomObj.facilitatorName && name.trim().toLowerCase() === roomObj.facilitatorName.trim().toLowerCase())
    ) : false;

    // Fetch up-to-date participants snapshot from Firestore
    let fsParticipants: Participant[] = [];
    try {
      fsParticipants = await getParticipantsFromFirestore(pin);
    } catch (err) {
      console.warn("Could not fetch fs participants:", err);
    }

    // Determine current effective participant list
    const currentParticipantList = fsParticipants.length > 0 ? fsParticipants : participantsObj;

    // Find existing participant entry if reconnecting or re-entering
    const existingParticipant = currentParticipantList.find(
      p => p.id === currentUserId || p.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    const isAlreadyMember = Boolean(existingParticipant) || isFacil;

    // CAPACITY CHECK: Max 50 people including teacher/facilitator
    const MAX_ROOM_CAPACITY = 50;
    if (!isAlreadyMember && currentParticipantList.length >= MAX_ROOM_CAPACITY) {
      setIsCapacityModalOpen(true);
      return;
    }

    const newUser: Participant = {
      id: currentUserId,
      name: isFacil ? (roomObj?.facilitatorName || name) : name,
      avatar: isFacil ? '👑' : avatar,
      isFacilitator: isFacil,
      votesLeft: isFacil ? 0 : (existingParticipant ? existingParticipant.votesLeft : (roomObj ? roomObj.maxVotesPerPerson : 5)),
      online: true
    };

    // Try joining in Firestore (UPSERT participant in room subcollection)
    try {
      const fsRoom = await joinRoomInFirestore(pin, newUser);
      if (fsRoom) {
        roomObj = fsRoom;
      }
    } catch (err) {
      console.warn("Firestore join error:", err);
    }

    if (!roomObj) {
      alert(`Sala com PIN ${pin} não encontrada. Por favor, crie uma como facilitador.`);
      return;
    }

    // UPSERT into local array (by user ID or name)
    const existingIndex = participantsObj.findIndex(
      p => p.id === newUser.id || p.name.trim().toLowerCase() === newUser.name.trim().toLowerCase()
    );
    let updatedParticipants: Participant[] = [];
    if (existingIndex >= 0) {
      updatedParticipants = [...participantsObj];
      updatedParticipants[existingIndex] = { ...updatedParticipants[existingIndex], ...newUser, online: true };
    } else {
      updatedParticipants = [...participantsObj, newUser];
    }
    
    localStorage.setItem(`participants_${pin}`, JSON.stringify(updatedParticipants));

    setRoom(roomObj);
    if (columnsObj.length > 0) setColumns(columnsObj);
    setIdeas(ideasObj);
    setParticipants(updatedParticipants);
    setCurrentUser(newUser);

    broadcastChange('STATE_CHANGED');
    broadcastChange('TOAST_ALERT', `${avatar} ${name} entrou no quadro!`);
    showToast(`Seu ID de Usuário é ${currentUserId}. Guarde este código para acessar de outros aparelhos!`);
  };

  // ONBOARDING ACTION: Create New Room
  const handleCreateRoom = async (title: string, facilitatorName: string, template: RoomTemplate, facilitatorUserIdInput?: string) => {
    triggerSound('success');

    // Generate random unique 6-digit PIN code
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    // Determine unique facilitator User ID (e.g. FACILITADOR-1024 or CARLOS-9281)
    const facilUserId = facilitatorUserIdInput ? normalizeUserId(facilitatorUserIdInput) : generateUserId(facilitatorName);

    const roomObj: Room = {
      pin,
      title,
      facilitatorName,
      ownerUserId: facilUserId,
      template,
      status: 'waiting',
      timerSeconds: 300, // 5 minutes default
      timerActive: false,
      anonymizeAuthors: false,
      autoTimer: true,
      maxVotesPerPerson: 5
    };

    const facilitatorUser: Participant = {
      id: facilUserId,
      name: facilitatorName,
      avatar: '👑',
      isFacilitator: true,
      votesLeft: 0, // Admin doesn't vote
      online: true
    };

    const columnsObj = TEMPLATE_COLUMNS[template];

    // Persist to local storage
    localStorage.setItem(`room_${pin}`, JSON.stringify(roomObj));
    localStorage.setItem(`columns_${pin}`, JSON.stringify(columnsObj));
    localStorage.setItem(`ideas_${pin}`, JSON.stringify([]));
    localStorage.setItem(`participants_${pin}`, JSON.stringify([facilitatorUser]));

    // Persist to Firestore
    try {
      await createRoomInFirestore(roomObj, columnsObj, facilitatorUser);
    } catch (err) {
      console.warn("Firestore create room error:", err);
    }

    setRoom(roomObj);
    setColumns(columnsObj);
    setIdeas([]);
    setParticipants([facilitatorUser]);
    setCurrentUser(facilitatorUser);

    // Set first column as preselected
    if (columnsObj.length > 0) {
      setNewIdeaColumn(columnsObj[0].id);
    }

    broadcastChange('STATE_CHANGED');
    showToast(`👑 Sala Criada! Seu ID de Facilitador é ${facilUserId}. Guarde este código para controlar a sala de qualquer aparelho!`);
  };

  // LEAVE / DISCONNECT ACTION
  const handleLeaveRoom = async () => {
    triggerSound('click');
    if (!room || !currentUser) return;

    const savedParticipants: Participant[] = JSON.parse(localStorage.getItem(`participants_${room.pin}`) || '[]');
    const updatedParticipants = savedParticipants.map(p => 
      p.id === currentUser.id ? { ...p, online: false } : p
    );

    localStorage.setItem(`participants_${room.pin}`, JSON.stringify(updatedParticipants));

    try {
      await updateParticipantInFirestore(room.pin, currentUser.id, { online: false });
    } catch (err) {
      console.warn("Firestore leave error:", err);
    }

    broadcastChange('TOAST_ALERT', `${currentUser.avatar} ${currentUser.name} saiu do quadro.`);
    broadcastChange('STATE_CHANGED');

    // Reset local react states
    setRoom(null);
    setIdeas([]);
    setParticipants([]);
    setColumns([]);
    setCurrentUser(null);
  };

  // FACILITATOR: Delete/Shutdown Room completely (irrecoverable)
  const handleDeleteRoomByFacilitator = async () => {
    triggerSound('success');
    if (!room) return;
    const pin = room.pin;

    // Remove all keys related to this room from localStorage
    localStorage.removeItem(`room_${pin}`);
    localStorage.removeItem(`columns_${pin}`);
    localStorage.removeItem(`ideas_${pin}`);
    localStorage.removeItem(`participants_${pin}`);

    try {
      await terminateRoomInFirestore(pin);
    } catch (err) {
      console.warn("Firestore terminate error:", err);
    }

    // Broadcast room destruction to other clients
    broadcastChange('ROOM_TERMINATED', { pin });

    // Reset local states
    setRoom(null);
    setIdeas([]);
    setParticipants([]);
    setColumns([]);
    setCurrentUser(null);
  };

  // DYNAMIC ACTION: Add New Idea Post-it
  const handleAddIdeaSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!room || !currentUser) return;
    if (!newIdeaText.trim()) return;

    const column = columns.find(c => c.id === newIdeaColumn);
    if (column?.locked) {
      alert('Esta etapa está travada pelo facilitador!');
      return;
    }

    const newIdea: Idea = {
      id: `idea_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: newIdeaText.trim(),
      color: newIdeaColor,
      columnId: newIdeaColumn || (columns.length > 0 ? columns[0].id : ''),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      votes: 0,
      reactions: { '👍': 0, '👎': 0 },
      votedUsersByEmoji: { '👍': [], '👎': [] },
      hidden: false,
      createdAt: Date.now()
    };

    const savedIdeas: Idea[] = JSON.parse(localStorage.getItem(`ideas_${room.pin}`) || '[]');
    const updatedIdeas = [...savedIdeas, newIdea];
    localStorage.setItem(`ideas_${room.pin}`, JSON.stringify(updatedIdeas));
    
    setIdeas(updatedIdeas);
    setNewIdeaText('');
    setIsNewIdeaOpen(false);

    triggerSound('pop');

    try {
      await addIdeaToFirestore(room.pin, newIdea);
    } catch (err) {
      console.warn("Firestore add idea error:", err);
    }

    broadcastChange('NEW_POSTIT', newIdea);
  };

  // DYNAMIC ACTION: Upvote / Add Vote dots (delegates to toggling the 👍 emoji)
  const handleVoteIdea = (ideaId: string) => {
    handleReactIdea(ideaId, '👍');
  };

  // DYNAMIC ACTION: Toggle Reaction/Vote with card limits and room total limits
  const handleReactIdea = async (ideaId: string, emoji: string) => {
    if (!room || !currentUser) return;

    const savedIdeas: Idea[] = JSON.parse(localStorage.getItem(`ideas_${room.pin}`) || '[]');
    const targetIdea = savedIdeas.find(i => i.id === ideaId);
    if (!targetIdea) return;

    // Initialize structures
    if (!targetIdea.votedUsersByEmoji) {
      targetIdea.votedUsersByEmoji = {};
    }
    if (!targetIdea.reactions) {
      targetIdea.reactions = {};
    }

    const votedUsers = targetIdea.votedUsersByEmoji[emoji] || [];
    const hasVoted = votedUsers.includes(currentUser.id);

    let updatedIdeas: Idea[] = [];
    let updatedIdeaPayload: Partial<Idea> | null = null;

    if (hasVoted) {
      // Unvote / Toggle Off
      const newVotedUsers = votedUsers.filter(id => id !== currentUser.id);
      
      updatedIdeas = savedIdeas.map(i => {
        if (i.id === ideaId) {
          const reactions = { ...i.reactions };
          reactions[emoji] = Math.max(0, (reactions[emoji] || 1) - 1);
          
          const votedUsersByEmoji = {
            ...i.votedUsersByEmoji,
            [emoji]: newVotedUsers
          };

          // Keep i.votes in sync with the 👍 reactions count for old compatibility
          const votes = emoji === '👍' ? Math.max(0, (i.votes || 0) - 1) : (i.votes || 0);

          updatedIdeaPayload = { reactions, votedUsersByEmoji, votes };
          return { ...i, reactions, votedUsersByEmoji, votes };
        }
        return i;
      });
      triggerSound('click');
    } else {
      // Vote / Toggle On
      
      // Mutual exclusion check: if user already voted the opposite, clear it first
      const oppositeEmoji = emoji === '👍' ? '👎' : '👍';
      const oppositeVotedUsers = targetIdea.votedUsersByEmoji[oppositeEmoji] || [];
      const hadOppositeVote = oppositeVotedUsers.includes(currentUser.id);

      // Check board-level limit (only if not replacing an existing opposite vote)
      if (!hadOppositeVote) {
        const totalCastOnBoard = savedIdeas.reduce((sum, idea) => {
          const ideaVotedUsers = idea.votedUsersByEmoji || {};
          const count = Object.keys(ideaVotedUsers).filter(key => 
            ideaVotedUsers[key]?.includes(currentUser.id)
          ).length;
          return sum + count;
        }, 0);

        if (totalCastOnBoard >= room.maxVotesPerPerson) {
          alert(`Você atingiu o limite de ${room.maxVotesPerPerson} votos/reações no quadro!`);
          return;
        }
      }

      // Safe to cast!
      updatedIdeas = savedIdeas.map(i => {
        if (i.id === ideaId) {
          const reactions = { ...i.reactions };
          const votedUsersByEmoji = { ...i.votedUsersByEmoji };

          // Clear opposite vote if it exists
          if (hadOppositeVote) {
            reactions[oppositeEmoji] = Math.max(0, (reactions[oppositeEmoji] || 1) - 1);
            votedUsersByEmoji[oppositeEmoji] = oppositeVotedUsers.filter(id => id !== currentUser.id);
          }

          // Add new vote
          reactions[emoji] = (reactions[emoji] || 0) + 1;
          votedUsersByEmoji[emoji] = [...(votedUsersByEmoji[emoji] || []), currentUser.id];

          // Compute new compatibility "votes" (using 👍 count as votes)
          const votes = reactions['👍'] || 0;

          updatedIdeaPayload = { reactions, votedUsersByEmoji, votes };
          return { ...i, reactions, votedUsersByEmoji, votes };
        }
        return i;
      });
      triggerSound('vote');
    }

    // Save and update states
    localStorage.setItem(`ideas_${room.pin}`, JSON.stringify(updatedIdeas));
    setIdeas(updatedIdeas);

    // Recalculate each participant's votesLeft
    const savedParticipants: Participant[] = JSON.parse(localStorage.getItem(`participants_${room.pin}`) || '[]');
    const updatedParticipants = savedParticipants.map(p => {
      const pCastCount = updatedIdeas.reduce((sum, idea) => {
        const ideaVotedUsers = idea.votedUsersByEmoji || {};
        const count = Object.keys(ideaVotedUsers).filter(key => 
          ideaVotedUsers[key]?.includes(p.id)
        ).length;
        return sum + count;
      }, 0);

      return {
        ...p,
        votesLeft: Math.max(0, room.maxVotesPerPerson - pCastCount)
      };
    });

    localStorage.setItem(`participants_${room.pin}`, JSON.stringify(updatedParticipants));
    setParticipants(updatedParticipants);

    // Sync self state
    const updatedSelf = updatedParticipants.find(p => p.id === currentUser.id);
    if (updatedSelf) {
      setCurrentUser(updatedSelf);
    }

    // Update in Firestore
    try {
      if (updatedIdeaPayload) {
        await updateIdeaInFirestore(room.pin, ideaId, updatedIdeaPayload);
      }
      if (updatedSelf) {
        await updateParticipantInFirestore(room.pin, currentUser.id, { votesLeft: updatedSelf.votesLeft });
      }
    } catch (err) {
      console.warn("Firestore vote reaction error:", err);
    }

    broadcastChange('STATE_CHANGED');
  };

  // DYNAMIC ACTION: Edit Idea post-it content
  const handleEditIdea = async (ideaId: string, newText: string) => {
    if (!room) return;

    const savedIdeas: Idea[] = JSON.parse(localStorage.getItem(`ideas_${room.pin}`) || '[]');
    const updatedIdeas = savedIdeas.map(i => 
      i.id === ideaId ? { ...i, text: newText } : i
    );

    localStorage.setItem(`ideas_${room.pin}`, JSON.stringify(updatedIdeas));
    setIdeas(updatedIdeas);

    try {
      await updateIdeaInFirestore(room.pin, ideaId, { text: newText });
    } catch (err) {
      console.warn("Firestore edit idea error:", err);
    }

    triggerSound('click');
    broadcastChange('STATE_CHANGED');
  };

  // DYNAMIC ACTION: Delete Idea post-it
  const handleDeleteIdea = async (ideaId: string) => {
    if (!room) return;

    const savedIdeas: Idea[] = JSON.parse(localStorage.getItem(`ideas_${room.pin}`) || '[]');
    const updatedIdeas = savedIdeas.filter(i => i.id !== ideaId);

    localStorage.setItem(`ideas_${room.pin}`, JSON.stringify(updatedIdeas));
    setIdeas(updatedIdeas);

    try {
      await deleteIdeaInFirestore(room.pin, ideaId);
    } catch (err) {
      console.warn("Firestore delete idea error:", err);
    }

    triggerSound('click');
    broadcastChange('STATE_CHANGED');
  };

  // DYNAMIC ACTION: Move Note across columns
  const handleMoveColumn = async (ideaId: string, direction: 'left' | 'right') => {
    if (!room || sortedColumns.length === 0) return;

    const savedIdeas: Idea[] = JSON.parse(localStorage.getItem(`ideas_${room.pin}`) || '[]');
    const idea = savedIdeas.find(i => i.id === ideaId);
    if (!idea) return;

    const currentIdx = sortedColumns.findIndex(c => c.id === idea.columnId);
    let targetIdx = currentIdx;

    if (direction === 'left' && currentIdx > 0) targetIdx--;
    if (direction === 'right' && currentIdx < sortedColumns.length - 1) targetIdx++;

    if (targetIdx !== currentIdx) {
      const targetColumn = sortedColumns[targetIdx];
      if (targetColumn.locked) {
        alert('A coluna de destino está travada!');
        return;
      }

      const updatedIdeas = savedIdeas.map(i => 
        i.id === ideaId ? { ...i, columnId: targetColumn.id } : i
      );

      localStorage.setItem(`ideas_${room.pin}`, JSON.stringify(updatedIdeas));
      setIdeas(updatedIdeas);

      try {
        await updateIdeaInFirestore(room.pin, ideaId, { columnId: targetColumn.id });
      } catch (err) {
        console.warn("Firestore move column error:", err);
      }

      triggerSound('click');
      broadcastChange('STATE_CHANGED');
    }
  };

  // FACILITATOR: Edit Room Setting parameters
  const handleUpdateRoom = async (roomUpdates: Partial<Room>) => {
    if (!room) return;

    const updatedRoom = { ...room, ...roomUpdates };
    localStorage.setItem(`room_${room.pin}`, JSON.stringify(updatedRoom));
    setRoom(updatedRoom);

    try {
      await updateRoomInFirestore(room.pin, roomUpdates);
    } catch (err) {
      console.warn("Firestore update room error:", err);
    }

    broadcastChange('RELOAD_ROOM');
  };

  // FACILITATOR: Lock or Unlock Column Dynamic
  const handleUpdateColumnLock = async (columnId: string, locked: boolean) => {
    if (!room) return;

    const updatedColumns = columns.map(c => 
      c.id === columnId ? { ...c, locked } : c
    );
    localStorage.setItem(`columns_${room.pin}`, JSON.stringify(updatedColumns));
    setColumns(updatedColumns);

    try {
      await updateColumnInFirestore(room.pin, columnId, { locked });
    } catch (err) {
      console.warn("Firestore update column lock error:", err);
    }

    broadcastChange('STATE_CHANGED');
    broadcastChange('TOAST_ALERT', `A etapa "${columns.find(c => c.id === columnId)?.title}" foi ${locked ? 'travada 🔒' : 'destravada 🔓'}`);
  };

  // FACILITATOR: Reveal Hidden post-its
  const handleRevealAllIdeas = async () => {
    if (!room) return;

    const savedIdeas: Idea[] = JSON.parse(localStorage.getItem(`ideas_${room.pin}`) || '[]');
    const updatedIdeas = savedIdeas.map(i => ({ ...i, hidden: false }));
    localStorage.setItem(`ideas_${room.pin}`, JSON.stringify(updatedIdeas));
    setIdeas(updatedIdeas);

    try {
      for (const i of savedIdeas) {
        if (i.hidden) {
          await updateIdeaInFirestore(room.pin, i.id, { hidden: false });
        }
      }
    } catch (err) {
      console.warn("Firestore reveal ideas error:", err);
    }

    triggerSound('success');
    broadcastChange('STATE_CHANGED');
    broadcastChange('TOAST_ALERT', '🎉 O facilitador revelou todas as ideias ocultas!');
  };

  // FACILITATOR: Clear Votes to restart
  const handleClearVotes = async () => {
    if (!room) return;

    // Reset participants votes
    const savedParticipants: Participant[] = JSON.parse(localStorage.getItem(`participants_${room.pin}`) || '[]');
    const updatedParticipants = savedParticipants.map(p => ({
      ...p,
      votesLeft: room.maxVotesPerPerson
    }));
    localStorage.setItem(`participants_${room.pin}`, JSON.stringify(updatedParticipants));
    setParticipants(updatedParticipants);
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, votesLeft: room.maxVotesPerPerson } : null);
    }

    // Reset ideas votes, reactions, and votedUsersByEmoji
    const savedIdeas: Idea[] = JSON.parse(localStorage.getItem(`ideas_${room.pin}`) || '[]');
    const updatedIdeas = savedIdeas.map(i => ({
      ...i,
      votes: 0,
      reactions: { '👍': 0, '👎': 0 },
      votedUsersByEmoji: { '👍': [], '👎': [] }
    }));
    localStorage.setItem(`ideas_${room.pin}`, JSON.stringify(updatedIdeas));
    setIdeas(updatedIdeas);

    try {
      for (const p of savedParticipants) {
        await updateParticipantInFirestore(room.pin, p.id, { votesLeft: room.maxVotesPerPerson });
      }
      for (const i of savedIdeas) {
        await updateIdeaInFirestore(room.pin, i.id, {
          votes: 0,
          reactions: { '👍': 0, '👎': 0 },
          votedUsersByEmoji: { '👍': [], '👎': [] }
        });
      }
    } catch (err) {
      console.warn("Firestore clear votes error:", err);
    }

    triggerSound('success');
    broadcastChange('STATE_CHANGED');
    broadcastChange('TOAST_ALERT', 'Votos e reações reiniciados pelo facilitador.');
  };

  // Quick helper to open New Note pop-up with a specific column pre-selected
  const handleOpenNewIdea = (colId: string) => {
    triggerSound('click');
    const colObj = columns.find(c => c.id === colId);
    if (colObj?.locked) {
      alert('Esta etapa está travada!');
      return;
    }
    setNewIdeaColumn(colId);
    setIsNewIdeaOpen(true);
  };

  // If Admin route is active, render the Admin Console
  if (isAdminRoute) {
    return (
      <AdminConsole onBack={handleNavigateFromAdmin} />
    );
  }

  // If Room not active, show Onboarding Screen
  if (!room || !currentUser) {
    return (
      <Onboarding
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
        prefilledPin={prefilledPin}
        onNavigateToAdmin={handleNavigateToAdmin}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#F3F4F6] font-sans text-slate-800 overflow-hidden relative">
      
      {/* 1. Header Navigation Bar */}
      <Header
        room={room}
        currentUser={currentUser}
        participantCount={participants.filter(p => p.online).length}
        onUpdateRoom={handleUpdateRoom}
        onLeaveRoom={handleLeaveRoom}
        onDeleteRoom={handleDeleteRoomByFacilitator}
        onOpenExport={() => setIsExportOpen(true)}
        onToggleParticipantsMobile={() => setIsParticipantsOpenMobile(!isParticipantsOpenMobile)}
        onToggleFacilitatorMobile={() => setIsFacilitatorOpenMobile(!isFacilitatorOpenMobile)}
      />

      {/* 2. Main Content Area Split Panel */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Sidebar: Live Participants Roster (Desktop) */}
        <div className="hidden lg:block h-full">
          <SidebarParticipants
            room={room}
            participants={participants}
            currentUser={currentUser}
          />
        </div>

        {/* Central Interative Board Canvas */}
        <main className="flex-1 p-3 sm:p-6 overflow-x-auto overflow-y-hidden flex flex-col justify-between">
          
          {/* Status Header Banner */}
          {room.status === 'waiting' && (
            <div id="room_status_banner_waiting" className="mb-3 sm:mb-4 bg-indigo-50/80 border border-indigo-100 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between shadow-3xs animate-in slide-in-from-top-2 duration-200 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl animate-bounce">⏳</span>
                <div>
                  <p className="text-xs font-extrabold text-indigo-900">Aguardando Início da Dinâmica</p>
                  <p className="text-[10px] text-indigo-700 font-medium">O facilitador {room.facilitatorName} iniciará a dinâmica em breve.</p>
                </div>
              </div>
              <span className="text-[9px] bg-indigo-200/60 text-indigo-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Aguarde</span>
            </div>
          )}

          {room.status === 'voting' && (
            <div id="room_status_banner_voting" className="mb-3 sm:mb-4 bg-amber-50/80 border border-amber-100 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between shadow-3xs animate-in slide-in-from-top-2 duration-200 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl">🗳️</span>
                <div>
                  <p className="text-xs font-extrabold text-amber-950">Votação em Aberto!</p>
                  <p className="text-[10px] text-amber-800 font-medium">Use 👍 e 👎 nos post-its para distribuir seus votos (limite: {room.maxVotesPerPerson}).</p>
                </div>
              </div>
              <span className="text-[9px] bg-amber-200/60 text-amber-900 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Votos Liberados</span>
            </div>
          )}

          {room.status === 'locked' && (
            <div id="room_status_banner_locked" className="mb-3 sm:mb-4 bg-rose-50/80 border border-rose-100 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between shadow-3xs animate-in slide-in-from-top-2 duration-200 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl">🔒</span>
                <div>
                  <p className="text-xs font-extrabold text-rose-950">Quadro de Leitura (Congelado)</p>
                  <p className="text-[10px] text-rose-800 font-medium">A dinâmica foi finalizada. Nenhuma alteração pode ser feita.</p>
                </div>
              </div>
              <span className="text-[9px] bg-rose-200/60 text-rose-900 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Somente Leitura</span>
            </div>
          )}

          {/* Mobile Column Switcher Tab Bar */}
          <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-2 mb-2 shrink-0 select-none">
            {sortedColumns.map((col) => {
              const isCurrent = activeMobileTab === col.id;
              const colIdeasCount = ideas.filter(i => i.columnId === col.id).length;
              return (
                <button
                  key={col.id}
                  id={`btn_mobile_tab_${col.id}`}
                  onClick={() => handleScrollToColumn(col.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{col.title}</span>
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                    isCurrent ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {colIdeasCount}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-4 sm:gap-6 h-full overflow-x-auto overflow-y-hidden pb-4 select-none snap-x snap-mandatory">
            {sortedColumns.map((col, colIdx) => {
              const colIdeas = ideas.filter(i => i.columnId === col.id);
              return (
                <section
                  id={`column_${col.id}`}
                  key={col.id}
                  className={`flex flex-col gap-4 bg-white/40 border border-slate-200/50 rounded-xl p-3 sm:p-4 relative h-full w-[85vw] max-w-[320px] sm:w-[320px] shrink-0 snap-center ${
                    col.locked ? 'bg-slate-100/50 opacity-90' : ''
                  }`}
                >
                  {/* Column Header */}
                  <div className={`h-11 border-b-2 ${col.color || 'border-slate-300'} flex items-center justify-between px-1 relative`}>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-700 text-sm md:text-base tracking-tight font-display">{col.title}</h3>
                      <ColumnInfoPopover columnId={col.id} columnTitle={col.title} />
                      {col.locked && <span className="text-[10px] bg-rose-50 text-rose-500 font-extrabold px-1.5 py-0.5 rounded-full border border-rose-100 ml-1">🔒 Travada</span>}
                    </div>
                    <span id={`column_count_${col.id}`} className="text-xs font-bold text-slate-500 bg-slate-200/50 border border-slate-200 px-2.5 py-0.5 rounded-full">
                      {colIdeas.length}
                    </span>
                  </div>
 
                   {/* Columns sticky notes roll */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {colIdeas.length === 0 ? (
                      <div className="h-[200px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-center p-4">
                        <span className="text-2xl mb-2 opacity-50">📝</span>
                        <p className="text-xs text-slate-400 font-medium">Nenhuma nota colada.</p>
                        {!col.locked && room.status === 'active' && (
                          <button
                            id={`btn_quick_add_${col.id}`}
                            onClick={() => handleOpenNewIdea(col.id)}
                            className="mt-3 text-xs bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            + Nova Nota
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {colIdeas.map((idea) => (
                          <IdeaCard
                            key={idea.id}
                            idea={idea}
                            currentUser={currentUser!}
                            anonymizeAuthors={room.anonymizeAuthors}
                            votingModeActive={room.status === 'voting'}
                            roomStatus={room.status}
                            onVote={handleVoteIdea}
                            onReact={handleReactIdea}
                            onEdit={handleEditIdea}
                            onDelete={handleDeleteIdea}
                            onMoveColumn={handleMoveColumn}
                            canMoveLeft={colIdx > 0}
                            canMoveRight={colIdx < columns.length - 1}
                          />
                        ))}
 
                         {/* Interactive Add Note block at the bottom of populated column */}
                        {!col.locked && room.status === 'active' && (
                          <button
                            id={`btn_column_bottom_add_${col.id}`}
                            onClick={() => handleOpenNewIdea(col.id)}
                            className="w-full p-4 bg-white/60 hover:bg-white hover:border-indigo-400 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-1 text-xs font-bold text-slate-400 hover:text-indigo-600 cursor-pointer transition-all"
                          >
                            + Adicionar Nota
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                </section>
              );
            })}
          </div>

          {/* Quick Sound/Volume Selector Indicator in bottom corner */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 mt-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <span className="hidden sm:inline">Canal de sincronização local ativo: <b>ideacao_room_{room.pin}</b></span>
              <span className="sm:hidden font-mono text-[10px]">PIN: <b>{room.pin}</b></span>
            </div>
            
            <button
              id="btn_toggle_sound"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-all flex items-center gap-1 cursor-pointer"
              title={soundEnabled ? 'Mudar para mudo' : 'Ativar som'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-slate-600" />
                  <span className="text-[10px] font-bold text-slate-600 hidden sm:inline">Som Ativo</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">Mudo</span>
                </>
              )}
            </button>
          </div>

        </main>

        {/* Right Sidebar: Facilitator controls panel (Desktop) */}
        {currentUser.isFacilitator && (
          <div className="hidden lg:block h-full">
            <FacilitatorControls
              room={room}
              columns={columns}
              participants={participants}
              onUpdateRoom={handleUpdateRoom}
              onUpdateColumnLock={handleUpdateColumnLock}
              onRevealAllIdeas={handleRevealAllIdeas}
              onClearVotes={handleClearVotes}
            />
          </div>
        )}

      </div>

      {/* Mobile Participants Slide-over Drawer */}
      {isParticipantsOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsParticipantsOpenMobile(false)}
          />
          <div className="relative ml-0 w-80 max-w-[85vw] bg-white h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <SidebarParticipants
              room={room}
              participants={participants}
              currentUser={currentUser}
              onCloseMobile={() => setIsParticipantsOpenMobile(false)}
            />
          </div>
        </div>
      )}

      {/* Mobile Facilitator Controls Slide-over Drawer */}
      {isFacilitatorOpenMobile && currentUser.isFacilitator && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setIsFacilitatorOpenMobile(false)}
          />
          <div className="relative mr-0 w-80 max-w-[85vw] bg-slate-50 h-full shadow-2xl z-10 animate-in slide-in-from-right duration-200">
            <FacilitatorControls
              room={room}
              columns={columns}
              participants={participants}
              onUpdateRoom={handleUpdateRoom}
              onUpdateColumnLock={handleUpdateColumnLock}
              onRevealAllIdeas={handleRevealAllIdeas}
              onClearVotes={handleClearVotes}
              onCloseMobile={() => setIsFacilitatorOpenMobile(false)}
            />
          </div>
        </div>
      )}

      {/* 3. FLOAT FLOATING ACTION BUTTON (Quick Global post-it) */}
      {room.status === 'active' && (
        <button
          id="btn_fab_add_idea"
          onClick={() => {
            triggerSound('click');
            const activeCols = columns.filter(c => !c.locked);
            if (activeCols.length === 0) {
              alert('Todas as etapas estão travadas!');
              return;
            }
            setNewIdeaColumn(activeCols[0].id);
            setIsNewIdeaOpen(true);
          }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-transform flex items-center justify-center text-2xl font-bold border-4 border-white cursor-pointer z-20"
          title="Novo Post-it"
        >
          +
        </button>
      )}

      {/* 4. MODALS OVERLAYS */}

      {/* NEW STICKY NOTE CREATION MODAL */}
      {isNewIdeaOpen && (
        <div id="new_idea_modal_overlay" className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-40 select-none">
          <div id="new_idea_modal_container" className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-800 mb-1 font-display">Adicionar Nota Adesiva</h3>
            <p className="text-[11px] text-slate-400 font-medium mb-4">Escreva sua ideia de forma concisa (até 280 caracteres).</p>
            
            <form id="form_new_idea" onSubmit={handleAddIdeaSubmit} className="space-y-4">
              
              {/* Text Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Ideia</label>
                <textarea
                  id="textarea_new_idea"
                  placeholder="Cole sua sugestão aqui..."
                  maxLength={280}
                  rows={4}
                  value={newIdeaText}
                  onChange={(e) => setNewIdeaText(e.target.value)}
                  className="w-full text-xs font-medium p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-sans leading-relaxed text-slate-800"
                  autoFocus
                  required
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-0.5">
                  <span>Autor: <b>{currentUser.name} {currentUser.avatar}</b></span>
                  <span>{newIdeaText.length}/280 caracteres</span>
                </div>
              </div>

              {/* Column/Etapa Select */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Etapa / Coluna</label>
                <select
                  id="select_new_idea_column"
                  value={newIdeaColumn}
                  onChange={(e) => setNewIdeaColumn(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {columns.map((col) => (
                    <option key={col.id} value={col.id} disabled={col.locked}>
                      {col.title} {col.locked ? '(Travada)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 block">Cor do Post-it</label>
                <div id="color_selectors_row" className="flex gap-2.5">
                  {NOTE_COLORS.map((col) => {
                    const isSelected = newIdeaColor === col.value;
                    return (
                      <button
                        id={`color_btn_${col.value}`}
                        key={col.value}
                        type="button"
                        onClick={() => setNewIdeaColor(col.value)}
                        className={`w-8 h-8 rounded-lg border-2 transition-all cursor-pointer ${col.bg} ${col.border} ${
                          isSelected ? 'ring-2 ring-indigo-400 scale-110 shadow-xs' : 'opacity-80 hover:opacity-100 hover:scale-102'
                        }`}
                        title={col.value}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Footer controls */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  id="btn_cancel_new_idea"
                  type="button"
                  onClick={() => setIsNewIdeaOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  id="btn_submit_new_idea"
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-all"
                >
                  Colar Nota
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EXPORT DATA RELATÓRIO MODAL */}
      {isExportOpen && (
        <ExportModal
          room={room}
          columns={columns}
          ideas={ideas}
          onClose={() => setIsExportOpen(false)}
        />
      )}

      {/* ROOM CAPACITY LIMIT OVERFLOW MODAL */}
      <CapacityLimitModal
        isOpen={isCapacityModalOpen}
        onClose={() => setIsCapacityModalOpen(false)}
        maxCapacity={50}
      />

      {/* REAL-TIME TOAST NOTIFICATION ALERTS */}
      {toastMessage && (
        <div
          id="toast_alert_banner"
          className="fixed bottom-6 left-6 bg-slate-950 text-white text-xs font-bold px-4 py-3 rounded-xl border border-slate-800 shadow-xl flex items-center gap-2.5 max-w-sm animate-slide-up z-50 select-none"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="truncate leading-tight">{toastMessage}</p>
        </div>
      )}

    </div>
  );
}
