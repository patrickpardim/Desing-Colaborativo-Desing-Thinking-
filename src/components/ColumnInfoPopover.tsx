import React, { useState, useRef, useEffect } from 'react';
import { getStageExplanation } from '../data';
import { X } from 'lucide-react';

interface ColumnInfoPopoverProps {
  columnId: string;
  columnTitle: string;
  align?: 'left' | 'right';
}

export const ColumnInfoPopover: React.FC<ColumnInfoPopoverProps> = ({
  columnId,
  columnTitle,
  align = 'left'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const info = getStageExplanation(columnId, columnTitle);

  if (!info) return null;

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    leaveTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

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
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const alignClasses = align === 'right' 
    ? 'right-0 left-auto' 
    : 'left-0 right-auto';

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Exclamation Mark Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
          setIsOpen((prev) => !prev);
        }}
        title={`Explicação sobre a etapa: ${info.title}`}
        aria-label={`Ver explicação sobre a etapa ${info.title}`}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs transition-all transform hover:scale-110 active:scale-95 cursor-pointer ring-2 ring-amber-200/80 ml-1.5 shrink-0"
      >
        !
      </button>

      {/* Pop-up Overlay Card */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-full mt-2 z-50 w-[270px] sm:w-[290px] p-3.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-amber-200/80 text-slate-800 text-left animate-in fade-in zoom-in-95 duration-150 pointer-events-auto before:absolute before:-top-3 before:left-0 before:w-full before:h-3 ${alignClasses}`}
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
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
