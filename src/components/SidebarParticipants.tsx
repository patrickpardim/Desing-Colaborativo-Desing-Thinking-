import React from 'react';
import { Participant, Room } from '../types';
import { Users } from 'lucide-react';

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
  const onlineParticipants = participants.filter(p => p.online);
  const facilitator = participants.find(p => p.isFacilitator);

  const getStatusText = () => {
    switch (room.status) {
      case 'waiting':
        return 'Aguardando início...';
      case 'active':
        return 'Ideação ativa! 💡';
      case 'voting':
        return 'Modo Votação 🗳️';
      case 'locked':
        return 'Sessão Travada 🔒';
      default:
        return 'Sessão Ativa';
    }
  };

  const getStatusDesc = () => {
    switch (room.status) {
      case 'waiting':
        return 'Aguardando o facilitador dar início à dinâmica.';
      case 'active':
        return 'Adicione post-its e contribua com suas ideias!';
      case 'voting':
        return 'Escolha as melhores ideias com seus votos.';
      case 'locked':
        return 'Quadro bloqueado para leitura e consolidação.';
      default:
        return 'Brainstorming em progresso.';
    }
  };

  return (
    <aside id="participants_sidebar" className="w-52 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 h-full select-none">
      
      <div className="space-y-5 flex-1 overflow-y-auto">
        
        {/* Participants Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3" /> Participantes ({onlineParticipants.length})
            </h3>
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
                      <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-sm">
                        {p.avatar}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">
                        {p.name} {isSelf && <span className="text-[9px] text-indigo-500 font-medium font-sans">(Você)</span>}
                      </p>
                      <p className="text-[9px] font-medium text-slate-400 leading-none">
                        {p.isFacilitator ? 'Facilitador 👑' : `Votos: ${p.votesLeft}`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic / Phase Status Card */}
        <div id="dynamic_status_card" className="p-3.5 bg-indigo-50/80 rounded-xl border border-indigo-100/50">
          <p className="text-[9px] text-indigo-600 font-bold tracking-widest uppercase mb-1">Status da Sala</p>
          <p id="status_text" className="text-xs font-extrabold text-indigo-950 leading-tight">
            {getStatusText()}
          </p>
          <p id="status_desc" className="text-[10px] text-indigo-700/80 mt-1 leading-snug">
            {getStatusDesc()}
          </p>
         </div>

      </div>

    </aside>
  );
}
