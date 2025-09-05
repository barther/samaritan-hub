import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
  reportType: string;
  startDate: string;
  endDate: string;
  data: any[];
  totalDonations?: number;
  totalDisbursements?: number;
}

export const generatePDFReport = (reportData: ReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Good Samaritan Assistance Report', pageWidth / 2, 20, { align: 'center' });
  
  // Report details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const reportTitle = getReportTitle(reportData.reportType);
  doc.text(reportTitle, pageWidth / 2, 35, { align: 'center' });
  doc.text(`Period: ${formatDate(reportData.startDate)} to ${formatDate(reportData.endDate)}`, pageWidth / 2, 45, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, 55, { align: 'center' });
  
  // Add a line separator
  doc.setLineWidth(0.5);
  doc.line(20, 65, pageWidth - 20, 65);
  
  let startY = 75;
  
  switch (reportData.reportType) {
    case 'donations':
      startY = generateDonationsTable(doc, reportData.data, startY);
      break;
    case 'disbursements':
      startY = generateDisbursementsTable(doc, reportData.data, startY);
      break;
    case 'interactions':
      startY = generateInteractionsTable(doc, reportData.data, startY);
      break;
    case 'clients':
      startY = generateClientsTable(doc, reportData.data, startY);
      break;
    case 'financial':
      startY = generateFinancialReport(doc, reportData, startY);
      break;
  }
  
  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, doc.internal.pageSize.height - 10);
    doc.text('Good Samaritan Assistance System', 20, doc.internal.pageSize.height - 10);
  }
  
  return doc;
};

const getReportTitle = (reportType: string): string => {
  const titles = {
    donations: 'Donations Report',
    disbursements: 'Disbursements Report',
    interactions: 'Client Interactions Report',
    clients: 'Client Registry Report',
    financial: 'Financial Summary Report'
  };
  return titles[reportType as keyof typeof titles] || 'Report';
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const generateDonationsTable = (doc: jsPDF, data: any[], startY: number): number => {
  const headers = [['Date', 'Donor Name', 'Amount', 'Source', 'Notes']];
  const rows = data.map(d => [
    formatDate(d.donation_date),
    d.donor_name || 'Anonymous',
    formatCurrency(d.amount),
    d.source,
    (d.notes || '').substring(0, 50) + (d.notes && d.notes.length > 50 ? '...' : '')
  ]);
  
  autoTable(doc, {
    head: headers,
    body: rows,
    startY: startY,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      2: { halign: 'right' } // Amount column
    }
  });
  
  // Add total
  const total = data.reduce((sum, d) => sum + Number(d.amount), 0);
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Donations: ${formatCurrency(total)}`, doc.internal.pageSize.width - 60, finalY, { align: 'right' });
  
  return finalY + 20;
};

const generateDisbursementsTable = (doc: jsPDF, data: any[], startY: number): number => {
  const headers = [['Date', 'Recipient', 'Amount', 'Type', 'Payment Method', 'Notes']];
  const rows = data.map(d => [
    formatDate(d.disbursement_date),
    d.recipient_name,
    formatCurrency(d.amount),
    d.assistance_type,
    d.payment_method,
    (d.notes || '').substring(0, 40) + (d.notes && d.notes.length > 40 ? '...' : '')
  ]);
  
  autoTable(doc, {
    head: headers,
    body: rows,
    startY: startY,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      2: { halign: 'right' } // Amount column
    }
  });
  
  // Add total
  const total = data.reduce((sum, d) => sum + Number(d.amount), 0);
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Disbursements: ${formatCurrency(total)}`, doc.internal.pageSize.width - 60, finalY, { align: 'right' });
  
  return finalY + 20;
};

const generateInteractionsTable = (doc: jsPDF, data: any[], startY: number): number => {
  const headers = [['Date', 'Client', 'Channel', 'Status', 'Summary', 'Requested']];
  const rows = data.map(i => [
    new Date(i.occurred_at).toLocaleDateString(),
    `${i.clients?.first_name || ''} ${i.clients?.last_name || ''}`.trim() || 'N/A',
    i.channel,
    i.status,
    (i.summary || '').substring(0, 40) + (i.summary && i.summary.length > 40 ? '...' : ''),
    i.requested_amount ? formatCurrency(i.requested_amount) : '-'
  ]);
  
  autoTable(doc, {
    head: headers,
    body: rows,
    startY: startY,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      5: { halign: 'right' } // Requested amount column
    }
  });
  
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Interactions: ${data.length}`, doc.internal.pageSize.width - 60, finalY, { align: 'right' });
  
  return finalY + 20;
};

const generateClientsTable = (doc: jsPDF, data: any[], startY: number): number => {
  const headers = [['Date Created', 'Name', 'Email', 'Phone', 'City', 'State']];
  const rows = data.map(c => [
    new Date(c.created_at).toLocaleDateString(),
    `${c.first_name} ${c.last_name}`,
    c.email || '-',
    c.phone || '-',
    c.city || '-',
    c.state || '-'
  ]);
  
  autoTable(doc, {
    head: headers,
    body: rows,
    startY: startY,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [46, 125, 50], textColor: 255, fontStyle: 'bold' }
  });
  
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Clients: ${data.length}`, doc.internal.pageSize.width - 60, finalY, { align: 'right' });
  
  return finalY + 20;
};

const generateFinancialReport = (doc: jsPDF, reportData: ReportData, startY: number): number => {
  const { totalDonations = 0, totalDisbursements = 0 } = reportData;
  const netBalance = totalDonations - totalDisbursements;
  
  // Summary box
  doc.setFillColor(245, 245, 245);
  doc.rect(20, startY, doc.internal.pageSize.width - 40, 60, 'F');
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Summary', doc.internal.pageSize.width / 2, startY + 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  const summaryY = startY + 30;
  doc.text(`Total Donations:`, 30, summaryY);
  doc.text(formatCurrency(totalDonations), doc.internal.pageSize.width - 30, summaryY, { align: 'right' });
  
  doc.text(`Total Disbursements:`, 30, summaryY + 10);
  doc.text(formatCurrency(totalDisbursements), doc.internal.pageSize.width - 30, summaryY + 10, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Net Balance:`, 30, summaryY + 20);
  doc.setTextColor(netBalance >= 0 ? 46 : 220, netBalance >= 0 ? 125 : 50, netBalance >= 0 ? 50 : 47);
  doc.text(formatCurrency(netBalance), doc.internal.pageSize.width - 30, summaryY + 20, { align: 'right' });
  doc.setTextColor(0, 0, 0); // Reset color
  
  return startY + 80;
};

export const downloadPDF = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};