import React from 'react';
import { Room, Idea, RoomColumn } from '../types';
import { Download, X, Printer, FileText } from 'lucide-react';

interface ExportModalProps {
  room: Room;
  columns: RoomColumn[];
  ideas: Idea[];
  onClose: () => void;
}

export default function ExportModal({ room, columns, ideas, onClose }: ExportModalProps) {
  
  const handlePrint = () => {
    window.print();
  };

  const getCSVData = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Etapa,Autor,Idéia,Votos\n';
    
    columns.forEach(col => {
      const colIdeas = ideas.filter(i => i.columnId === col.id);
      colIdeas.forEach(idea => {
        const escapedText = idea.text.replace(/"/g, '""');
        const author = room.anonymizeAuthors ? 'Anônimo' : idea.authorName;
        csvContent += `"${col.title}","${author}","${escapedText}",${idea.votes}\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `resultado_${room.pin}_ideacao.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="export_modal_overlay" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div id="export_modal_container" className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col justify-between">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm md:text-base">Exportar Resultados</h3>
              <p className="text-[11px] text-slate-500 font-medium">Faça o download do relatório completo da sessão de brainstorming.</p>
            </div>
          </div>
          <button
            id="btn_close_export_modal"
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
            title="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Live Report View */}
        <div id="export_report_body" className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* Cover Section */}
          <div className="text-center pb-4 border-b border-slate-100">
            <span className="text-xs font-bold font-mono tracking-widest text-indigo-600 uppercase">Relatório de Ideação</span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1 font-display">{room.title}</h2>
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500 mt-2 font-medium">
              <span>Facilitador: <b>@{room.facilitatorName}</b></span>
              <span>•</span>
              <span>PIN: <b>{room.pin}</b></span>
              <span>•</span>
              <span>Template: <b>{room.template === 'design-thinking' ? 'Design Thinking' : room.template === 'sticky-board' ? 'Quadro Livre' : 'Matriz de Priorização'}</b></span>
            </div>
          </div>

          {/* Table of Content grouped by stage */}
          <div className="space-y-5">
            {columns.map((col) => {
              const colIdeas = ideas.filter(i => i.columnId === col.id);
              return (
                <div key={col.id} className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-2">{col.title} ({colIdeas.length})</h4>
                  {colIdeas.length === 0 ? (
                    <p className="text-xs text-slate-400 italic pl-3">Nenhum post-it adicionado nesta etapa.</p>
                  ) : (
                    <div className="space-y-2 pl-2">
                      {colIdeas.map((idea) => {
                        const author = room.anonymizeAuthors ? 'Anônimo' : idea.authorName;
                        return (
                          <div key={idea.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-start justify-between text-xs">
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-700 leading-relaxed">{idea.text}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                                <span>Por: <b>{author}</b></span>
                                {Object.entries(idea.reactions).some(([_, count]) => count > 0) && (
                                  <>
                                    <span>•</span>
                                    <span>Reações: {Object.entries(idea.reactions).map(([emoji, count]) => count > 0 ? `${emoji}${count} ` : '').join(' ')}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full shrink-0">
                              👍 {idea.votes}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
          <button
            id="btn_download_csv"
            onClick={getCSVData}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download CSV
          </button>
          
          <button
            id="btn_print_pdf"
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm shadow-indigo-100 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Imprimir / PDF
          </button>
        </div>

      </div>

      {/* Inject printing style override to render clean PDF without UI boundaries */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #export_report_body, #export_report_body * {
            visibility: visible;
          }
          #export_modal_overlay {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            background: white !important;
            box-shadow: none !important;
          }
          #export_modal_container {
            border: none !important;
            box-shadow: none !important;
            max-height: none !important;
          }
          #export_report_body {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
          }
        }
      `}</style>

    </div>
  );
}
