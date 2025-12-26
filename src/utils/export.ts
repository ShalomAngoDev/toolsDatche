import { Vente, PaymentMethod } from '../models/types';
import { formatCurrency } from './currency';
import { Stats } from './stats';
import jsPDF from 'jspdf';

export function exportToCSV(ventes: Vente[]): string {
  const headers = [
    'ID',
    'Date',
    'Produit',
    'Prix Box (si Gamme)',
    'Quantité',
    'Mode de paiement',
    'Devise',
    'Prix unitaire',
    'Total',
    'Montant donné',
    'Monnaie à rendre'
  ];

  const rows = ventes.map(v => [
    v.id,
    v.createdAt.toISOString(),
    v.product,
    v.boxPricing || '',
    v.quantity.toString(),
    v.paymentMethod,
    v.currency,
    v.unitPrice.toString(),
    v.total.toString(),
    v.amountPaid.toString(),
    v.change.toString()
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportVentesToCSV(ventes: Vente[]): void {
  const csv = exportToCSV(ventes);
  const date = new Date().toISOString().split('T')[0];
  downloadFile(csv, `datche-ventes-${date}.csv`, 'text/csv;charset=utf-8;');
}

export function exportVentesToJSON(ventes: Vente[]): void {
  const json = JSON.stringify(ventes, null, 2);
  const date = new Date().toISOString().split('T')[0];
  downloadFile(json, `datche-ventes-${date}.json`, 'application/json');
}

export function importVentesFromJSON(file: File): Promise<Vente[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const ventes = JSON.parse(content) as Vente[];
        // Convertir les dates string en Date objects
        const ventesWithDates = ventes.map(v => ({
          ...v,
          createdAt: new Date(v.createdAt)
        }));
        resolve(ventesWithDates);
      } catch (error) {
        reject(new Error('Fichier JSON invalide'));
      }
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsText(file);
  });
}

