import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'pt' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations: Record<Language, Record<string, string>> = {
  pt: {
    // App & Header
    appName: 'Design Colaborativo',
    facilitatorBadge: 'Facilitador',
    copiedLink: 'Link Copiado!',
    copyLink: 'Copiar Link',
    exportSession: 'Exportar Sessão',
    leaveBtn: 'Sair',
    endRoomBtn: 'Encerrar Sala',
    timerStart: 'Iniciar',
    timerPause: 'Pausar',
    timerReset: 'Resetar',
    leaveModalTitle: 'Sair sem encerrar?',
    leaveModalDesc: 'Você sairá desta sala, mas as interações e os post-its continuarão ativos para os alunos e demais usuários.',
    leaveModalTip: '💡 Como voltar depois: Você poderá retornar futuramente digitando o PIN {pin} e utilizando o seu nome de facilitador exato: @{facilitatorName}.',
    cancelBtn: 'Cancelar',
    confirmLeaveBtn: 'Sim, Sair da Sala',
    endModalTitle: 'Realmente encerrar a sala?',
    endModalWarning: '⚠️ ESTA AÇÃO É IRREVERSÍVEL!',
    endModalDesc: 'Isso excluirá permanentemente todos os dados desta sala, incluindo post-its de ideias, participantes cadastrados e configurações. Todos os alunos ativos serão desconectados imediatamente.',
    confirmEndBtn: 'Sim, Encerrar Permanentemente',

    // Onboarding
    tabJoin: 'Entrar em Sala',
    tabCreate: 'Criar Nova Sala',
    pinLabel: 'Código da Sala (PIN)',
    pinPlaceholder: 'Digite o PIN de 6 dígitos',
    invalidPinAlert: 'Por favor, insira um PIN válido de 6 dígitos.',
    enterNameAlert: 'Por favor, insira o seu nome.',
    enterTitleAlert: 'Por favor, insira o título da sessão.',
    continueBtn: 'Continuar',
    backBtn: 'Voltar',
    yourNameLabel: 'Seu Nome',
    namePlaceholder: 'Ex: Maria Silva',
    chooseAvatar: 'Escolha seu avatar',
    joinRoomBtn: 'Entrar na Sala',
    facilitatorTip: '👑 Dica de Facilitador: Se você é o proprietário desta sala, digite o seu nome exato de facilitador para recuperar suas permissões administrativas de criador.',
    sessionTitleLabel: 'Título da Sessão',
    sessionTitlePlaceholder: 'Ex: Brainstorming de Produto, Retrospectiva...',
    facilitatorNameLabel: 'Seu Nome (Facilitador)',
    facilitatorNamePlaceholder: 'Ex: Prof. Carlos / Facilitador',
    chooseTemplate: 'Modelo da Sessão',
    dtTitle: 'Design Thinking (5 Etapas)',
    dtDesc: 'Empatia, Definição, Ideação, Prototipagem e Testes',
    stickyTitle: 'Quadro Livre',
    stickyDesc: 'Quadro aberto com colunas personalizáveis',
    createRoomBtn: 'Criar e Iniciar Sala',
    activeRoomsTitle: 'Salas Ativas no Momento',
    noActiveRooms: 'Nenhuma sala ativa no momento',
    pinCopied: 'PIN Copiado!',
    copyPin: 'Copiar PIN',
    enterRoom: 'Entrar na sala',
    adminPanel: 'Painel Administrativo',
    languageLabel: 'Idioma / Lenguaje',

    // Main Workspace & Banners
    sessionWaiting: '⏳ A sala ainda não foi iniciada pelo facilitador.',
    sessionWaitingSub: 'Aguarde um momento, os post-its estarão disponíveis em breve!',
    sessionLocked: '🔒 A etapa atual está bloqueada pelo facilitador.',
    votingActive: '🗳️ Modo de Votação Ativo! Clique nos post-its para atribuir seus votos.',
    addIdeaPlaceholder: 'Digite sua ideia, insight ou sugestão...',
    addIdeaBtn: 'Adicionar Post-it',
    postItColor: 'Cor do Post-it',
    noIdeasInColumn: 'Nenhum post-it nesta etapa ainda.',
    beFirstIdea: 'Seja o primeiro a compartilhar uma ideia!',
    addColumn: 'Adicionar Coluna',
    newColumnPlaceholder: 'Título da nova coluna...',
    columnTitleDefault: 'Nova Coluna',
    confirmDeleteColumn: 'Excluir coluna e todas as suas ideias?',
    
    // Idea Card
    byAuthor: 'Por',
    anonymousAuthor: 'Anônimo',
    voteBtn: 'Votar',
    votedBtn: 'Votado',
    outOfVotes: 'Sem votos restantes',
    deleteIdeaConfirm: 'Deseja realmente excluir este post-it?',
    editIdeaPlaceholder: 'Edite a ideia...',
    saveBtn: 'Salvar',
    deleteBtn: 'Excluir',

    // Facilitator Controls
    controlPanelTitle: 'Painel de Controle',
    controlPanelSubtitle: 'Ferramentas exclusivas do facilitador para gerenciar a dinâmica.',
    dynamicState: 'Estado da Dinâmica',
    pressPlay: 'Aperte o Play ▶️',
    releaseToAll: 'Liberar para todos',
    stateWaiting: '1. Aguardando Início',
    stateWaitingDesc: 'Participantes travados em espera',
    stateActive: '2. Em Andamento (Ideação)',
    stateActiveDesc: 'Post-its e colunas liberados',
    stateVoting: '3. Modo Votação Aberto',
    stateVotingDesc: 'Pausa post-its, libera votos 👍/👎',
    stateLocked: '4. Bloqueado para Leitura',
    stateLockedDesc: 'Quadro congelado em Read-Only',
    lockColumns: 'Travar Etapas / Colunas',
    columnLocked: 'Travada',
    columnActive: 'Ativa',
    unlockColumnTitle: 'Desbloquear Coluna',
    lockColumnTitle: 'Bloquear Coluna',
    generalSettings: 'Configurações Gerais',
    hideAuthors: 'Ocultar Autores (Anônimo)',
    maxVotesLabel: 'Limite de Votos por Pessoa',
    revealAllIdeas: 'Revelar Todos os Post-its',
    clearAllVotes: 'Zerar Todos os Votos',

    // Sidebar Participants
    participantsTitle: 'Participantes na Sala',
    online: 'Online',
    offline: 'Offline',
    youBadge: 'Você',
    votesRemaining: 'votos restantes',

    // Export Modal
    exportTitle: 'Relatório & Exportação da Sessão',
    exportSubtitle: 'Baixe o relatório consolidado em PDF ou CSV',
    downloadPdf: 'Download PDF',
    downloadCsv: 'Download CSV',
    printBtn: 'Imprimir',
    totalIdeas: 'Total de Post-its',
    totalVotes: 'Total de Votos',
    totalParticipants: 'Participantes',
    pdfReportHeader: 'RELATÓRIO COMPLETO DA SESSÃO - DESIGN COLABORATIVO',
    noPostItsInStage: 'Nenhum post-it adicionado nesta etapa.',
    roomTerminatedAlert: 'A sala foi encerrada permanentemente pelo facilitador/proprietário.',

    // Default Column Titles for Design Thinking & Sticky Board
    colImmersion: 'Imersão & Empatia',
    colIdeation: 'Ideação & Insights',
    colPrototyping: 'Prototipagem',
    colTesting: 'Testes & Feedback',
    colToDo: 'A Fazer',
    colInProg: 'Em Andamento',
    colDone: 'Concluído',

    // Admin Panel & Login Translations
    adminLoginTitle: 'Painel Administrativo',
    adminLoginSubtitle: 'Acesso restrito para professores e facilitadores. Entre com suas credenciais.',
    adminUserLabel: 'Usuário',
    adminUserPlaceholder: 'Ex: Admin',
    adminPasswordLabel: 'Senha',
    adminPasswordPlaceholder: '••••••••',
    adminSubmitBtn: 'Entrar no Painel',
    adminAuthenticating: 'Autenticando e gravando no Banco...',
    adminLoginError: 'Usuário ou senha incorretos. Verifique suas credenciais.',
    adminSavedFirestore: 'Login salvo automaticamente no Firestore',
    adminConsoleBadge: 'Console v2.5 • Seguro',
    adminBackToApp: 'Voltar ao aplicativo',
    adminConsoleFooter: 'Google Admin Console • Ideação Colaborativa • Banco de Dados Ativo',
    adminTeacherConsole: 'Console do Professor',
    adminTabRooms: 'Salas',
    adminTabLogs: 'Logins no Banco',
    adminAuthenticatedAs: 'Autenticado: Admin',
    adminLogout: 'Sair',
    adminWelcomeTitle: 'Painel de Administração de Salas',
    adminWelcomeSub: 'Gerencie salas ativas, consulte o histórico de autenticações gravadas no banco e mantenha a limpeza do sistema.',
    adminClearAllRooms: 'Limpar todas as salas',
    adminTotalRooms: 'Total de Salas',
    adminParticipants: 'Participantes',
    adminTotalPostIts: 'Total Post-its',
    adminSavedLogins: 'Logins Salvos',
    adminSearchPlaceholder: 'Filtrar por PIN, Título ou Facilitador...',
    adminAllTemplates: 'Todos os Modelos',
    adminInventoryTitle: 'Inventário de Salas Ativas',
    adminShowing: 'Mostrando {current} de {total}',
    adminNoRoomsFound: 'Nenhuma sala encontrada',
    adminNoRoomsFoundSub: 'Tente redefinir seus filtros de pesquisa ou crie uma nova sala para visualizar os dados aqui.',
    adminColPin: 'Código PIN',
    adminColTitle: 'Título da Sala',
    adminColFacilitator: 'Facilitador',
    adminColMethodology: 'Metodologia',
    adminColStatus: 'Status',
    adminColPostIts: 'Post-its',
    adminColMembers: 'Membros',
    adminColAction: 'Ação',
    adminConfirmDelete: 'Tem certeza?',
    adminYes: 'Sim',
    adminNo: 'Não',
    adminLogsTitle: 'Histórico de Logins Gravados no Banco de Dados (Firestore)',
    adminLogsSub: 'Registros de acessos e tentativas de autenticação gravados em tempo real na coleção admin_logins.',
    adminRecords: 'Registros',
    adminNoLogsFound: 'Nenhum registro de login encontrado ainda',
    adminNoLogsFoundSub: 'Os próximos logins efetuados serão listados aqui em tempo real.',
    adminLogId: 'ID do Registro',
    adminLogUser: 'Usuário',
    adminLogDate: 'Data e Hora',
    adminLogResult: 'Resultado',
    adminLogDevice: 'Navegador / Dispositivo',
    adminSuccess: 'Sucesso',
    adminFailed: 'Falha (Senha incorreta)',
    statusWaiting: 'Em Espera',
    statusActive: 'Ideação',
    statusVoting: 'Votação',
    statusLocked: 'Bloqueado',
    capacityLimitTitle: 'Chegou no limite de pessoas',
    capacityLimitSub: 'Esta sala atingiu a lotação máxima de 50 pessoas (incluindo o professor e facilitador). Não é possível entrar novos participantes no momento.',
    capacityLimitBadge: 'Lotação Máxima: 50 / 50 Pessoas',
    capacityLimitOk: 'Entendido',
    signInWithGoogle: 'Entrar com o Google',
    googleConnected: 'Conectado como {name}',
    googleGuestDivider: 'ou entrar como convidado',
    googleLogout: 'Sair do Google',
    googleSignInTip: '🔑 Login Google: Permite reentrar na sala de qualquer dispositivo sem duplicar o usuário e mantém seu histórico de post-its.',
    ssoWelcomeTitle: 'Identificação e Acesso',
    ssoWelcomeSub: 'Faça login com o Google para synchar sua sessão em qualquer dispositivo ou entre como convidado.',
    continueAsGuest: 'Continuar como Convidado',
    changeAccount: 'Trocar Conta / Perfil',
    authenticatedAs: 'Conectado como:',
    step1Title: '1. Identificação',
    step2Title: '2. Entrar ou Criar Sala'
  },
  es: {
    // App & Header
    appName: 'Design Colaborativo',
    facilitatorBadge: 'Facilitador',
    copiedLink: '¡Enlace Copiado!',
    copyLink: 'Copiar Enlace',
    exportSession: 'Exportar Sesión',
    leaveBtn: 'Salir',
    endRoomBtn: 'Cerrar Sala',
    timerStart: 'Iniciar',
    timerPause: 'Pausar',
    timerReset: 'Reiniciar',
    leaveModalTitle: '¿Salir sin cerrar?',
    leaveModalDesc: 'Saldrás de esta sala, pero las interacciones y los post-its continuarán activos para los demás participantes.',
    leaveModalTip: '💡 Cómo volver después: Podrás regresar en el futuro ingresando el PIN {pin} e ingresando tu nombre exacto de facilitador: @{facilitatorName}.',
    cancelBtn: 'Cancelar',
    confirmLeaveBtn: 'Sí, Salir de la Sala',
    endModalTitle: '¿Realmente deseas cerrar la sala?',
    endModalWarning: '⚠️ ¡ESTA ACCIÓN ES IRREVERSIBLE!',
    endModalDesc: 'Esto eliminará permanentemente todos los datos de esta sala, incluidos los post-its de ideas, participantes registrados y configuraciones. Todos los participantes activos serán desconectados inmediatamente.',
    confirmEndBtn: 'Sí, Cerrar Permanentemente',

    // Onboarding
    tabJoin: 'Unirse a Sala',
    tabCreate: 'Crear Nueva Sala',
    pinLabel: 'Código de Sala (PIN)',
    pinPlaceholder: 'Ingrese el PIN de 6 dígitos',
    invalidPinAlert: 'Por favor, ingrese un PIN válido de 6 dígitos.',
    enterNameAlert: 'Por favor, ingrese su nombre.',
    enterTitleAlert: 'Por favor, ingrese el título de la sesión.',
    continueBtn: 'Continuar',
    backBtn: 'Volver',
    yourNameLabel: 'Tu Nombre',
    namePlaceholder: 'Ej: María Silva',
    chooseAvatar: 'Elige tu avatar',
    joinRoomBtn: 'Entrar a la Sala',
    facilitatorTip: '👑 Consejo de Facilitador: Si eres el propietario de esta sala, ingresa tu nombre exacto de facilitador para recuperar tus permisos de creador.',
    sessionTitleLabel: 'Título de la Sesión',
    sessionTitlePlaceholder: 'Ej: Brainstorming de Producto, Retrospectiva...',
    facilitatorNameLabel: 'Tu Nombre (Facilitador)',
    facilitatorNamePlaceholder: 'Ej: Prof. Carlos / Facilitador',
    chooseTemplate: 'Plantilla de la Sesión',
    dtTitle: 'Design Thinking (5 Etapas)',
    dtDesc: 'Empatía, Definición, Ideación, Prototipado y Pruebas',
    stickyTitle: 'Tablero Libre',
    stickyDesc: 'Tablero abierto con columnas personalizables',
    createRoomBtn: 'Crear e Iniciar Sala',
    activeRoomsTitle: 'Salas Activas en este Momento',
    noActiveRooms: 'No hay salas activas en este momento',
    pinCopied: '¡PIN Copiado!',
    copyPin: 'Copiar PIN',
    enterRoom: 'Entrar a la sala',
    adminPanel: 'Panel de Administración',
    languageLabel: 'Idioma / Lenguaje',

    // Main Workspace & Banners
    sessionWaiting: '⏳ La sala aún no ha sido iniciada por el facilitador.',
    sessionWaitingSub: '¡Aguarde un momento, los post-its estarán disponibles pronto!',
    sessionLocked: '🔒 La etapa actual está bloqueada por el facilitador.',
    votingActive: '🗳️ ¡Modo de Votación Activo! Haz clic en los post-its para asignar tus votos.',
    addIdeaPlaceholder: 'Escribe tu idea, sugerencia o insight...',
    addIdeaBtn: 'Agregar Post-it',
    postItColor: 'Color del Post-it',
    noIdeasInColumn: 'Aún no hay post-its en esta etapa.',
    beFirstIdea: '¡Sé el primero en compartir una idea!',
    addColumn: 'Agregar Columna',
    newColumnPlaceholder: 'Título de la nueva columna...',
    columnTitleDefault: 'Nueva Columna',
    confirmDeleteColumn: '¿Eliminar columna y todas sus ideas?',

    // Idea Card
    byAuthor: 'Por',
    anonymousAuthor: 'Anónimo',
    voteBtn: 'Votar',
    votedBtn: 'Votado',
    outOfVotes: 'Sin votos restantes',
    deleteIdeaConfirm: '¿Realmente deseas eliminar este post-it?',
    editIdeaPlaceholder: 'Edita la idea...',
    saveBtn: 'Guardar',
    deleteBtn: 'Eliminar',

    // Facilitator Controls
    controlPanelTitle: 'Panel de Control',
    controlPanelSubtitle: 'Herramientas exclusivas del facilitador para gestionar la dinámica.',
    dynamicState: 'Estado de la Dinámica',
    pressPlay: 'Presiona Play ▶️',
    releaseToAll: 'Habilitar para todos',
    stateWaiting: '1. Esperando Inicio',
    stateWaitingDesc: 'Participantes bloqueados en espera',
    stateActive: '2. En Curso (Ideación)',
    stateActiveDesc: 'Post-its y columnas habilitados',
    stateVoting: '3. Modo Votación Abierto',
    stateVotingDesc: 'Pausa post-its, habilita votos 👍/👎',
    stateLocked: '4. Bloqueado para Lectura',
    stateLockedDesc: 'Tablero congelado en Solo Lectura',
    lockColumns: 'Bloquear Etapas / Columnas',
    columnLocked: 'Bloqueada',
    columnActive: 'Activa',
    unlockColumnTitle: 'Desbloquear Columna',
    lockColumnTitle: 'Bloquear Columna',
    generalSettings: 'Configuración General',
    hideAuthors: 'Ocultar Autores (Anónimo)',
    maxVotesLabel: 'Límite de Votos por Persona',
    revealAllIdeas: 'Revelar Todos los Post-its',
    clearAllVotes: 'Reiniciar Todos los Votos',

    // Sidebar Participants
    participantsTitle: 'Participantes en la Sala',
    online: 'En línea',
    offline: 'Desconectado',
    youBadge: 'Tú',
    votesRemaining: 'votos restantes',

    // Export Modal
    exportTitle: 'Informe y Exportación de la Sesión',
    exportSubtitle: 'Descarga el informe consolidado en PDF o CSV',
    downloadPdf: 'Descargar PDF',
    downloadCsv: 'Descargar CSV',
    printBtn: 'Imprimir',
    totalIdeas: 'Total de Post-its',
    totalVotes: 'Total de Votos',
    totalParticipants: 'Participantes',
    pdfReportHeader: 'INFORME COMPLETO DE LA SESIÓN - DESIGN COLABORATIVO',
    noPostItsInStage: 'Aún no hay post-its agregados en esta etapa.',
    roomTerminatedAlert: 'La sala ha sido cerrada permanentemente por el facilitador/propietario.',

    // Default Column Titles for Design Thinking & Sticky Board
    colImmersion: 'Inmersión y Empatía',
    colIdeation: 'Ideación e Insights',
    colPrototyping: 'Prototipado',
    colTesting: 'Pruebas y Feeback',
    colToDo: 'Por Hacer',
    colInProg: 'En Curso',
    colDone: 'Completado',

    // Admin Panel & Login Translations (Spanish)
    adminLoginTitle: 'Panel de Administración',
    adminLoginSubtitle: 'Acceso restringido para profesores y facilitadores. Ingrese sus credenciales.',
    adminUserLabel: 'Usuario',
    adminUserPlaceholder: 'Ej: Admin',
    adminPasswordLabel: 'Contraseña',
    adminPasswordPlaceholder: '••••••••',
    adminSubmitBtn: 'Ingresar al Panel',
    adminAuthenticating: 'Autenticando y guardando en BD...',
    adminLoginError: 'Usuario o contraseña incorrectos. Verifique sus credenciales.',
    adminSavedFirestore: 'Inicio de sesión guardado automáticamente en Firestore',
    adminConsoleBadge: 'Consola v2.5 • Segura',
    adminBackToApp: 'Volver a la aplicación',
    adminConsoleFooter: 'Google Admin Console • Ideación Colaborativa • Base de Datos Activa',
    adminTeacherConsole: 'Consola del Profesor',
    adminTabRooms: 'Salas',
    adminTabLogs: 'Inicios de Sesión en BD',
    adminAuthenticatedAs: 'Autenticado: Admin',
    adminLogout: 'Salir',
    adminWelcomeTitle: 'Panel de Administración de Salas',
    adminWelcomeSub: 'Gestione salas activas, consulte el historial de autenticaciones guardadas en la base de datos y mantenga el sistema limpio.',
    adminClearAllRooms: 'Limpiar todas las salas',
    adminTotalRooms: 'Total de Salas',
    adminParticipants: 'Participantes',
    adminTotalPostIts: 'Total Post-its',
    adminSavedLogins: 'Inicios Guardados',
    adminSearchPlaceholder: 'Filtrar por PIN, Título o Facilitador...',
    adminAllTemplates: 'Todas las Plantillas',
    adminInventoryTitle: 'Inventario de Salas Activas',
    adminShowing: 'Mostrando {current} de {total}',
    adminNoRoomsFound: 'No se encontraron salas',
    adminNoRoomsFoundSub: 'Intente restablecer los filtros de búsqueda o cree una nueva sala para ver los datos aquí.',
    adminColPin: 'Código PIN',
    adminColTitle: 'Título de la Sala',
    adminColFacilitator: 'Facilitador',
    adminColMethodology: 'Metodología',
    adminColStatus: 'Estado',
    adminColPostIts: 'Post-its',
    adminColMembers: 'Miembros',
    adminColAction: 'Acción',
    adminConfirmDelete: '¿Está seguro?',
    adminYes: 'Sí',
    adminNo: 'No',
    adminLogsTitle: 'Historial de Inicios de Sesión en Base de Datos (Firestore)',
    adminLogsSub: 'Registros de accesos e intentos de autenticación guardados en tiempo real en la colección admin_logins.',
    adminRecords: 'Registros',
    adminNoLogsFound: 'Aún no se encontraron registros de inicio de sesión',
    adminNoLogsFoundSub: 'Los próximos inicios de sesión se enumerarán aquí en tiempo real.',
    adminLogId: 'ID del Registro',
    adminLogUser: 'Usuario',
    adminLogDate: 'Fecha y Hora',
    adminLogResult: 'Resultado',
    adminLogDevice: 'Navegador / Dispositivo',
    adminSuccess: 'Éxito',
    adminFailed: 'Fallo (Contraseña incorrecta)',
    statusWaiting: 'En Espera',
    statusActive: 'Ideación',
    statusVoting: 'Votación',
    statusLocked: 'Bloqueado',
    capacityLimitTitle: 'Llegó al límite de personas',
    capacityLimitSub: 'Esta sala ha alcanzado la capacidad máxima de 50 personas (incluyendo al profesor y facilitador). No es posible que se unan nuevos participantes en este momento.',
    capacityLimitBadge: 'Capacidad Máxima: 50 / 50 Personas',
    capacityLimitOk: 'Entendido',
    signInWithGoogle: 'Iniciar sesión con Google',
    googleConnected: 'Conectado como {name}',
    googleGuestDivider: 'o entrar como invitado',
    googleLogout: 'Cerrar sesión de Google',
    googleSignInTip: '🔑 Login Google: Permite volver a entrar a la sala desde cualquier dispositivo sin duplicar usuario.',
    ssoWelcomeTitle: 'Identificación y Acceso',
    ssoWelcomeSub: 'Inicia sesión con Google para sincronizar tu sesión en cualquier dispositivo o entra como invitado.',
    continueAsGuest: 'Continuar como Invitado',
    changeAccount: 'Cambiar Cuenta / Perfil',
    authenticatedAs: 'Conectado como:',
    step1Title: '1. Identificación',
    step2Title: '2. Entrar o Crear Sala'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    if (saved === 'es' || saved === 'pt') return saved;
    // Auto-detect browser language if spanish
    if (navigator.language.startsWith('es')) return 'es';
    return 'pt';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[language][key] || translations['pt'][key] || key;
    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(`{${paramKey}}`, String(val));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Sleek Language Selector Button Component
export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        id="btn_language_selector"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs ${
          compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
        }`}
        title="Selecione o Idioma / Seleccionar Idioma"
      >
        <span className="text-sm">{language === 'pt' ? '🇧🇷' : '🇲🇽'}</span>
        <span>{language === 'pt' ? 'PT' : 'ES'}</span>
        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white shadow-lg border border-slate-200/80 z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-150">
            <button
              id="btn_lang_pt"
              onClick={() => {
                setLanguage('pt');
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                language === 'pt' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🇧🇷</span> Português
              </span>
              {language === 'pt' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
            </button>

            <button
              id="btn_lang_es"
              onClick={() => {
                setLanguage('es');
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                language === 'es' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🇲🇽</span> Español
              </span>
              {language === 'es' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
