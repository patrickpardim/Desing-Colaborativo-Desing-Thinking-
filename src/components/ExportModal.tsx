import React from 'react';
import { Room, Idea, RoomColumn } from '../types';
import { Download, X, Printer, FileText, File } from 'lucide-react';
import { jsPDF } from 'jspdf';

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

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2); // 180mm
      let y = 20;

      // Helper to check page boundary and add new page
      const checkPageBreak = (neededHeight: number) => {
        if (y + neededHeight > pageHeight - margin) {
          doc.addPage();
          y = 20;
          return true;
        }
        return false;
      };

      // Title header banner
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.rect(margin, y, contentWidth, 8, 'F');
      y += 5;

      // Header Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('RELATÓRIO COMPLETO DA SESSÃO - DESIGN COLABORATIVO', margin + 4, y);
      y += 8;

      // Room Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42); // slate-900
      const titleLines = doc.splitTextToSize(room.title, contentWidth);
      checkPageBreak(titleLines.length * 6 + 10);
      doc.text(titleLines, margin, y);
      y += (titleLines.length * 6) + 3;

      // Metadata Bar
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      
      const templateName = room.template === 'design-thinking' 
        ? 'Design Thinking' 
        : room.template === 'sticky-board' 
          ? 'Quadro Livre' 
          : 'Matriz de Priorização';

      doc.text(`Facilitador: @${room.facilitatorName}   |   PIN: ${room.pin}   |   Metodologia: ${templateName}`, margin, y);
      y += 8;

      // Divider line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(margin, y, margin + contentWidth, y);
      y += 8;

      // Iterate over columns
      columns.forEach(col => {
        const colIdeas = ideas.filter(i => i.columnId === col.id);
        
        // Column Header Section
        checkPageBreak(15);
        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(margin, y, contentWidth, 8, 'F');
        doc.setDrawColor(79, 70, 229); // indigo-600 left border accent
        doc.setLineWidth(1);
        doc.line(margin, y, margin, y + 8);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85); // slate-700
        doc.text(`${col.title.toUpperCase()} (${colIdeas.length})`, margin + 4, y + 5.5);
        y += 12;

        if (colIdeas.length === 0) {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(9);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text('Nenhum post-it adicionado nesta etapa.', margin + 4, y);
          y += 6;
        } else {
          colIdeas.forEach(idea => {
            const author = room.anonymizeAuthors ? 'Anônimo' : idea.authorName;
            
            // Generate full idea block detail
            const ideaText = idea.text;
            const detailText = `Por: @${author}  |  Votos: ${idea.votes}`;
            
            // Format text lines
            const textLines = doc.splitTextToSize(ideaText, contentWidth - 12);
            const neededHeight = (textLines.length * 5) + 12; // 12 for metadata and spacing
            
            checkPageBreak(neededHeight);

            // Draw post-it card box outline
            doc.setFillColor(250, 250, 250);
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.3);
            doc.rect(margin + 2, y, contentWidth - 4, neededHeight - 3, 'FD');

            // Draw Idea text
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(30, 41, 59); // slate-800
            doc.text(textLines, margin + 6, y + 5);

            // Draw details (Author + Votes)
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.text(detailText, margin + 6, y + (textLines.length * 5) + 5);

            y += neededHeight;
          });
        }
        y += 4; // Add spacing between columns
      });

      // Save PDF document
      doc.save(`resultado_${room.pin}_design_colaborativo.pdf`);
    } catch (err) {
      console.error('Error generating PDF report:', err);
      alert('Houve um erro ao gerar o PDF. Por favor, tente exportar via impressão.');
    }
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
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2 shrink-0">
          <button
            id="btn_download_csv"
            onClick={getCSVData}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download CSV
          </button>
          
          <button
            id="btn_download_pdf_direct"
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm shadow-indigo-100 cursor-pointer"
          >
            <File className="w-4 h-4" /> Download PDF
          </button>

          <button
            id="btn_print_pdf"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Imprimir
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
