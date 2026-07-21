import React, { useState, useEffect } from 'react';
import { AVATARS } from '../data';
import { RoomTemplate, Participant } from '../types';
import { Sparkles, Users, Lock, ChevronRight, Play, ArrowRight, Video, Copy, Check, ExternalLink, Eye, Key } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage, LanguageSelector } from '../context/LanguageContext';

interface OnboardingProps {
  onJoinRoom: (pin: string, name: string, avatar: string) => void;
  onCreateRoom: (title: string, facilitatorName: string, template: RoomTemplate) => void;
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
  const [activeTab, setActiveTab] = useState<'join' | 'create'>('join');
  const [pin, setPin] = useState(prefilledPin);
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].emoji);
  const [step, setStep] = useState<'pin' | 'profile'>((prefilledPin && prefilledPin.length === 6) ? 'profile' : 'pin');
  const [openRooms, setOpenRooms] = useState<OpenRoom[]>([]);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  // Create room states
  const [facilitatorName, setFacilitatorName] = useState('');
  const [roomTitle, setRoomTitle] = useState('');
  const [roomTemplate, setRoomTemplate] = useState<RoomTemplate>('design-thinking');

  useEffect(() => {
    const loadRooms = () => {
      const rooms: OpenRoom[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('room_')) {
            const pinVal = key.substring(5); // room_123456 -> 123456
            const roomData = localStorage.getItem(key);
            if (roomData) {
              const parsed = JSON.parse(roomData);
              rooms.push({
                pin: pinVal,
                title: parsed.title || 'Sem título',
                facilitatorName: parsed.facilitatorName || 'Anônimo',
                template: parsed.template || 'design-thinking',
                status: parsed.status || 'waiting'
              });
            }
          }
        }
        setOpenRooms(rooms);
      } catch (err) {
        console.error('Error loading open rooms', err);
      }
    };
    loadRooms();
    
    // Listen for room storage updates or BroadcastChannel if needed, but simple interval is robust
    const interval = setInterval(loadRooms, 3000);
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
    setPin(roomObj.pin);
    setActiveTab('join');
    setStep('profile');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.replace(/\s+/g, '');
    if (cleanPin.length === 6 && /^\d+$/.test(cleanPin)) {
      setStep('profile');
    } else {
      alert(t('invalidPinAlert'));
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(t('enterNameAlert'));
      return;
    }
    const cleanPin = pin.replace(/\s+/g, '');
    onJoinRoom(cleanPin, name.trim(), selectedAvatar);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomTitle.trim()) {
      alert(t('enterTitleAlert'));
      return;
    }
    if (!facilitatorName.trim()) {
      alert(t('enterNameAlert'));
      return;
    }
    onCreateRoom(roomTitle.trim(), facilitatorName.trim(), roomTemplate);
  };

  return (
    <div id="onboarding_container" className="min-h-screen bg-[#F3F4F6] flex flex-col items-center justify-center p-4 md:p-6 font-sans relative">
      
      {/* Top Language Selector */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      {/* Title / Branding */}
      <div className="text-center mb-8 max-w-md">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg shadow-indigo-200 mb-4 border border-indigo-500">
          💡
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">
          {t('appName')}
        </h1>
      </div>

      {/* Main Form Box */}
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
        
        {/* Tab selector */}
        {step === 'pin' && (
          <div className="flex border-b border-slate-100 bg-slate-50 p-1.5 gap-1">
            <button
              id="tab_join"
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'join'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t('tabJoin')}
            </button>
            <button
              id="tab_create"
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'create'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t('tabCreate')}
            </button>
          </div>
        )}

        <div className="p-6 md:p-8">
          
          {/* TAB 1: JOIN ROOM */}
          {activeTab === 'join' && (
            <div>
              {step === 'pin' ? (
                <form id="form_pin" onSubmit={handlePinSubmit} className="space-y-6">
                  <div className="space-y-2 text-center">
                    <h2 className="text-lg font-bold text-slate-800">{t('pinLabel')}</h2>
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
                    id="btn_continue_pin"
                    type="submit"
                    disabled={pin.length !== 6}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {t('continueBtn')} <ChevronRight className="w-5 h-5" />
                  </button>
                </form>
              ) : (
                <form id="form_profile" onSubmit={handleJoinSubmit} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep('pin')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      ← {t('backBtn')}
                    </button>
                    <span className="text-xs font-mono font-bold px-2 py-1 bg-slate-100 rounded text-slate-600">
                      PIN: {pin}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="input_name" className="text-sm font-bold text-slate-700">{t('yourNameLabel')}</label>
                    <input
                      id="input_name"
                      type="text"
                      maxLength={24}
                      placeholder={t('namePlaceholder')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring focus:ring-indigo-100 outline-none text-slate-800 transition-all text-sm font-medium"
                      autoFocus
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700 block">{t('chooseAvatar')}</label>
                    <div id="avatar_grid" className="grid grid-cols-6 gap-2">
                      {AVATARS.map((item) => {
                        const isSelected = selectedAvatar === item.emoji;
                        return (
                          <button
                            id={`avatar_${item.emoji}`}
                            key={item.emoji}
                            type="button"
                            onClick={() => setSelectedAvatar(item.emoji)}
                            className={`w-11 h-11 text-xl flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200 scale-105 shadow-sm'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:scale-102'
                            }`}
                            title={item.label}
                          >
                            {item.emoji}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-[11px] text-slate-500 leading-relaxed font-medium">
                    {t('facilitatorTip')}
                  </div>

                  <button
                    id="btn_join_submit"
                    type="submit"
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {t('joinRoomBtn')} <Play className="w-4 h-4 fill-white" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: CREATE ROOM */}
          {activeTab === 'create' && (
            <form id="form_create_room" onSubmit={handleCreateSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="input_facilitator" className="text-sm font-bold text-slate-700">{t('facilitatorNameLabel')}</label>
                <input
                  id="input_facilitator"
                  type="text"
                  maxLength={24}
                  placeholder={t('facilitatorNamePlaceholder')}
                  value={facilitatorName}
                  onChange={(e) => setFacilitatorName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring focus:ring-indigo-100 outline-none text-slate-800 transition-all text-sm font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="input_title" className="text-sm font-bold text-slate-700">{t('sessionTitleLabel')}</label>
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
                <label className="text-sm font-bold text-slate-700 block mb-2">{t('chooseTemplate')}</label>
                
                <div id="template_selection" className="space-y-2.5">
                  <label
                    id="label_template_dt"
                    className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
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
                      <p className="text-sm font-bold text-slate-800">{t('dtTitle')}</p>
                      <p className="text-[11px] text-slate-500">{t('dtDesc')}</p>
                    </div>
                  </label>

                  <label
                    id="label_template_sb"
                    className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
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
                      <p className="text-sm font-bold text-slate-800">{t('stickyTitle')}</p>
                      <p className="text-[11px] text-slate-500">{t('stickyDesc')}</p>
                    </div>
                  </label>

                </div>
              </div>

              <button
                id="btn_create_submit"
                type="submit"
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md shadow-slate-100 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {t('createRoomBtn')} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
      
      {/* Active rooms list */}
      {step === 'pin' && openRooms.length > 0 && (
        <div id="open_rooms_card" className="w-full max-w-md mt-6 bg-white border border-slate-200 shadow-md rounded-2xl p-5 md:p-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
            <span className="text-base">🌐</span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{t('activeRoomsTitle')}</h3>
            </div>
          </div>
          
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
            {openRooms.map((roomItem) => {
              const statusColors: Record<string, string> = {
                waiting: 'bg-slate-100 text-slate-600 border-slate-200',
                active: 'bg-indigo-50 text-indigo-700 border-indigo-100',
                voting: 'bg-amber-50 text-amber-700 border-amber-100',
                locked: 'bg-rose-50 text-rose-700 border-rose-100'
              };
              
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
