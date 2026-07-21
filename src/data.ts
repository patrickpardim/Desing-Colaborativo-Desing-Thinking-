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
