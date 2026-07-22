import React, { useState, useEffect } from 'react';
import { AVATARS } from '../data';
import { RoomTemplate, Participant } from '../types';
import { Sparkles, Users, Lock, ChevronRight, Play, ArrowRight, Video, Copy, Check, ExternalLink, Eye, Key, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage, LanguageSelector } from '../context/LanguageContext';
import { signInWithGoogle, logoutUser, auth } from '../lib/firebase';
import { fetchRoomsFromFirestore } from '../services/firebaseRoomService';

interface OnboardingProps {
  onJoinRoom: (pin: string, name: string, avatar: string, googleUid?: string, email?: string, photoURL?: string) => void;
  onCreateRoom: (title: string, facilitatorName: string, template: RoomTemplate, googleUid?: string, email?: string, photoURL?: string) => void;
  prefilledPin?: string;
  onNavigateToAdmin?: () => void;
}

interface OpenRoom {
  pin: string;
  title: string;
  facilitatorName: string;
  template: RoomTemplate;
  status: string;
}

export default function Onboarding({ onJoinRoom, onCreateRoom, prefilledPin = '', onNavigateToAdmin = () => {} }: OnboardingProps) {
  const { t } = useLanguage();
  const [authStep, setAuthStep] = useState<'auth' | 'room'>('auth');
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [pin, setPin] = useState(prefilledPin);
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].emoji);
  const [openRooms, setOpenRooms] = useState<OpenRoom[]>([]);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  // Create room states
  const [facilitatorName, setFacilitatorName] = useState('');
  const [roomTitle, setRoomTitle] = useState('');
  const [roomTemplate, setRoomTemplate] = useState<RoomTemplate>('design-thinking');

  // Google Auth states
  const [googleProfile, setGoogleProfile] = useState<{ uid: string; email: string; displayName: string; photoURL: string } | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    // Check if user is already signed in with Google
    const currentUser = auth.currentUser;
    if (currentUser && !currentUser.isAnonymous) {
      const prof = {
        uid: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || '',
        photoURL: currentUser.photoURL || ''
      };
      setGoogleProfile(prof);
      if (currentUser.displayName) {
        setName(currentUser.displayName);
        setFacilitatorName(currentUser.displayName);
      }
      setAuthStep('room');
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        const profile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || ''
        };
        setGoogleProfile(profile);
        if (user.displayName) {
          setName(user.displayName);
          setFacilitatorName(user.displayName);
        }
        setAuthStep('room');
      }
    } catch (err: any) {
      console.error("Google Sign-In error:", err);
      const code = err?.code || '';
      if (code === 'auth/unauthorized-domain') {
        alert("🌐 Domínio não autorizado no Firebase!\n\nPara permitir o login Google no Netlify:\n1. Acesse o Console do Firebase (Authentication > Settings > Authorized Domains)\n2. Adicione o seu domínio do Netlify (ex: seu-app.netlify.app).\n\nVocê também pode continuar entrando como convidado no botão abaixo.");
      } else if (code === 'auth/admin-restricted-operation') {
        alert("🔒 Operação restrita no Firebase!\n\nVerifique se o login do Google e o login Anônimo estão ativados no Firebase Console em Authentication > Sign-in Method.");
      } else if (code !== 'auth/popup-closed-by-user') {
        alert("Não foi possível conectar com o Google: " + (err?.message || "Erro desconhecido"));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutUser();
    setGoogleProfile(null);
    setAuthStep('auth');
  };

  const handleGuestAuthContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(t('enterNameAlert'));
      return;
    }
    setFacilitatorName(name.trim());
    setAuthStep('room');
  };

  useEffect(() => {
    const loadRooms = async () => {
      const roomMap = new Map<string, OpenRoom>();
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('room_')) {
            const pinVal = key.substring(5);
            const roomData = localStorage.getItem(key);
            if (roomData) {
              const parsed = JSON.parse(roomData);
              roomMap.set(pinVal, {
                pin: pinVal,
                title: parsed.title || 'Sem título',
                facilitatorName: parsed.facilitatorName || 'Anônimo',
                template: parsed.template || 'design-thinking',
                status: parsed.status || 'waiting'
              });
            }
          }
        }

        const fsRooms = await fetchRoomsFromFirestore();
        fsRooms.forEach(r => {
          roomMap.set(r.pin, {
            pin: r.pin,
            title: r.title || 'Sem título',
            facilitatorName: r.facilitatorName || 'Anônimo',
            template: r.template || 'design-thinking',
            status: r.status || 'waiting'
          });
        });

        setOpenRooms(Array.from(roomMap.values()));
      } catch (err) {
        console.error('Error loading open rooms', err);
      }
    };
    loadRooms();
    
    const interval = setInterval(loadRooms, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyPinInList = (pinVal: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(pinVal).then(() => {
      setCopiedPin(pinVal);
      setTimeout(() => setCopiedPin(null), 2000);
    });
  };

  const handleSelectRoom = (roomObj: OpenRoom) => {
    const activeName = googleProfile?.displayName || name.trim() || 'Participante';
    onJoinRoom(
      roomObj.pin, 
      activeName, 
      selectedAvatar, 
      googleProfile?.uid, 
      googleProfile?.email, 
      googleProfile?.photoURL
    );
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.replace(/\s+/g, '');
    if (cleanPin.length !== 6 || !/^\d+$/.test(cleanPin)) {
      alert(t('invalidPinAlert'));
      return;
    }
    const activeName = googleProfile?.displayName || name.trim() || 'Participante';
    onJoinRoom(
      cleanPin, 
      activeName, 
      selectedAvatar, 
      googleProfile?.uid, 
      googleProfile?.email, 
      googleProfile?.photoURL
    );
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomTitle.trim()) {
      alert(t('enterTitleAlert'));
      return;
    }
    const activeFacil = googleProfile?.displayName || facilitatorName.trim() || name.trim();
    if (!activeFacil) {
      alert(t('enterNameAlert'));
      return;
    }
    onCreateRoom(
      roomTitle.trim(), 
      activeFacil, 
      roomTemplate, 
      googleProfile?.uid, 
      googleProfile?.email, 
      googleProfile?.photoURL
    );
  };

  return (
    <div id="onboarding_container" className="min-h-screen bg-[#F3F4F6] flex flex-col items-center justify-center p-4 md:p-6 font-sans relative">
      
      {/* Top Language Selector */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      {/* Title / Branding */}
      <div className="text-center mb-6 max-w-md">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg shadow-indigo-200 mb-3 border border-indigo-500">
          💡
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">
          {t('appName')}
        </h1>
        {/* Step Indicator pill */}
        <div className="mt-2.5 inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-extrabold shadow-3xs">
          <span>{authStep === 'auth' ? t('step1Title') : t('step2Title')}</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
        
        {/* STEP 1: SSO & PROFILE REGISTRATION */}
        {authStep === 'auth' ? (
          <div className="p-6 md:p-8 space-y-5 animate-in fade-in duration-200">
            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-bold text-slate-800">{t('ssoWelcomeTitle')}</h2>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {t('ssoWelcomeSub')}
              </p>
            </div>

            {/* GOOGLE SSO BUTTON */}
            <div className="space-y-2">
              <button
                id="btn_google_signin_step1"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-800 font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer hover:border-indigo-300 hover:shadow-indigo-50/50 active:scale-98"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                {isGoogleLoading ? 'Conectando...' : t('signInWithGoogle')}
              </button>

              <p className="text-[10px] text-slate-400 text-center font-medium">
                {t('googleSignInTip')}
              </p>
            </div>

            {/* DIVIDER */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
                {t('googleGuestDivider')}
              </span>
            </div>

            {/* GUEST PROFILE FORM */}
            <form id="form_guest_auth" onSubmit={handleGuestAuthContinue} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="input_guest_name" className="text-xs font-bold text-slate-700 block">
                  {t('yourNameLabel')}
                </label>
                <input
                  id="input_guest_name"
                  type="text"
                  maxLength={24}
                  placeholder={t('namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring focus:ring-indigo-100 outline-none text-slate-800 transition-all text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">{t('chooseAvatar')}</label>
                <div id="avatar_grid_step1" className="grid grid-cols-6 gap-2">
                  {AVATARS.map((item) => {
                    const isSelected = selectedAvatar === item.emoji;
                    return (
                      <button
                        id={`avatar_step1_${item.emoji}`}
                        key={item.emoji}
                        type="button"
                        onClick={() => setSelectedAvatar(item.emoji)}
                        className={`w-10 h-10 text-lg flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200 scale-105 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                        title={item.label}
                      >
                        {item.emoji}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                id="btn_continue_guest"
                type="submit"
                disabled={!name.trim()}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {t('continueAsGuest')} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* STEP 2: CHOOSE ACTION (JOIN OR CREATE ROOM) */
          <div className="animate-in fade-in duration-200">
            {/* User Account Header Bar */}
            <div className="bg-slate-50 border-b border-slate-200 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {googleProfile?.photoURL ? (
                  <img src={googleProfile.photoURL} alt={googleProfile.displayName} className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {googleProfile ? googleProfile.displayName.charAt(0) : selectedAvatar}
                  </div>
                )}
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {googleProfile?.displayName || name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {googleProfile ? googleProfile.email : 'Convidado'}
                  </p>
                </div>
              </div>

              <button
                id="btn_change_account"
                type="button"
                onClick={handleGoogleLogout}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer shadow-3xs flex items-center gap-1 shrink-0"
              >
                <LogOut className="w-3 h-3" />
                {t('changeAccount')}
              </button>
            </div>

            {/* Room Action Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1">
              <button
                id="tab_join"
                onClick={() => setActiveTab('join')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'join'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t('tabJoin')}
              </button>
              <button
                id="tab_create"
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'create'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t('tabCreate')}
              </button>
            </div>

            <div className="p-6 md:p-8">
              {/* TAB 1: JOIN ROOM */}
              {activeTab === 'join' && (
                <form id="form_pin_join" onSubmit={handleJoinSubmit} className="space-y-5">
                  <div className="space-y-1.5 text-center">
                    <h2 className="text-base font-bold text-slate-800">{t('pinLabel')}</h2>
                    <p className="text-xs text-slate-400">{t('pinPlaceholder')}</p>
                  </div>
                  
                  <div className="relative">
                    <input
                      id="input_pin"
                      type="text"
                      maxLength={6}
                      placeholder="882 109"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-3xl font-bold tracking-widest py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring focus:ring-indigo-100 outline-none text-slate-800 transition-all font-display"
                      autoFocus
                    />
                  </div>

                  <button
                    id="btn_join_room_submit"
                    type="submit"
                    disabled={pin.length !== 6}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    {t('joinRoomBtn')} <Play className="w-4 h-4 fill-white" />
                  </button>
                </form>
              )}

              {/* TAB 2: CREATE ROOM */}
              {activeTab === 'create' && (
                <form id="form_create_room" onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="input_facilitator" className="text-xs font-bold text-slate-700 block">{t('facilitatorNameLabel')}</label>
                    <input
                      id="input_facilitator"
                      type="text"
                      maxLength={24}
                      placeholder={t('facilitatorNamePlaceholder')}
                      value={googleProfile?.displayName || facilitatorName || name}
                      onChange={(e) => setFacilitatorName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring focus:ring-indigo-100 outline-none text-slate-800 transition-all text-sm font-medium bg-slate-50/50"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="input_title" className="text-xs font-bold text-slate-700 block">{t('sessionTitleLabel')}</label>
                    <input
                      id="input_title"
                      type="text"
                      maxLength={50}
                      placeholder={t('sessionTitlePlaceholder')}
                      value={roomTitle}
                      onChange={(e) => setRoomTitle(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring focus:ring-indigo-100 outline-none text-slate-800 transition-all text-sm font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">{t('chooseTemplate')}</label>
                    
                    <div id="template_selection" className="space-y-2">
                      <label
                        id="label_template_dt"
                        className={`flex items-start gap-3 p-2.5 border rounded-xl cursor-pointer transition-all ${
                          roomTemplate === 'design-thinking'
                            ? 'border-indigo-500 bg-indigo-50/50'
                            : 'border-slate-200 bg-slate-50/20 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="template"
                          value="design-thinking"
                          checked={roomTemplate === 'design-thinking'}
                          onChange={() => setRoomTemplate('design-thinking')}
                          className="mt-1 accent-indigo-600 sr-only"
                        />
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0">💡</div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800">{t('dtTitle')}</p>
                          <p className="text-[10px] text-slate-500">{t('dtDesc')}</p>
                        </div>
                      </label>

                      <label
                        id="label_template_sb"
                        className={`flex items-start gap-3 p-2.5 border rounded-xl cursor-pointer transition-all ${
                          roomTemplate === 'sticky-board'
                            ? 'border-indigo-500 bg-indigo-50/50'
                            : 'border-slate-200 bg-slate-50/20 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="template"
                          value="sticky-board"
                          checked={roomTemplate === 'sticky-board'}
                          onChange={() => setRoomTemplate('sticky-board')}
                          className="mt-1 accent-indigo-600 sr-only"
                        />
                        <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center text-sm font-bold shrink-0">📋</div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800">{t('stickyTitle')}</p>
                          <p className="text-[10px] text-slate-500">{t('stickyDesc')}</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <button
                    id="btn_create_submit"
                    type="submit"
                    className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md shadow-slate-100 flex items-center justify-center gap-2 mt-2 cursor-pointer text-sm"
                  >
                    {t('createRoomBtn')} <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Active rooms list */}
      {authStep === 'room' && activeTab === 'join' && openRooms.length > 0 && (
        <div id="open_rooms_card" className="w-full max-w-md mt-6 bg-white border border-slate-200 shadow-md rounded-2xl p-5 md:p-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
            <span className="text-base">🌐</span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{t('activeRoomsTitle')}</h3>
            </div>
          </div>
          
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
            {openRooms.map((roomItem) => {
              return (
                <div
                  key={roomItem.pin}
                  id={`room_list_item_${roomItem.pin}`}
                  onClick={() => handleSelectRoom(roomItem)}
                  className="group flex items-center justify-between p-3 border border-slate-100 hover:border-indigo-200 rounded-xl bg-slate-50/40 hover:bg-indigo-50/10 transition-all cursor-pointer"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm shrink-0">
                        {roomItem.template === 'design-thinking' ? '💡' : '📋'}
                      </span>
                      <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                        {roomItem.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                      <span>Facilitador: {roomItem.facilitatorName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-extrabold font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded tracking-wider">
                        {roomItem.pin}
                      </span>
                    </div>
                    
                    <button
                      id={`btn_copy_list_pin_${roomItem.pin}`}
                      onClick={(e) => handleCopyPinInList(roomItem.pin, e)}
                      className="p-1.5 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-all cursor-pointer"
                      title={t('copyPin')}
                    >
                      {copiedPin === roomItem.pin ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500 hover:text-slate-700" />
                      )}
                    </button>

                    <button
                      id={`btn_join_list_pin_${roomItem.pin}`}
                      onClick={() => handleSelectRoom(roomItem)}
                      className="p-1.5 hover:bg-indigo-100 rounded-lg transition-all text-indigo-600 cursor-pointer"
                      title={t('enterRoom')}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Short quick tips section */}
      <div className="mt-8 text-center max-w-sm text-xs text-slate-400 leading-relaxed space-y-4">
        <div className="pt-1">
          <button
            id="btn_onboarding_go_admin"
            onClick={onNavigateToAdmin}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 bg-white hover:bg-indigo-50/40 border border-slate-200 px-3 py-1.5 rounded-full transition-all shadow-3xs cursor-pointer"
          >
            <Key className="w-3 h-3 text-slate-400 animate-pulse" />
            {t('adminPanel')}
          </button>
        </div>
      </div>

    </div>
  );
}
