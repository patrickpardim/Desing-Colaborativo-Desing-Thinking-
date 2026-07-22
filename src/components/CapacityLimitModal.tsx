import React from 'react';
import { Users, X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface CapacityLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxCapacity?: number;
}

export default function CapacityLimitModal({
  isOpen,
  onClose,
  maxCapacity = 50
}: CapacityLimitModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div 
      id="modal_capacity_limit_backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id="modal_capacity_limit_card"
        className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-slate-900/20 text-center relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Icon Button */}
        <button
          id="btn_close_capacity_modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-5 shadow-sm ring-4 ring-rose-50/50">
          <ShieldAlert className="w-9 h-9 text-rose-600" />
        </div>

        {/* Modal Title (User Requested exact phrase) */}
        <h3 id="capacity_modal_title" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
          {t('capacityLimitTitle')}
        </h3>

        {/* Description Subtext */}
        <p id="capacity_modal_sub" className="text-xs sm:text-sm text-slate-600 mt-2.5 font-medium leading-relaxed">
          {t('capacityLimitSub')}
        </p>

        {/* Capacity Indicator Pill */}
        <div className="mt-5 inline-flex items-center gap-2 bg-rose-50 border border-rose-200 px-4 py-2 rounded-full text-xs font-extrabold text-rose-700 font-mono shadow-3xs">
          <Users className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{t('capacityLimitBadge')}</span>
        </div>

        {/* Action Button */}
        <div className="mt-7">
          <button
            id="btn_capacity_modal_ok"
            onClick={onClose}
            className="w-full py-3 px-5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-rose-600/20 hover:shadow-rose-600/30 transition-all cursor-pointer active:scale-98"
          >
            {t('capacityLimitOk')}
          </button>
        </div>
      </div>
    </div>
  );
}
