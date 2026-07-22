import React, { useState, useRef, useEffect } from 'react';
import { getStageExplanation } from '../data';
import { HelpCircle, Info, X, Sparkles } from 'lucide-react';

interface ColumnInfoPopoverProps {
  columnId: string;
  columnTitle: string;
}

export const ColumnInfoPopover: React.FC<ColumnInfoPopoverProps> = ({ columnId, columnTitle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const info = getStageExplanation(columnId, columnTitle);

  if (!info) return null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Exclamation Mark Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title={`Explicação sobre a etapa: ${info.title}`}
        aria-label={`Ver explicação sobre a etapa ${info.title}`}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs transition-all transform hover:scale-115 active:scale-95 cursor-pointer ring-2 ring-amber-200/80 ml-1.5 shrink-0"
      >
        !
      </button>

      {/* Pop-up Overlay Card */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-7 left-0 z-50 w-[270px] sm:w-[290px] p-3.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-amber-200/80 text-slate-800 text-left animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
          style={{ transform: 'translate3d(0,0,0)' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2 mb-2 border-b border-amber-100">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-500 font-bold text-sm">💡</span>
                <h4 className="font-extrabold text-slate-900 text-sm tracking-tight font-display">
                  {info.title}
                </h4>
              </div>
              <p className="text-[11px] font-semibold text-amber-700/90 italic mt-0.5">
                ({info.subtitle})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Explanation Text */}
          <p className="text-xs text-slate-600 leading-relaxed font-normal mb-2.5">
            {info.explanation}
          </p>

          {/* Summary Footer */}
          <div className="p-2 rounded-xl bg-amber-50/90 border border-amber-200/60 text-amber-950 text-[11px] font-medium leading-tight flex items-start gap-1.5">
            <span className="shrink-0 font-bold text-amber-600">📌</span>
            <div>
              <strong className="font-bold text-amber-900">Resumo:</strong>{' '}
              <span>{info.summary}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnInfoPopover;
