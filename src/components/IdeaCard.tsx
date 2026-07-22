import React from 'react';
import { Idea, Participant, NoteColor, RoomStatus } from '../types';
import { NOTE_COLORS } from '../data';
import { Trash2, Edit2, ChevronLeft, ChevronRight, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface IdeaCardProps {
  idea: Idea;
  currentUser: Participant;
  anonymizeAuthors: boolean;
  votingModeActive: boolean;
  roomStatus: RoomStatus;
  onVote: (ideaId: string) => void;
  onReact: (ideaId: string, emoji: string) => void;
  onEdit: (ideaId: string, newText: string) => void;
  onDelete: (ideaId: string) => void;
  onMoveColumn: (ideaId: string, direction: 'left' | 'right') => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  currentUser,
  anonymizeAuthors,
  votingModeActive,
  roomStatus,
  onVote,
  onReact,
  onEdit,
  onDelete,
  onMoveColumn,
  canMoveLeft,
  canMoveRight
}) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(idea.text);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const colorConfig = NOTE_COLORS.find(c => c.value === idea.color) || NOTE_COLORS[0];
  const isAuthor = idea.authorId === currentUser.id;
  const canModify = (isAuthor || currentUser.isFacilitator) && roomStatus === 'active';

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editText.trim().length > 0 && editText.trim() !== idea.text) {
      onEdit(idea.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(idea.text);
    setIsEditing(false);
  };

  const displayAuthorName = anonymizeAuthors 
    ? (isAuthor ? `${t('youBadge')} (${t('anonymousAuthor')})` : t('anonymousAuthor')) 
    : (isAuthor ? t('youBadge') : idea.authorName);
    
  const displayAuthorAvatar = anonymizeAuthors ? '👤' : idea.authorAvatar;

  return (
    <div
      id={`idea_card_${idea.id}`}
      className={`p-4 rounded shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between group min-h-[140px] border-b-4 ${colorConfig.bg} ${colorConfig.border} text-slate-800`}
    >
      {/* Edit/Delete Controls Top-Right */}
      {canModify && !isEditing && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            id={`btn_edit_idea_${idea.id}`}
            onClick={() => setIsEditing(true)}
            className="p-1 hover:bg-black/10 rounded transition-all text-slate-600 hover:text-slate-900 cursor-pointer"
            title={t('saveBtn')}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            id={`btn_delete_idea_${idea.id}`}
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1 hover:bg-black/10 rounded transition-all text-rose-600 hover:text-rose-900 cursor-pointer"
            title={t('deleteBtn')}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content / Edit Input Form */}
      <div className="flex-1 mb-3">
        {isEditing ? (
          <form id={`form_edit_idea_${idea.id}`} onSubmit={handleSaveEdit} className="space-y-2">
            <textarea
              id={`textarea_edit_idea_${idea.id}`}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              maxLength={280}
              rows={3}
              className="w-full text-xs font-medium p-1 bg-white/60 border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-sans leading-relaxed text-slate-800"
              autoFocus
              required
            />
            <div className="flex justify-end gap-1">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-[10px] font-bold rounded text-slate-700 cursor-pointer"
              >
                {t('cancelBtn')}
              </button>
              <button
                type="submit"
                className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-[10px] font-bold rounded text-white cursor-pointer"
              >
                {t('saveBtn')}
              </button>
            </div>
          </form>
        ) : (
          <div>
            {idea.hidden && !currentUser.isFacilitator ? (
              <div className="flex flex-col items-center justify-center py-4 text-slate-400 select-none">
                <EyeOff className="w-5 h-5 mb-1 opacity-60" />
                <p className="text-[11px] font-medium text-center leading-tight">Oculto pelo Facilitador<br/><span className="text-[10px] opacity-75">(Evita viés de grupo)</span></p>
              </div>
            ) : (
              <div>
                {idea.hidden && currentUser.isFacilitator && (
                  <span className="inline-flex items-center gap-1 bg-slate-900/10 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-1">
                    <EyeOff className="w-2.5 h-2.5" /> Oculto para Alunos
                  </span>
                )}
                <p id={`text_idea_${idea.id}`} className="text-xs md:text-sm font-medium leading-relaxed break-words whitespace-pre-wrap">
                  {idea.text}
                </p>
              </div>
            )}
          </div>
        )}
      </div>


      {/* Card Footer: Metadata and Interactivity */}
      <div className="border-t border-black/5 pt-2 flex flex-col gap-2 mt-auto select-none">
        
        {/* Author details & Direct Positive/Negative Votes */}
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1 font-semibold text-slate-500 max-w-[45%]">
            <span className="text-xs" role="img" aria-label="avatar">{displayAuthorAvatar}</span>
            <span id={`author_idea_${idea.id}`} className="truncate">{displayAuthorName}</span>
          </div>

          {/* Direct Interactive Vote Buttons (👍 & 👎) */}
          <div className="flex items-center gap-1.5 select-none">
            {['👍', '👎'].map(emoji => {
              const count = idea.reactions?.[emoji] || 0;
              const hasVoted = !!(idea.votedUsersByEmoji?.[emoji]?.includes(currentUser.id));
              
              return (
                <button
                  key={emoji}
                  id={`btn_vote_${emoji === '👍' ? 'pos' : 'neg'}_${idea.id}`}
                  disabled={!votingModeActive}
                  onClick={() => onReact(idea.id, emoji)}
                  className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold transition-all border ${
                    !votingModeActive
                      ? 'cursor-not-allowed opacity-75'
                      : 'cursor-pointer hover:bg-white hover:text-slate-800'
                  } ${
                    hasVoted
                      ? emoji === '👍'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700 font-extrabold shadow-sm'
                        : 'bg-rose-50 border-rose-400 text-rose-700 font-extrabold shadow-sm'
                      : 'bg-white/60 border-slate-200 text-slate-500'
                  }`}
                  title={
                    !votingModeActive
                      ? `A votação não está aberta neste momento`
                      : hasVoted
                        ? `Você votou ${emoji === '👍' ? 'positivo' : 'negativo'}. Clique para remover.`
                        : `Votar com ${emoji === '👍' ? 'positivo' : 'negativo'}`
                  }
                >
                  <span className="text-[11px]">{emoji}</span>
                  <span className="font-mono text-[9px]">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column Navigation controls */}
        {canModify && !isEditing && (
          <div className="flex items-center justify-between pt-1 border-t border-black/[0.03]">
            <span className="text-[9px] text-slate-400 font-medium">Mover cartão:</span>
            <div className="flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity">
              <button
                id={`btn_move_left_${idea.id}`}
                disabled={!canMoveLeft}
                onClick={() => onMoveColumn(idea.id, 'left')}
                className="p-0.5 hover:bg-black/10 rounded disabled:opacity-20 cursor-pointer text-slate-600"
                title="Mover para coluna anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                id={`btn_move_right_${idea.id}`}
                disabled={!canMoveRight}
                onClick={() => onMoveColumn(idea.id, 'right')}
                className="p-0.5 hover:bg-black/10 rounded disabled:opacity-20 cursor-pointer text-slate-600"
                title="Mover para próxima coluna"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-slate-900/95 text-white rounded p-4 flex flex-col justify-center items-center text-center z-20 animate-in fade-in duration-150">
          <p className="text-xs font-bold mb-3">Deseja realmente excluir esta nota?</p>
          <div className="flex gap-2">
            <button
              id={`btn_confirm_cancel_delete_${idea.id}`}
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-[11px] font-bold rounded transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id={`btn_confirm_delete_note_${idea.id}`}
              onClick={() => {
                onDelete(idea.id);
                setShowDeleteConfirm(false);
              }}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-[11px] font-bold rounded transition-all cursor-pointer"
            >
              Excluir
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default IdeaCard;
