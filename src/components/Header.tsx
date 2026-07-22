import React, { useEffect, useState } from 'react';
import { Room, Participant } from '../types';
import { Play, Pause, RotateCcw, Share2, LogOut, Download, AlertCircle, Copy, Check, Edit2, X, Users, Shield, Menu } from 'lucide-react';
import { useLanguage, LanguageSelector } from '../context/LanguageContext';

interface HeaderProps {
  room: Room;
  currentUser: Participant;
  participantCount?: number;
  onUpdateRoom: (roomUpdates: Partial<Room>) => void;
  onLeaveRoom: () => void;
  onDeleteRoom: () => void;
  onOpenExport: () => void;
  onToggleParticipantsMobile?: () => void;
  onToggleFacilitatorMobile?: () => void;
}

export default function Header({
  room,
  currentUser,
  participantCount = 1,
  onUpdateRoom,
  onLeaveRoom,
  onDeleteRoom,
  onOpenExport,
  onToggleParticipantsMobile,
  onToggleFacilitatorMobile
}: HeaderProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(room.title);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Keep internal edit state updated with external room changes
  useEffect(() => {
    if (!isEditingTitle) {
      setNewTitle(room.title);
    }
  }, [room.title, isEditingTitle]);

  // Timer tick effect
  useEffect(() => {
    if (!currentUser.isFacilitator) return; // ONLY the facilitator's tab drives the countdown ticker
    
    let interval: NodeJS.Timeout;
    if (room.timerActive && room.timerSeconds > 0) {
      interval = setInterval(() => {
        onUpdateRoom({ timerSeconds: room.timerSeconds - 1 });
      }, 1000);
    } else if (room.timerSeconds === 0 && room.timerActive) {
      // Trigger auto pause
      onUpdateRoom({ timerActive: false });
    }
    return () => clearInterval(interval);
  }, [room.timerActive, room.timerSeconds, onUpdateRoom, currentUser.isFacilitator]);

  const toggleTimer = () => {
    if (!currentUser.isFacilitator) return;
    onUpdateRoom({ timerActive: !room.timerActive });
  };

  const resetTimer = () => {
    if (!currentUser.isFacilitator) return;
    onUpdateRoom({ timerSeconds: 300, timerActive: false }); // 5 minutes default
  };

  const handleTimerEdit = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!currentUser.isFacilitator) return;
    onUpdateRoom({ timerSeconds: parseInt(e.target.value), timerActive: false });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${room.pin}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(room.pin).then(() => {
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    });
  };

  return (
    <header id="header_container" className="min-h-[56px] md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-6 shrink-0 shadow-2xs z-30 relative">
      
      {/* Brand / Dynamic Title */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-base md:text-lg shadow-xs shrink-0">
          💡
        </div>
        <div className="min-w-0">
          {isEditingTitle ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newTitle.trim()) {
                  onUpdateRoom({ title: newTitle.trim() });
                  setIsEditingTitle(false);
                }
              }}
              className="flex items-center gap-1"
            >
              <input
                id="input_edit_room_title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={40}
                className="bg-slate-100 border border-slate-300 rounded px-2 py-0.5 text-slate-800 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[140px] md:max-w-[180px]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setNewTitle(room.title);
                    setIsEditingTitle(false);
                  }
                }}
              />
              <button
                type="submit"
                id="btn_save_room_title"
                className="p-1 hover:bg-slate-100 text-emerald-600 rounded transition-all cursor-pointer"
                title={t('saveBtn')}
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                id="btn_cancel_room_title"
                onClick={() => {
                  setNewTitle(room.title);
                  setIsEditingTitle(false);
                }}
                className="p-1 hover:bg-slate-100 text-slate-400 rounded transition-all cursor-pointer"
                title={t('cancelBtn')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1 group min-w-0">
              <h1 id="header_title" className="font-bold text-slate-800 text-xs sm:text-sm md:text-base leading-tight max-w-[110px] sm:max-w-[200px] md:max-w-[300px] truncate">
                {room.title}
              </h1>
              {currentUser.isFacilitator && (
                <button
                  id="btn_edit_room_title"
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-all sm:opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shrink-0"
                  title={t('editTitleTooltip')}
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
          <p id="header_facilitator" className="text-[9px] md:text-[10px] text-slate-400 font-medium truncate hidden sm:block">
            {t('facilitatorBadge')}: <span className="text-slate-600">@{room.facilitatorName}</span>
          </p>
        </div>
      </div>

      {/* Center Info Panel: Timer, Status, PIN */}
      <div className="flex items-center bg-slate-100/90 rounded-full px-2.5 sm:px-4 py-1 gap-2 sm:gap-4 md:gap-6 border border-slate-200/60 shadow-3xs mx-1">

        {/* Real-time Dynamic Timer */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {currentUser.isFacilitator ? (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                id="btn_toggle_timer"
                onClick={toggleTimer}
                className="p-1 hover:bg-slate-200 rounded transition-all text-slate-600 hover:text-slate-900 cursor-pointer"
                title={room.timerActive ? t('timerPause') : t('timerStart')}
              >
                {room.timerActive ? <Pause className="w-3.5 h-3.5 fill-slate-600" /> : <Play className="w-3.5 h-3.5 fill-slate-600" />}
              </button>
              <button
                id="btn_reset_timer"
                onClick={resetTimer}
                className="p-1 hover:bg-slate-200 rounded transition-all text-slate-600 hover:text-slate-900 cursor-pointer hidden sm:block"
                title={t('timerReset')}
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-800">
                {formatTime(room.timerSeconds)}
              </span>

              {room.timerSeconds === 0 && (
                <span className="text-xs text-rose-500 flex items-center gap-0.5 animate-bounce font-bold">
                  <AlertCircle className="w-3 h-3" />
                </span>
              )}

              <select
                id="select_timer_duration"
                value=""
                onChange={handleTimerEdit}
                className="bg-transparent text-[9px] sm:text-[10px] font-bold text-slate-500 border border-slate-300 rounded px-1 py-0.5 focus:outline-none cursor-pointer hover:bg-slate-200 hidden sm:block"
                title="Ajustar tempo"
              >
                <option value="" disabled>Ajustar</option>
                <option value={60}>01:00</option>
                <option value={120}>02:00</option>
                <option value={180}>03:00</option>
                <option value={300}>05:00</option>
                <option value={600}>10:00</option>
                <option value={900}>15:00</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-800">
                {formatTime(room.timerSeconds)}
              </span>
              {room.timerSeconds === 0 && (
                <span className="text-xs text-rose-500 flex items-center gap-0.5 animate-bounce font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          )}
        </div>

        <div className="h-3 sm:h-4 w-px bg-slate-300"></div>

        {/* PIN Code with Share Capability */}
        <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold tracking-wider text-slate-700">
          <span className="text-slate-400 font-medium select-none text-[10px] sm:text-xs">PIN:</span>
          <span id="header_pin" className="font-mono font-extrabold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-3xs text-xs sm:text-sm">
            {room.pin}
          </span>
          <button
            id="btn_copy_pin"
            onClick={handleCopyPin}
            className="p-1 hover:bg-slate-200 rounded transition-all cursor-pointer"
            title={t('copyPin')}
          >
            {copiedPin ? <Check className="w-3 h-3 text-emerald-600 font-bold" /> : <Copy className="w-3 h-3 text-slate-500" />}
          </button>
          <button
            id="btn_copy_link"
            onClick={handleCopyLink}
            className="p-1 hover:bg-slate-200 rounded transition-all cursor-pointer hidden sm:block"
            title={t('copyLink')}
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3 text-slate-500" />}
          </button>
        </div>

      </div>

      {/* Global Actions Desktop */}
      <div className="hidden lg:flex items-center gap-2">
        <LanguageSelector compact />

        <button
          id="btn_export_results"
          onClick={onOpenExport}
          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> {t('exportSession')}
        </button>

        {currentUser.isFacilitator ? (
          <>
            <button
              id="btn_leave_room_only"
              onClick={() => setShowLeaveModal(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
              title={t('leaveBtn')}
            >
              <LogOut className="w-3.5 h-3.5" /> {t('leaveBtn')}
            </button>

            <button
              id="btn_terminate_room"
              onClick={() => setShowEndModal(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title={t('endRoomBtn')}
            >
              <X className="w-3.5 h-3.5" /> {t('endRoomBtn')}
            </button>
          </>
        ) : (
          <button
            id="btn_leave_room"
            onClick={onLeaveRoom}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> {t('leaveBtn')}
          </button>
        )}
      </div>

      {/* Mobile Drawer Trigger Buttons */}
      <div className="flex lg:hidden items-center gap-1">
        {onToggleParticipantsMobile && (
          <button
            id="btn_mobile_toggle_participants"
            onClick={onToggleParticipantsMobile}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Participantes"
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-1 rounded-full">{participantCount}</span>
          </button>
        )}

        {currentUser.isFacilitator && onToggleFacilitatorMobile && (
          <button
            id="btn_mobile_toggle_facilitator"
            onClick={onToggleFacilitatorMobile}
            className="p-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Painel Facilitador"
          >
            <Shield className="w-4 h-4" />
          </button>
        )}

        <button
          id="btn_mobile_menu_toggle"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
          title="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Popover Menu Overlay */}
      {showMobileMenu && (
        <div className="absolute top-full right-2 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700">Opções da Sala</span>
            <button
              onClick={() => setShowMobileMenu(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="py-1">
            <LanguageSelector />
          </div>

          <button
            id="btn_mobile_export"
            onClick={() => {
              setShowMobileMenu(false);
              onOpenExport();
            }}
            className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> {t('exportSession')}
          </button>

          {currentUser.isFacilitator ? (
            <>
              <button
                id="btn_mobile_leave_facilitator"
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowLeaveModal(true);
                }}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> {t('leaveBtn')}
              </button>

              <button
                id="btn_mobile_end_room"
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowEndModal(true);
                }}
                className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <X className="w-4 h-4" /> {t('endRoomBtn')}
              </button>
            </>
          ) : (
            <button
              id="btn_mobile_leave_student"
              onClick={() => {
                setShowMobileMenu(false);
                onLeaveRoom();
              }}
              className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> {t('leaveBtn')}
            </button>
          )}
        </div>
      )}

      {/* Leave Room Confirmation Modal for Facilitator */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-800">{t('leaveModalTitle')}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t('leaveModalDesc')}
                </p>
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 mt-2">
                  <p className="text-[11px] text-amber-800 font-medium">
                    {t('leaveModalTip', { pin: room.pin, facilitatorName: room.facilitatorName })}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                id="btn_cancel_leave_modal"
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
              >
                {t('cancelBtn')}
              </button>
              <button
                id="btn_confirm_leave_modal"
                onClick={() => {
                  setShowLeaveModal(false);
                  onLeaveRoom();
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {t('confirmLeaveBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Room Confirmation Modal for Facilitator */}
      {showEndModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1 animate-in">
                <h3 className="text-base font-extrabold text-slate-800">{t('endModalTitle')}</h3>
                <p className="text-xs text-rose-600 font-extrabold flex items-center gap-1">
                  {t('endModalWarning')}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t('endModalDesc')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                id="btn_cancel_end_modal"
                onClick={() => setShowEndModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
              >
                {t('cancelBtn')}
              </button>
              <button
                id="btn_confirm_end_modal"
                onClick={() => {
                  setShowEndModal(false);
                  onDeleteRoom();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
              >
                {t('confirmEndBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
}