export function exportVentesToPDF(ventes: Vente[], stats: Stats): void {
  const doc = new jsPDF();
  let yPos = 20;

  // Titre
  doc.setFontSize(18);
  doc.text('Rapport des Ventes - Datche event', 14, yPos);
  yPos += 10;

  // Date
  doc.setFontSize(10);
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Date: ${date}`, 14, yPos);
  yPos += 15;

  // Résumé
  doc.setFontSize(14);
  doc.text('Résumé de la journée', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.text(`Nombre total de ventes: ${stats.totalVentes}`, 14, yPos);
  yPos += 6;
  doc.text(`Quantité totale vendue: ${stats.totalQuantite}`, 14, yPos);
  yPos += 6;
  doc.text(`Total EUR: ${formatCurrency(stats.totalEUR, 'EUR')}`, 14, yPos);
  yPos += 6;
  doc.text(`Total FCFA: ${formatCurrency(stats.totalFCFA, 'FCFA')}`, 14, yPos);
  yPos += 10;

  // Soldes par mode de paiement
  doc.setFontSize(12);
  doc.text('Soldes par mode de paiement', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  Object.entries(stats.repartitionPaiement).forEach(([method, amount]) => {
    const currency = method === PaymentMethod.Revolut ? 'EUR' : 'FCFA';
    doc.text(`${method}: ${formatCurrency(amount, currency)}`, 20, yPos);
    yPos += 6;
  });
  yPos += 10;

  // Tableau des ventes
  if (ventes.length > 0) {
    doc.setFontSize(14);
    doc.text('Détail des ventes', 14, yPos);
    yPos += 8;

    // En-têtes du tableau
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    const headers = ['Date', 'Produit', 'Qté', 'Paiement', 'Total'];
    const colWidths = [40, 50, 15, 35, 30];
    let xPos = 14;

    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos);
      xPos += colWidths[i];
    });
    yPos += 6;
    doc.setFont(undefined, 'normal');

    // Lignes du tableau
    ventes.forEach((vente, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      const dateStr = new Date(vente.createdAt).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      const productStr = vente.product + (vente.boxPricing ? ` (${vente.boxPricing})` : '');
      const totalStr = formatCurrency(vente.total, vente.currency);

      xPos = 14;
      doc.text(dateStr, xPos, yPos);
      xPos += colWidths[0];
      doc.text(productStr.substring(0, 20), xPos, yPos);
      xPos += colWidths[1];
      doc.text(vente.quantity.toString(), xPos, yPos);
      xPos += colWidths[2];
      doc.text(vente.paymentMethod, xPos, yPos);
      xPos += colWidths[3];
      doc.text(totalStr, xPos, yPos);

      yPos += 6;
    });
  }

  // Sauvegarder le PDF
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`datche-ventes-${dateStr}.pdf`);
}

export function exportTransactionsByPaymentMethod(
  ventes: Vente[],
  paymentMethod: PaymentMethod
): void {
  const filteredVentes = ventes.filter(v => v.paymentMethod === paymentMethod);
  const currency = paymentMethod === PaymentMethod.Revolut ? 'EUR' : 'FCFA';
  const total = filteredVentes.reduce((sum, v) => sum + v.total, 0);

  const doc = new jsPDF();
  let yPos = 20;

  // Titre
  doc.setFontSize(18);
  doc.text(`Transactions ${paymentMethod} - Datche event`, 14, yPos);
  yPos += 10;

  // Date
  doc.setFontSize(10);
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Date: ${date}`, 14, yPos);
  yPos += 8;

  // Total
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text(`Total ${paymentMethod}: ${formatCurrency(total, currency)}`, 14, yPos);
  yPos += 10;
  doc.setFont(undefined, 'normal');

  // Nombre de transactions
  doc.setFontSize(10);
  doc.text(`Nombre de transactions: ${filteredVentes.length}`, 14, yPos);
  yPos += 15;

  // Tableau des transactions
  if (filteredVentes.length > 0) {
    doc.setFontSize(12);
    doc.text('Détail des transactions', 14, yPos);
    yPos += 8;

    // En-têtes du tableau
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    const headers = ['Date/Heure', 'Produit', 'Qté', 'Prix unit.', 'Total', 'Montant donné', 'Monnaie'];
    const colWidths = [32, 40, 10, 22, 22, 22, 22];
    let xPos = 14;

    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos);
      xPos += colWidths[i];
    });
    yPos += 6;
    doc.setFont(undefined, 'normal');

    // Lignes du tableau
    filteredVentes.forEach((vente) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      const dateStr = new Date(vente.createdAt).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      const productStr = vente.product + (vente.boxPricing ? ` (${vente.boxPricing})` : '');

      doc.setFontSize(8);
      xPos = 14;
      doc.text(dateStr, xPos, yPos);
      xPos += colWidths[0];
      doc.text(productStr.substring(0, 16), xPos, yPos);
      xPos += colWidths[1];
      doc.text(vente.quantity.toString(), xPos, yPos);
      xPos += colWidths[2];
      doc.text(formatCurrency(vente.unitPrice, currency), xPos, yPos);
      xPos += colWidths[3];
      doc.text(formatCurrency(vente.total, currency), xPos, yPos);
      xPos += colWidths[4];
      doc.text(formatCurrency(vente.amountPaid, currency), xPos, yPos);
      xPos += colWidths[5];
      doc.text(formatCurrency(vente.change, currency), xPos, yPos);

      yPos += 6;
    });

    // Ligne de total en bas
    yPos += 3;
    doc.setFont(undefined, 'bold');
    xPos = 14;
    doc.text('TOTAL', xPos, yPos);
    xPos += colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3];
    doc.text(formatCurrency(total, currency), xPos, yPos);
  } else {
    doc.setFontSize(10);
    doc.text('Aucune transaction enregistrée', 14, yPos);
  }

  // Sauvegarder le PDF
  const dateStr = new Date().toISOString().split('T')[0];
  const methodName = paymentMethod.replace(/\s+/g, '-').toLowerCase();
  doc.save(`datche-transactions-${methodName}-${dateStr}.pdf`);
}

