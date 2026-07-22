import React, { useState, useEffect } from 'react';
import { 
  Trash2, Search, ArrowLeft, Users, FileText, Layout, Key, Filter, 
  RefreshCw, AlertTriangle, CheckCircle, Lock, User, Eye, EyeOff, LogOut, ShieldCheck, Database, Clock
} from 'lucide-react';
import { RoomTemplate, AdminLoginRecord } from '../types';
import { 
  recordAdminLoginToFirestore, 
  subscribeAdminLoginsFromFirestore 
} from '../services/firebaseRoomService';
import { useLanguage, LanguageSelector } from '../context/LanguageContext';

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
  const { t } = useLanguage();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_authenticated') === 'true';
  });

  // Login form inputs
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Dashboard state
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTemplate, setFilterTemplate] = useState<string>('all');
  const [confirmDeletePin, setConfirmDeletePin] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Firestore Admin Login Logs State
  const [loginLogs, setLoginLogs] = useState<AdminLoginRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'rooms' | 'logs'>('rooms');

  // Load Rooms from localStorage
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
    if (isAuthenticated) {
      loadRoomsData();
      
      // Subscribe to login logs from Firestore
      const unsubscribe = subscribeAdminLoginsFromFirestore((logs) => {
        setLoginLogs(logs);
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [isAuthenticated]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsAuthenticating(true);

    const trimmedUser = usernameInput.trim();
    const trimmedPass = passwordInput.trim();

    // Check credentials (User: Admin, Pass: AdminAdmin)
    const isValid = trimmedUser === 'Admin' && trimmedPass === 'AdminAdmin';

    try {
      // Record login attempt in Firestore database
      await recordAdminLoginToFirestore(trimmedUser || 'Desconhecido', isValid);

      if (isValid) {
        sessionStorage.setItem('admin_authenticated', 'true');
        setIsAuthenticated(true);
        showNotification(t('adminSavedFirestore'));
      } else {
        setLoginError(t('adminLoginError'));
      }
    } catch (error) {
      console.error('Error logging in:', error);
      if (isValid) {
        sessionStorage.setItem('admin_authenticated', 'true');
        setIsAuthenticated(true);
      } else {
        setLoginError(t('adminLoginError'));
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    setUsernameInput('');
    setPasswordInput('');
    setLoginError(null);
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

  // -------------------------------------------------------------
  // UNAUTHENTICATED: RENDER LIGHT THEME LOGIN SCREEN
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between items-center p-4 sm:p-6 antialiased selection:bg-indigo-500 selection:text-white">
        {/* Top Header Bar */}
        <div className="w-full max-w-md flex items-center justify-between pt-2 mb-4">
          <div className="flex items-center gap-2">
            <LanguageSelector compact />
            <button
              id="btn_admin_login_back"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200/90 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-3xs"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('adminBackToApp')}
            </button>
          </div>
          
          <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200/80 shadow-3xs">
            {t('adminConsoleBadge')}
          </span>
        </div>

        {/* Light Theme Login Card */}
        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 my-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 mb-4 ring-4 ring-indigo-50">
              <ShieldCheck className="w-8 h-8" />
            </div>
            
            <h1 className="text-2xl font-black tracking-tight text-slate-900 font-display">
              {t('adminLoginTitle')}
            </h1>
            <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
              {t('adminLoginSubtitle')}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-in slide-in-from-top-1 duration-150">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('adminUserLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="input_admin_username"
                  type="text"
                  required
                  placeholder={t('adminUserPlaceholder')}
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('adminPasswordLabel')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input_admin_password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={t('adminPasswordPlaceholder')}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="btn_admin_login_submit"
              type="submit"
              disabled={isAuthenticating}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('adminAuthenticating')}</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>{t('adminSubmitBtn')}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <footer className="text-center text-[11px] text-slate-400 font-medium py-2">
          {t('adminConsoleFooter')}
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED: RENDER LIGHT THEME ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-10 shadow-3xs">
        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            id="btn_admin_back_header"
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-600 cursor-pointer"
            title={t('adminBackToApp')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              G
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base tracking-tight">Google Admin</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase block -mt-1 tracking-wider">{t('adminTeacherConsole')}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Header */}
        <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            id="tab_admin_rooms"
            onClick={() => setActiveTab('rooms')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rooms' 
                ? 'bg-white text-indigo-700 shadow-3xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>{t('adminTabRooms')} ({rooms.length})</span>
          </button>

          <button
            id="tab_admin_logs"
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs' 
                ? 'bg-white text-indigo-700 shadow-3xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span>{t('adminTabLogs')} ({loginLogs.length})</span>
          </button>
        </div>

        {/* Header Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSelector compact />

          <button
            id="btn_admin_refresh"
            onClick={loadRoomsData}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
            title="Sincronizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {t('adminAuthenticatedAs')}
          </span>

          <button
            id="btn_admin_logout"
            onClick={handleLogout}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5"
            title={t('adminLogout')}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('adminLogout')}</span>
          </button>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6 overflow-y-auto">
        {/* Toast Notification banner */}
        {notification && (
          <div id="admin_notification_banner" className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 flex items-center gap-3 shadow-3xs animate-in slide-in-from-top-2 duration-200">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-xs font-bold">{notification}</p>
          </div>
        )}

        {/* Mobile View Tab Switcher */}
        <div className="flex md:hidden bg-slate-200 p-1 rounded-xl w-full">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-lg text-center ${
              activeTab === 'rooms' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            {t('adminTabRooms')} ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-2 text-xs font-extrabold rounded-lg text-center ${
              activeTab === 'logs' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            {t('adminTabLogs')} ({loginLogs.length})
          </button>
        </div>

        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{t('adminWelcomeTitle')}</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {t('adminWelcomeSub')}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              id="btn_admin_clear_all"
              onClick={handleClearAllRooms}
              className="px-3.5 py-2 border border-rose-200 hover:border-rose-300 bg-white hover:bg-rose-50/20 text-rose-600 text-xs font-extrabold rounded-xl transition-all shadow-3xs cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              {t('adminClearAllRooms')}
            </button>
            <button
              id="btn_admin_back_dashboard"
              onClick={onBack}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('adminBackToApp')}
            </button>
          </div>
        </div>

        {/* Statistics Widgets Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-3xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('adminTotalRooms')}</p>
              <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{totalRooms}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-3xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('adminParticipants')}</p>
              <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{totalParticipants}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-3xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('adminTotalPostIts')}</p>
              <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{totalIdeas}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-3xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('adminSavedLogins')}</p>
              <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{loginLogs.length}</p>
            </div>
          </div>
        </div>

        {/* TAB 1: ROOMS INVENTORY */}
        {activeTab === 'rooms' && (
          <div className="space-y-4">
            {/* Filter Controls Bar */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-3xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-1 items-center bg-slate-50 rounded-lg px-3.5 py-1.5 w-full sm:w-auto border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  id="input_admin_local_search"
                  type="text"
                  placeholder={t('adminSearchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full font-semibold"
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
                  <option value="all">{t('adminAllTemplates')}</option>
                  <option value="design-thinking">💡 Design Thinking (5 etapas)</option>
                  <option value="sticky-board">📋 Kanban / Sticky Board</option>
                </select>
              </div>
            </div>

            {/* Rooms Inventory Grid/Table */}
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-3xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">{t('adminInventoryTitle')}</h3>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full font-mono">
                  {t('adminShowing', { current: filteredRooms.length, total: rooms.length })}
                </span>
              </div>

              {filteredRooms.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <span className="text-4xl mb-3">🔍</span>
                  <p className="text-sm font-bold text-slate-800">{t('adminNoRoomsFound')}</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">{t('adminNoRoomsFoundSub')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                        <th className="py-3.5 px-5">{t('adminColPin')}</th>
                        <th className="py-3.5 px-5">{t('adminColTitle')}</th>
                        <th className="py-3.5 px-5">{t('adminColFacilitator')}</th>
                        <th className="py-3.5 px-5">{t('adminColMethodology')}</th>
                        <th className="py-3.5 px-5">{t('adminColStatus')}</th>
                        <th className="py-3.5 px-5 text-center">{t('adminColPostIts')}</th>
                        <th className="py-3.5 px-5 text-center">{t('adminColMembers')}</th>
                        <th className="py-3.5 px-5 text-right">{t('adminColAction')}</th>
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
                          waiting: t('statusWaiting'),
                          active: t('statusActive'),
                          voting: t('statusVoting'),
                          locked: t('statusLocked')
                        };

                        return (
                          <tr 
                            key={room.pin} 
                            className="hover:bg-slate-50/60 transition-colors"
                          >
                            <td className="py-3.5 px-5 font-mono font-bold text-indigo-700 tracking-wider">
                              {room.pin}
                            </td>
                            <td className="py-3.5 px-5 font-bold text-slate-900">
                              {room.title}
                            </td>
                            <td className="py-3.5 px-5 font-medium text-slate-600">
                              @{room.facilitatorName}
                            </td>
                            <td className="py-3.5 px-5">
                              <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">
                                {room.template === 'design-thinking' ? '💡 DT (5 etapas)' : '📋 Kanban'}
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
                                  <span className="text-[10px] text-rose-600 font-extrabold animate-pulse mr-1">{t('adminConfirmDelete')}</span>
                                  <button
                                    id={`btn_confirm_delete_yes_${room.pin}`}
                                    onClick={() => handleDeleteRoom(room.pin)}
                                    className="bg-rose-600 text-white text-[10px] font-extrabold px-2 py-1 rounded hover:bg-rose-700 transition-all cursor-pointer"
                                  >
                                    {t('adminYes')}
                                  </button>
                                  <button
                                    id={`btn_confirm_delete_no_${room.pin}`}
                                    onClick={() => setConfirmDeletePin(null)}
                                    className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2 py-1 rounded hover:bg-slate-200 transition-all cursor-pointer"
                                  >
                                    {t('adminNo')}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  id={`btn_admin_delete_room_${room.pin}`}
                                  onClick={() => setConfirmDeletePin(room.pin)}
                                  className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                                  title="Excluir"
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
          </div>
        )}

        {/* TAB 2: FIRESTORE LOGIN LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-3xs overflow-hidden space-y-0">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  {t('adminLogsTitle')}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {t('adminLogsSub')}
                </p>
              </div>

              <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full self-start sm:self-auto font-mono">
                {loginLogs.length} {t('adminRecords')}
              </span>
            </div>

            {loginLogs.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
                <Clock className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-800">{t('adminNoLogsFound')}</p>
                <p className="text-xs text-slate-500 mt-1">{t('adminNoLogsFoundSub')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                      <th className="py-3.5 px-5">{t('adminLogId')}</th>
                      <th className="py-3.5 px-5">{t('adminLogUser')}</th>
                      <th className="py-3.5 px-5">{t('adminLogDate')}</th>
                      <th className="py-3.5 px-5">{t('adminLogResult')}</th>
                      <th className="py-3.5 px-5">{t('adminLogDevice')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {loginLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-5 font-mono text-[11px] text-slate-400">
                          {log.id}
                        </td>
                        <td className="py-3.5 px-5 font-extrabold text-slate-900">
                          {log.user}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-slate-600">
                          {log.createdAtFormatted || new Date(log.timestamp).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3.5 px-5">
                          {log.success ? (
                            <span className="px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              {t('adminSuccess')}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold bg-rose-50 text-rose-700 border-rose-200 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              {t('adminFailed')}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-slate-500 font-mono text-[10px] truncate max-w-xs">
                          {log.userAgent}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Admin Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-4 px-6 text-center text-[11px] text-slate-400 font-medium">
        {t('adminConsoleFooter')}
      </footer>
    </div>
  );
}
