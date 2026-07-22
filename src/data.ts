import { RoomColumn, RoomTemplate, NoteColor } from './types';

export const AVATARS = [
  { emoji: '🦊', label: 'Raposa', color: 'bg-orange-100 border-orange-300 text-orange-600' },
  { emoji: '🐻', label: 'Urso', color: 'bg-amber-100 border-amber-300 text-amber-700' },
  { emoji: '🐸', label: 'Sapo', color: 'bg-emerald-100 border-emerald-300 text-emerald-600' },
  { emoji: '🐷', label: 'Porco', color: 'bg-rose-100 border-rose-300 text-rose-500' },
  { emoji: '🦄', label: 'Unicórnio', color: 'bg-purple-100 border-purple-300 text-purple-600' },
  { emoji: '🐼', label: 'Panda', color: 'bg-slate-100 border-slate-300 text-slate-800' },
  { emoji: '🦁', label: 'Leão', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
  { emoji: '🐙', label: 'Polvo', color: 'bg-indigo-100 border-indigo-300 text-indigo-600' },
  { emoji: '🦕', label: 'Dino', color: 'bg-teal-100 border-teal-300 text-teal-600' },
  { emoji: '🐨', label: 'Coala', color: 'bg-gray-100 border-gray-300 text-gray-600' },
  { emoji: '🐝', label: 'Abelha', color: 'bg-yellow-50 border-yellow-200 text-yellow-600' },
  { emoji: '🐱', label: 'Gato', color: 'bg-amber-50 border-amber-200 text-amber-600' },
];

export const NOTE_COLORS: { value: NoteColor; bg: string; border: string; text: string; header: string }[] = [
  { value: 'yellow', bg: 'bg-[#FFF9C4]', border: 'border-yellow-400', text: 'text-yellow-900', header: 'bg-yellow-200' },
  { value: 'blue', bg: 'bg-[#E1F5FE]', border: 'border-blue-400', text: 'text-blue-900', header: 'bg-blue-200' },
  { value: 'green', bg: 'bg-[#E8F5E9]', border: 'border-green-400', text: 'text-green-900', header: 'bg-green-200' },
  { value: 'pink', bg: 'bg-[#FCE4EC]', border: 'border-pink-400', text: 'text-pink-900', header: 'bg-pink-200' },
  { value: 'purple', bg: 'bg-[#F3E5F5]', border: 'border-purple-400', text: 'text-purple-900', header: 'bg-purple-200' },
];

export interface StageExplanation {
  title: string;
  subtitle: string;
  explanation: string;
  summary: string;
}

export const STAGE_EXPLANATIONS: Record<string, StageExplanation> = {
  empatia: {
    title: 'Empatia',
    subtitle: 'Colocar-se no lugar do outro',
    explanation: 'É a fase de ouvir e observar. Em vez de adivinhar o que as pessoas precisam, você vai conversar com elas para entender o que sentem, quais são suas dificuldades no dia a dia e o que realmente importa para elas.',
    summary: 'Ouvir sem julgar para entender a realidade do outro.'
  },
  definicao: {
    title: 'Definição',
    subtitle: 'Encontrar o problema real',
    explanation: 'Depois de ouvir as pessoas, você junta as informações e descobre qual é o verdadeiro desafio a ser resolvido. Às vezes, o problema que aparece primeiro é só um detalhe; aqui você descobre a causa principal e faz a pergunta mágica: "Como poderíamos resolver isso?"',
    summary: 'Organizar as ideias e descobrir o problema verdadeiro.'
  },
  ideacao: {
    title: 'Ideação',
    subtitle: 'Lançar ideias sem medo',
    explanation: 'É a hora do brainstorming (tempestade de ideias). A regra principal é: não existe ideia errada ou boba. Quanto mais ideias a turma der, melhor! Valem sugestões simples, modernas, engraçadas ou bem diferentes.',
    summary: 'Criar o maior número de soluções possíveis.'
  },
  prototipagem: {
    title: 'Prototipagem',
    subtitle: 'Dar forma à ideia',
    explanation: 'É hora de colocar a mão na massa e criar um modelo simples e rápido da solução escolhida. Não precisa ser perfeito nem custar caro: pode ser um desenho no papel, um rascunho de tela, um roteiro de teatro ou uma maquete.',
    summary: 'Transformar a ideia em algo visível para poder testar.'
  },
  teste: {
    title: 'Teste',
    subtitle: 'Ver se funciona na prática',
    explanation: 'Você entrega o seu protótipo para as pessoas usarem e observa a reação delas. Elas entenderam como funciona? Encontraram alguma dificuldade? Com base nesses comentários (feedbacks), você ajusta e melhora o seu projeto.',
    summary: 'Experimentar na prática, ouvir as opiniões e melhorar.'
  },
  testes: {
    title: 'Testes',
    subtitle: 'Ver se funciona na prática',
    explanation: 'Você entrega o seu protótipo para as pessoas usarem e observa a reação delas. Elas entenderam como funciona? Encontraram alguma dificuldade? Com base nesses comentários (feedbacks), você ajusta e melhora o seu projeto.',
    summary: 'Experimentar na prática, ouvir as opiniões e melhorar.'
  },
  todo: {
    title: 'A Fazer',
    subtitle: 'Organizar tarefas pendentes',
    explanation: 'Mapeie todas as tarefas, demandas e necessidades iniciais antes de começar a execução.',
    summary: 'Mapear e listar os itens pendentes.'
  },
  inprogress: {
    title: 'Em Progresso',
    subtitle: 'Execução ativa em andamento',
    explanation: 'Acompanhe as tarefas e ideias que estão sendo desenvolvidas e colocadas em prática no momento.',
    summary: 'Visualizar o trabalho em andamento.'
  },
  done: {
    title: 'Concluído',
    subtitle: 'Finalização e entrega',
    explanation: 'Espaço para reunir todas as tarefas finalizadas, hipóteses validadas e metas alcançadas.',
    summary: 'Celebrar as entregas e resultados obtidos.'
  }
};

export function getStageExplanation(columnId: string, columnTitle: string): StageExplanation | null {
  const normalizedId = columnId.toLowerCase().trim();
  if (STAGE_EXPLANATIONS[normalizedId]) {
    return STAGE_EXPLANATIONS[normalizedId];
  }

  const normalizedTitle = columnTitle.toLowerCase().trim();
  if (normalizedTitle.includes('empatia')) return STAGE_EXPLANATIONS.empatia;
  if (normalizedTitle.includes('defini') || normalizedTitle.includes('definicao')) return STAGE_EXPLANATIONS.definicao;
  if (normalizedTitle.includes('ideaç') || normalizedTitle.includes('ideacao')) return STAGE_EXPLANATIONS.ideacao;
  if (normalizedTitle.includes('prototip')) return STAGE_EXPLANATIONS.prototipagem;
  if (normalizedTitle.includes('teste')) return STAGE_EXPLANATIONS.teste;
  if (normalizedTitle.includes('fazer')) return STAGE_EXPLANATIONS.todo;
  if (normalizedTitle.includes('progresso')) return STAGE_EXPLANATIONS.inprogress;
  if (normalizedTitle.includes('conclu')) return STAGE_EXPLANATIONS.done;

  return null;
}

export const KNOWN_COLUMN_ORDER: Record<string, number> = {
  'empatia': 1,
  'definicao': 2,
  'ideacao': 3,
  'prototipagem': 4,
  'teste': 5,
  'testes': 5,
  'todo': 1,
  'inprogress': 2,
  'done': 3,
};

export const TEMPLATE_COLUMNS: Record<RoomTemplate, RoomColumn[]> = {
  'design-thinking': [
    { id: 'empatia', title: '1. Empatia', color: 'border-indigo-500', locked: false, order: 1 },
    { id: 'definicao', title: '2. Definição', color: 'border-sky-500', locked: false, order: 2 },
    { id: 'ideacao', title: '3. Ideação', color: 'border-pink-500', locked: true, order: 3 },
    { id: 'prototipagem', title: '4. Prototipagem', color: 'border-amber-500', locked: true, order: 4 },
    { id: 'teste', title: '5. Testes', color: 'border-emerald-500', locked: true, order: 5 },
  ],
  'sticky-board': [
    { id: 'todo', title: 'A Fazer', color: 'border-blue-400', locked: false, order: 1 },
    { id: 'inprogress', title: 'Em Progresso', color: 'border-amber-400', locked: false, order: 2 },
    { id: 'done', title: 'Concluído', color: 'border-emerald-400', locked: false, order: 3 },
  ],
};
