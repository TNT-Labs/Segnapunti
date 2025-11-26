// ===================================================================
// 📤 EXPORT MODULE - PDF & CSV Export
// ===================================================================
// Gestisce l'export dello storico partite in formato PDF e CSV
// ===================================================================

const ExportModule = (() => {

  // ===================================================================
  // 📄 EXPORT CSV
  // ===================================================================

  /**
   * Esporta lo storico partite in formato CSV
   * @param {Array} partite - Array di oggetti partita dal DatabaseModule
   * @returns {boolean} - True se export riuscito
   */
  const exportToCSV = (partite) => {
    try {
      Logger.log('[Export] Inizio export CSV...');

      if (!partite || partite.length === 0) {
        alert('⚠️ Nessuna partita da esportare!');
        return false;
      }

      // Header CSV
      const headers = [
        'Data',
        'Orario',
        'Gioco',
        'Modalità',
        'Vincitori',
        'Punteggio Finale',
        'Rounds Vinti',
        'Durata (min)',
        'Numero Giocatori',
        'Dettaglio Giocatori'
      ];

      // Crea le righe CSV
      const rows = partite.map(partita => {
        const data = new Date(partita.timestamp);
        const dataStr = data.toLocaleDateString('it-IT');
        const orarioStr = data.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

        const vincitori = partita.vincitori ? partita.vincitori.join(', ') : 'N/A';
        const puntiVincitore = partita.puntiVincitore || 0;
        const roundsVincitore = partita.roundsVincitore || 0;

        // Calcola durata
        const durata = partita.duration
          ? Math.round(partita.duration / 60000)
          : partita.endTime && partita.startTime
            ? Math.round((partita.endTime - partita.startTime) / 60000)
            : 0;

        const nomeGioco = partita.nomeGioco || 'Personalizzato';
        const modalita = formatModalita(partita.modalita, partita.roundMode);

        // Dettaglio giocatori
        const dettaglioGiocatori = partita.giocatori
          ? partita.giocatori.map(g => `${g.nome} (${g.punti} pt, ${g.rounds || 0} rounds)`).join(' | ')
          : '';

        return [
          dataStr,
          orarioStr,
          nomeGioco,
          modalita,
          vincitori,
          puntiVincitore,
          roundsVincitore,
          durata,
          partita.giocatori ? partita.giocatori.length : 0,
          dettaglioGiocatori
        ];
      });

      // Combina headers e rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => {
          // Escape virgole e quotes
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(','))
      ].join('\n');

      // Aggiungi BOM per Excel UTF-8
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      // Download file
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
      const fileName = `Segnapunti_Storico_${new Date().toISOString().split('T')[0]}.csv`;

      downloadFile(blob, fileName);

      Logger.log(`[Export] CSV esportato con successo: ${fileName}`);
      return true;

    } catch (error) {
      Logger.error('[Export] Errore durante export CSV:', error);
      alert('❌ Errore durante l\'esportazione CSV. Riprova.');
      return false;
    }
  };

  // ===================================================================
  // 📑 EXPORT PDF
  // ===================================================================

  /**
   * Esporta lo storico partite in formato PDF
   * @param {Array} partite - Array di oggetti partita dal DatabaseModule
   * @returns {boolean} - True se export riuscito
   */
  const exportToPDF = async (partite) => {
    try {
      Logger.log('[Export] Inizio export PDF...');

      if (!partite || partite.length === 0) {
        alert('⚠️ Nessuna partita da esportare!');
        return false;
      }

      // Verifica disponibilità jsPDF
      if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
        Logger.error('[Export] jsPDF non disponibile');
        alert('❌ Libreria PDF non caricata. Ricarica la pagina.');
        return false;
      }

      const { jsPDF } = jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');

      // Configurazione
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // ===== HEADER =====
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('🃏 Segnapunti', margin, yPosition);

      yPosition += 8;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text('Storico Partite', margin, yPosition);

      // Data export
      yPosition += 6;
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Esportato il: ${new Date().toLocaleString('it-IT')}`, margin, yPosition);

      // Linea separatore
      yPosition += 4;
      doc.setDrawColor(200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);

      yPosition += 8;

      // ===== STATISTICHE =====
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text(`Totale partite: ${partite.length}`, margin, yPosition);

      yPosition += 10;

      // ===== PARTITE =====
      for (let i = 0; i < partite.length; i++) {
        const partita = partite[i];

        // Check se serve nuova pagina
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        // Box partita
        const boxHeight = 35;
        doc.setFillColor(248, 249, 250);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, boxHeight, 'F');

        // Bordo
        doc.setDrawColor(220);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, boxHeight, 'S');

        const contentX = margin + 5;
        let contentY = yPosition + 7;

        // Numero partita
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100);
        doc.text(`Partita #${partite.length - i}`, contentX, contentY);

        // Data e ora
        const data = new Date(partita.timestamp);
        const dataStr = data.toLocaleDateString('it-IT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        const orarioStr = data.toLocaleTimeString('it-IT', {
          hour: '2-digit',
          minute: '2-digit'
        });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120);
        doc.text(`${dataStr} - ${orarioStr}`, pageWidth - margin - 5, contentY, { align: 'right' });

        contentY += 6;

        // Nome gioco e modalità
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        const nomeGioco = partita.nomeGioco || 'Personalizzato';
        const nomeGiocoWidth = doc.getTextWidth(nomeGioco);
        doc.text(nomeGioco, contentX, contentY);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        const modalita = formatModalita(partita.modalita, partita.roundMode);
        doc.text(`(${modalita})`, contentX + nomeGiocoWidth + 3, contentY);

        contentY += 6;

        // Vincitori
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(34, 139, 34); // Verde
        const vincitori = partita.vincitori ? partita.vincitori.join(', ') : 'N/A';
        doc.text(`Vincitori: ${vincitori}`, contentX, contentY);

        contentY += 5;

        // Punteggio e rounds
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0);
        const puntiStr = `Punteggio: ${partita.puntiVincitore || 0}`;
        const roundsStr = partita.roundsVincitore ? ` | Rounds: ${partita.roundsVincitore}` : '';
        doc.text(puntiStr + roundsStr, contentX, contentY);

        // Durata
        const durata = partita.duration
          ? Math.round(partita.duration / 60000)
          : partita.endTime && partita.startTime
            ? Math.round((partita.endTime - partita.startTime) / 60000)
            : 0;
        if (durata > 0) {
          doc.setTextColor(120);
          doc.text(`Durata: ${durata} min`, pageWidth - margin - 5, contentY, { align: 'right' });
        }

        contentY += 5;

        // Giocatori
        if (partita.giocatori && partita.giocatori.length > 0) {
          doc.setFontSize(9);
          doc.setTextColor(80);
          const giocatoriText = partita.giocatori
            .map(g => `${g.nome}: ${g.punti} pt`)
            .join(' | ');

          // Split testo se troppo lungo
          const maxWidth = pageWidth - 2 * margin - 10;
          const lines = doc.splitTextToSize(giocatoriText, maxWidth);
          doc.text(lines[0], contentX, contentY);
        }

        yPosition += boxHeight + 5;
      }

      // ===== FOOTER =====
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Pagina ${i} di ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.text(
          'Generato da Segnapunti',
          pageWidth - margin,
          pageHeight - 10,
          { align: 'right' }
        );
      }

      // Download PDF
      const fileName = `Segnapunti_Storico_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      Logger.log(`[Export] PDF esportato con successo: ${fileName}`);
      return true;

    } catch (error) {
      Logger.error('[Export] Errore durante export PDF:', error);
      alert('❌ Errore durante l\'esportazione PDF. Riprova.');
      return false;
    }
  };

  // ===================================================================
  // 🛠️ UTILITY FUNCTIONS
  // ===================================================================

  /**
   * Formatta la modalità di gioco per visualizzazione
   */
  const formatModalita = (modalita, roundMode) => {
    if (modalita === 'rounds') {
      return roundMode === 'max' ? 'Rounds Max' : 'Rounds Min';
    }
    if (modalita === 'darts') {
      return 'Darts';
    }
    if (modalita === 'max') {
      return 'Max';
    }
    if (modalita === 'min') {
      return 'Min';
    }
    return modalita || 'Standard';
  };

  /**
   * Download di un file blob
   */
  const downloadFile = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ===================================================================
  // 🔌 PUBLIC API
  // ===================================================================

  return {
    exportToCSV,
    exportToPDF
  };

})();

// Export globale
if (typeof window !== 'undefined') {
  window.ExportModule = ExportModule;
}
