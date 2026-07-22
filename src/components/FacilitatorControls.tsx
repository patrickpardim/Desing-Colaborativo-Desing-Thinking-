import React, { useMemo } from 'react';
import { Room, RoomColumn, RoomTemplate, Participant } from '../types';
import { Settings, Shield, Lock, Unlock, Eye, EyeOff, Check, Copy, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { KNOWN_COLUMN_ORDER } from '../data';
import ColumnInfoPopover from './ColumnInfoPopover';

interface FacilitatorControlsProps {
  room: Room;
  columns: RoomColumn[];
  participants: Participant[];
  onUpdateRoom: (roomUpdates: Partial<Room>) => void;
  onUpdateColumnLock: (columnId: string, locked: boolean) => void;
  onRevealAllIdeas: () => void;
  onClearVotes: () => void;
  onCloseMobile?: () => void;
}

export default function FacilitatorControls({
  room,
  columns,
  participants,
  onUpdateRoom,
  onUpdateColumnLock,
  onRevealAllIdeas,
  onClearVotes,
  onCloseMobile
}: FacilitatorControlsProps) {
  const { t } = useLanguage();
  const [copiedLink, setCopiedLink] = React.useState(false);

  const handleAnonymizeToggle = () => {
    onUpdateRoom({ anonymizeAuthors: !room.anonymizeAuthors });
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${room.pin}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  return (
    <aside id="facilitator_controls_sidebar" className="w-full lg:w-64 bg-slate-50 border-l border-slate-200 p-5 flex flex-col justify-between shrink-0 h-full select-none overflow-y-auto">
      
      <div className="space-y-6">
        {/* Sidebar Header */}
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-600" /> {t('controlPanelTitle')}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">{t('controlPanelSubtitle')}</p>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Phase/Status selector */}
        <div className="space-y-3">
          <label className="text-xs font-extrabold text-slate-700 uppercase block tracking-wider">{t('dynamicState')}</label>
          
          {/* Big pulsing Play button if waiting */}
          {room.status === 'waiting' && (
            <button
              id="btn_facilitator_play"
              onClick={() => onUpdateRoom({ status: 'active' })}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-[1.02] flex flex-col items-center justify-center gap-1 cursor-pointer animate-pulse"
              title="Iniciar Dinâmica"
            >
              <span className="flex items-center gap-1.5 text-sm">{t('pressPlay')}</span>
              <span className="text-[9px] font-semibold text-emerald-100 uppercase tracking-widest">{t('releaseToAll')}</span>
            </button>
          )}

          <div className="flex flex-col gap-2">
            {[
              { value: 'waiting', label: t('stateWaiting'), icon: '⏳', desc: t('stateWaitingDesc'), color: 'border-slate-300' },
              { value: 'active', label: t('stateActive'), icon: '✍️', desc: t('stateActiveDesc'), color: 'border-indigo-500' },
              { value: 'voting', label: t('stateVoting'), icon: '🗳️', desc: t('stateVotingDesc'), color: 'border-amber-500' },
              { value: 'locked', label: t('stateLocked'), icon: '🔒', desc: t('stateLockedDesc'), color: 'border-rose-500' }
            ].map((st) => {
              const isActive = room.status === st.value;
              return (
                <button
                  key={st.value}
                  id={`btn_state_select_${st.value}`}
                  onClick={() => onUpdateRoom({ status: st.value as any })}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2 cursor-pointer ${
                    isActive
                      ? `bg-white border-2 ${st.color} shadow-xs font-bold`
                      : 'bg-white/40 border-slate-200 hover:bg-white text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <span className="text-sm shrink-0 mt-0.5">{st.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[11px] ${isActive ? 'text-slate-900 font-extrabold' : 'text-slate-700 font-semibold'}`}>
                      {st.label}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5 font-medium leading-tight">
                      {st.desc}
                    </p>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 self-center shrink-0 animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive column locking controls */}
        <div className="space-y-2.5">
          <label className="text-xs font-extrabold text-slate-700 uppercase block">{t('lockColumns')}</label>
          <div id="column_locking_list" className="space-y-2">
            {[...columns].sort((a, b) => {
              const orderA = a.order ?? KNOWN_COLUMN_ORDER[a.id] ?? (parseInt(a.title) || 99);
              const orderB = b.order ?? KNOWN_COLUMN_ORDER[b.id] ?? (parseInt(b.title) || 99);
              if (orderA !== orderB) return orderA - orderB;
              return a.title.localeCompare(b.title);
            }).map((col) => (
              <div key={col.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 text-xs shadow-3xs relative">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="font-bold text-slate-700 truncate max-w-[120px]">{col.title}</span>
                  <ColumnInfoPopover columnId={col.id} columnTitle={col.title} align="right" />
                </div>
                <button
                  id={`btn_toggle_lock_${col.id}`}
                  onClick={() => onUpdateColumnLock(col.id, !col.locked)}
                  className={`px-2 py-1 rounded font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    col.locked
                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}
                  title={col.locked ? t('unlockColumnTitle') : t('lockColumnTitle')}
                >
                  {col.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  <span>{col.locked ? t('columnLocked') : t('columnActive')}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Switches */}
        <div className="space-y-3 pt-3 border-t border-slate-200">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('generalSettings')}</h4>
          
          {/* Anonymization switch */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">{t('hideAuthors')}</span>
            <button
              id="btn_toggle_anonymize"
              onClick={handleAnonymizeToggle}
              className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${
                room.anonymizeAuthors ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${
                  room.anonymizeAuthors ? 'right-1' : 'left-1'
                }`}
              ></span>
            </button>
          </div>

          {/* Quick reveal actions */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              id="btn_reveal_all"
              onClick={onRevealAllIdeas}
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm shadow-indigo-100 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" /> {t('revealAllIdeas')}
            </button>

            <button
              id="btn_clear_votes"
              onClick={onClearVotes}
              className="w-full py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {t('clearAllVotes')}
            </button>
          </div>
        </div>

      </div>

      {/* Shareable Link display at bottom */}
      <div id="facilitator_share_widget" className="mt-6 pt-4 border-t border-slate-200">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs">
          <p className="text-[9px] text-slate-400 uppercase font-extrabold mb-1.5 tracking-wider">{t('copyLink')}</p>
          <div className="flex items-center justify-between gap-1.5">
            <div className="bg-slate-50 text-[10px] font-mono p-1.5 border rounded overflow-hidden whitespace-nowrap text-ellipsis flex-1 text-slate-500">
              {window.location.origin}/?room={room.pin}
            </div>
            <button
              id="btn_sidebar_copy"
              onClick={handleCopyShareLink}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-xs transition-all shrink-0 cursor-pointer"
              title={t('copyLink')}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            </button>
          </div>
        </div>
      </div>

    </aside>
  );
}

