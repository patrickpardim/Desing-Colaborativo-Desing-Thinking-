import React from 'react';
import { Participant, Room } from '../types';
import { Users } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SidebarParticipantsProps {
  room: Room;
  participants: Participant[];
  currentUser: Participant;
}

export default function SidebarParticipants({
  room,
  participants,
  currentUser
}: SidebarParticipantsProps) {
  const { t } = useLanguage();
  const onlineParticipants = participants.filter(p => p.online);

  return (
    <aside id="participants_sidebar" className="w-52 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 h-full select-none">
      
      <div className="space-y-5 flex-1 overflow-y-auto">
        
        {/* Participants Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3" /> {t('participantsTitle')} ({participants.length}/50)
            </h3>
            {participants.length >= 50 && (
              <span className="text-[9px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded">
                Cheio
              </span>
            )}
          </div>

          {/* Participants List */}
          <div id="participants_list" className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
            {onlineParticipants.map((p) => {
              const isSelf = p.id === currentUser.id;
              return (
                <div
                  id={`participant_item_${p.id}`}
                  key={p.id}
                  className={`flex items-center justify-between p-1.5 rounded-lg border transition-all ${
                    isSelf 
                      ? 'bg-indigo-50/50 border-indigo-100 shadow-3xs' 
                      : 'bg-transparent border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative">
                      {p.photoURL ? (
                        <img src={p.photoURL} alt={p.name} className="w-8 h-8 rounded-full border border-slate-200 object-cover shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-sm shrink-0">
                          {p.avatar}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">
                        {p.name} {isSelf && <span className="text-[9px] text-indigo-500 font-medium font-sans">({t('youBadge')})</span>}
                      </p>
                      <p className="text-[9px] font-medium text-slate-400 leading-none">
                        {p.isFacilitator ? `${t('facilitatorBadge')} 👑` : `${p.votesLeft} ${t('votesRemaining')}`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </aside>
  );
}
