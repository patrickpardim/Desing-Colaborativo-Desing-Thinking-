import React, { useState, useEffect } from 'react';
import { Trash2, Search, ArrowLeft, Users, FileText, Layout, Key, Sparkles, Filter, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { RoomTemplate } from '../types';

interface AdminConsoleProps {
  onBack: () => void;
}

interface AdminRoom {
  pin: string;
  title: string;
  facilitatorName: string;
  template: RoomTemplate;
  status: string;
  ideasCount: number;
  participantsCount: number;
}

export default function AdminConsole({ onBack }: AdminConsoleProps) {
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTemplate, setFilterTemplate] = useState<string>('all');
  const [confirmDeletePin, setConfirmDeletePin] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const loadRoomsData = () => {
    const loadedRooms: AdminRoom[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('room_')) {
          const pin = key.substring(5);
          const roomRaw = localStorage.getItem(key);
          if (roomRaw) {
            const parsedRoom = JSON.parse(roomRaw);
            
            // Get ideas count
            const ideasRaw = localStorage.getItem(`ideas_${pin}`);
            const ideasCount = ideasRaw ? JSON.parse(ideasRaw).length : 0;
            
            // Get participants count
            const participantsRaw = localStorage.getItem(`participants_${pin}`);
            const participantsCount = participantsRaw ? JSON.parse(participantsRaw).length : 0;

            loadedRooms.push({
              pin,
              title: parsedRoom.title || 'Sem título',
              facilitatorName: parsedRoom.facilitatorName || 'Anônimo',
              template: parsedRoom.template || 'design-thinking',
              status: parsedRoom.status || 'waiting',
              ideasCount,
              participantsCount
            });
          }
        }
      }
      setRooms(loadedRooms);
    } catch (err) {
      console.error('Error loading rooms for admin', err);
    }
  };

  useEffect(() => {
    loadRoomsData();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleDeleteRoom = (pin: string) => {
    try {
      // Remove all keys related to this room
      localStorage.removeItem(`room_${pin}`);
      localStorage.removeItem(`columns_${pin}`);
      localStorage.removeItem(`ideas_${pin}`);
      localStorage.removeItem(`participants_${pin}`);
      
      // Reload lists
      loadRoomsData();
      setConfirmDeletePin(null);
      showNotification(`Sala [PIN ${pin}] excluída com sucesso!`);
    } catch (err) {
      console.error('Error deleting room', err);
      alert('Erro ao excluir a sala. Tente novamente.');
    }
  };

  const handleClearAllRooms = () => {
    if (window.confirm('ATENÇÃO: Você tem certeza que deseja excluir TODAS as salas? Esta ação é irreversível e apagará todas as ideias, participantes e dados do dispositivo.')) {
      try {
        const pinsToDelete: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('room_')) {
            pinsToDelete.push(key.substring(5));
          }
        }
        
        pinsToDelete.forEach(pin => {
          localStorage.removeItem(`room_${pin}`);
          localStorage.removeItem(`columns_${pin}`);
          localStorage.removeItem(`ideas_${pin}`);
          localStorage.removeItem(`participants_${pin}`);
        });

        loadRoomsData();
        showNotification('Todas as salas foram apagadas com sucesso.');
      } catch (err) {
        console.error('Error clearing all rooms', err);
      }
    }
  };

  // Filtered rooms
  const filteredRooms = rooms.filter(r => {
    const matchesSearch = 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.pin.includes(searchQuery) ||
      r.facilitatorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTemplate = filterTemplate === 'all' || r.template === filterTemplate;
    
    return matchesSearch && matchesTemplate;
  });

  // Global calculations
  const totalRooms = rooms.length;
  const totalParticipants = rooms.reduce((sum, r) => sum + r.participantsCount, 0);
  const totalIdeas = rooms.reduce((sum, r) => sum + r.ideasCount, 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#202124] flex flex-col antialiased">
      {/* Google Admin Style Header */}
      <header className="bg-white border-b border-[#dadce0] h-16 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10 shadow-3xs">
        <div className="flex items-center gap-4">
          <button 
            id="btn_admin_back_header"
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-600 cursor-pointer"
            title="Voltar para o Início"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              G
            </div>
            <div>
              <span className="font-bold text-slate-800 text-base tracking-tight">Google Admin</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase block -mt-1 tracking-wider">Console do Professor</span>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center bg-[#f1f3f4] rounded-lg px-3.5 py-2 w-96 border border-transparent focus-within:border-indigo-400 focus-within:bg-white focus-within:shadow-2xs transition-all">
          <Search className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
          <input
            id="input_admin_global_search"
            type="text"
            placeholder="Pesquisar salas por título, PIN ou facilitador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full font-medium"
          />
        </div>

        {/* Header Right */}
        <div className="flex items-center gap-3">
          <button
            id="btn_admin_refresh"
            onClick={loadRoomsData}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
            title="Sincronizar dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Sincronizado
          </span>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6 overflow-y-auto">
        {/* Toast Notification banner */}
        {notification && (
          <div id="admin_notification_banner" className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl px-4 py-3 flex items-center gap-3 shadow-3xs animate-in slide-in-from-top-2 duration-200">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-xs font-bold">{notification}</p>
          </div>
        )}

        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Painel de Administração de Salas</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Exclua salas que já foram finalizadas e limpe o armazenamento local do dispositivo.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              id="btn_admin_clear_all"
              onClick={handleClearAllRooms}
              className="px-3.5 py-2 border border-rose-200 hover:border-rose-300 bg-white hover:bg-rose-50/20 text-rose-600 text-xs font-extrabold rounded-xl transition-all shadow-3xs cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Limpar todas as salas
            </button>
            <button
              id="btn_admin_back_dashboard"
              onClick={onBack}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Início
            </button>
          </div>
        </div>

        {/* Statistics Widgets Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-3xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Layout className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Salas</p>
              <p className="text-2xl font-black text-slate-800 font-mono mt-0.5">{totalRooms}</p>
            </div>
          </div>

          <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-3xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Participantes</p>
              <p className="text-2xl font-black text-slate-800 font-mono mt-0.5">{totalParticipants}</p>
            </div>
          </div>

          <div className="bg-white border border-[#dadce0] rounded-2xl p-5 shadow-3xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Post-its</p>
              <p className="text-2xl font-black text-slate-800 font-mono mt-0.5">{totalIdeas}</p>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-4 shadow-3xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 items-center bg-[#f1f3f4] rounded-lg px-3.5 py-1.5 w-full sm:w-auto border border-transparent focus-within:border-indigo-400 focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              id="input_admin_local_search"
              type="text"
              placeholder="Filtrar por PIN, Título ou Facilitador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full font-semibold"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              id="select_admin_filter_template"
              value={filterTemplate}
              onChange={(e) => setFilterTemplate(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">Todos os Modelos</option>
              <option value="design-thinking">💡 Design Thinking</option>
              <option value="sticky-board">📋 Kanban / Sticky Board</option>
            </select>
          </div>
        </div>

        {/* Rooms Inventory Grid/Table */}
        <div className="bg-white border border-[#dadce0] rounded-2xl shadow-3xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Inventário de Salas Ativas</h3>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full font-mono">
              Mostrando {filteredRooms.length} de {rooms.length}
            </span>
          </div>

          {filteredRooms.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <span className="text-4xl mb-3">🔍</span>
              <p className="text-sm font-bold text-slate-700">Nenhuma sala encontrada</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">Tente redefinir seus filtros de pesquisa ou crie uma nova sala para visualizar os dados aqui.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                    <th className="py-3.5 px-5">Código PIN</th>
                    <th className="py-3.5 px-5">Título da Sala</th>
                    <th className="py-3.5 px-5">Facilitador</th>
                    <th className="py-3.5 px-5">Metodologia</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-center">Post-its</th>
                    <th className="py-3.5 px-5 text-center">Membros</th>
                    <th className="py-3.5 px-5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRooms.map((room) => {
                    const statusColors: Record<string, string> = {
                      waiting: 'bg-slate-100 text-slate-600 border-slate-200',
                      active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                      voting: 'bg-amber-50 text-amber-700 border-amber-100',
                      locked: 'bg-rose-50 text-rose-700 border-rose-100'
                    };
                    const statusLabels: Record<string, string> = {
                      waiting: 'Em Espera',
                      active: 'Ideação',
                      voting: 'Votação',
                      locked: 'Bloqueado'
                    };

                    return (
                      <tr 
                        key={room.pin} 
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-3.5 px-5 font-mono font-bold text-indigo-700 tracking-wider">
                          {room.pin}
                        </td>
                        <td className="py-3.5 px-5 font-bold text-slate-800">
                          {room.title}
                        </td>
                        <td className="py-3.5 px-5 font-medium text-slate-600">
                          @{room.facilitatorName}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">
                            {room.template === 'design-thinking' ? '💡 DT' : '📋 Kanban'}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-extrabold ${statusColors[room.status]}`}>
                            {statusLabels[room.status] || room.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-700">
                          {room.ideasCount}
                        </td>
                        <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-700">
                          {room.participantsCount}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {confirmDeletePin === room.pin ? (
                            <div className="flex items-center gap-1.5 justify-end">
                              <span className="text-[10px] text-rose-600 font-extrabold animate-pulse mr-1">Tem certeza?</span>
                              <button
                                id={`btn_confirm_delete_yes_${room.pin}`}
                                onClick={() => handleDeleteRoom(room.pin)}
                                className="bg-rose-600 text-white text-[10px] font-extrabold px-2 py-1 rounded hover:bg-rose-700 transition-all cursor-pointer"
                              >
                                Sim
                              </button>
                              <button
                                id={`btn_confirm_delete_no_${room.pin}`}
                                onClick={() => setConfirmDeletePin(null)}
                                className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2 py-1 rounded hover:bg-slate-200 transition-all cursor-pointer"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`btn_admin_delete_room_${room.pin}`}
                              onClick={() => setConfirmDeletePin(room.pin)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                              title="Excluir Sala Permanentemente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Admin Footer */}
      <footer className="mt-auto bg-white border-t border-[#dadce0] py-4 px-6 text-center text-[11px] text-slate-400 font-medium">
        Desenvolvido para Google Admin Console Integrado • Brainstorming Real-time
      </footer>
    </div>
  );
}
