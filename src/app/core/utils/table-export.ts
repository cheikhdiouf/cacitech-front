import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

/** Exporte les lignes visibles (déjà filtrées/triées) d'un tableau vers un fichier Excel. */
export function exportToExcel<T>(rows: T[], columns: ExportColumn<T>[], filename: string): void {
  const data = rows.map((row) => {
    const record: Record<string, string | number> = {};
    columns.forEach((col) => {
      record[col.header] = col.value(row);
    });
    return record;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Données');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/** Exporte les lignes visibles (déjà filtrées/triées) d'un tableau vers un fichier PDF. */
export function exportToPdf<T>(rows: T[], columns: ExportColumn<T>[], filename: string, title: string): void {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text(title, 14, 16);

  autoTable(doc, {
    startY: 22,
    head: [columns.map((col) => col.header)],
    body: rows.map((row) => columns.map((col) => String(col.value(row)))),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [79, 70, 229] }
  });

  doc.save(`${filename}.pdf`);
}
