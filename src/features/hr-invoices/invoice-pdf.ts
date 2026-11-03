import { jsPDF } from 'jspdf';
import type { HrInvoiceDetail } from '@/types/api';
import { formatInvoiceDate, formatInvoiceQty } from '@/features/hr-invoices/invoice-document';

function pdfMoney(currency: string, value: number): string {
  const amount = value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (currency === 'GBP') return `£${amount}`;
  if (currency === 'USD') return `$${amount}`;
  if (currency === 'EUR') return `EUR ${amount}`;
  return `INR ${amount}`;
}

async function logoDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) return null;
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadInvoicePdf(invoice: HrInvoiceDetail): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 16;
  const right = pageWidth - 16;
  let y = 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(22);
  doc.text('INVOICE', left, y + 6);

  const logo = await logoDataUrl(invoice.logoUrl);
  if (logo) {
    try {
      const kind = logo.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(logo, kind, right - 36, 12, 32, 16);
    } catch {
      // A WebP logo cannot be embedded. The company name still prints.
    }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(invoice.companyName.toUpperCase(), right, logo ? 34 : 18, { align: 'right' });

  y = logo ? 44 : 28;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80);
  const issuerLine = [invoice.companyName, invoice.issuerAddress.replace(/\n/g, ', ')].filter(Boolean).join(', ');
  const issuerLines = doc.splitTextToSize(issuerLine, pageWidth - 32);
  doc.text(issuerLines, left, y);
  y += issuerLines.length * 4 + 8;
  doc.setTextColor(0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('BILL TO', left, y);
  const metaX = 120;
  const metaRows: [string, string][] = [
    ['Invoice No.:', invoice.invoiceNumber],
    ['Issue date:', formatInvoiceDate(invoice.issueDate)],
    ['Due date:', formatInvoiceDate(invoice.dueDate)],
    ['Reference:', invoice.reference || '—'],
  ];
  metaRows.forEach((row, index) => {
    doc.setFont('helvetica', 'normal');
    doc.text(row[0], metaX, y + index * 6);
    doc.setFont('helvetica', 'bold');
    doc.text(row[1], right, y + index * 6, { align: 'right' });
  });

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(invoice.clientName, left, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (invoice.clientAddress) {
    const addressLines = doc.splitTextToSize(invoice.clientAddress, 90);
    doc.text(addressLines, left, y);
    y += addressLines.length * 4.5;
  }
  y = Math.max(y, 18 + metaRows.length * 6) + 12;

  doc.setFillColor(243, 244, 246);
  doc.rect(left, y, right - left, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DESCRIPTION', left + 2, y + 5.4);
  doc.text('QUANTITY', 118, y + 5.4, { align: 'center' });
  doc.text(`UNIT PRICE (${invoice.currency})`, 156, y + 5.4, { align: 'right' });
  doc.text(`AMOUNT (${invoice.currency})`, right - 2, y + 5.4, { align: 'right' });
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  for (const line of invoice.lines) {
    const description = doc.splitTextToSize(line.description, 78);
    const detail = line.detail ? doc.splitTextToSize(line.detail, 78) : [];
    const block = description.length * 4.5 + detail.length * 4 + 4;
    if (y + block > 250) {
      doc.addPage();
      y = 18;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(description, left + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatInvoiceQty(line.quantity), 118, y, { align: 'center' });
    doc.text(pdfMoney(invoice.currency, line.unitPrice), 156, y, { align: 'right' });
    doc.text(pdfMoney(invoice.currency, line.amount), right - 2, y, { align: 'right' });
    if (detail.length) {
      doc.setTextColor(107);
      doc.text(detail, left + 2, y + description.length * 4.5);
      doc.setTextColor(0);
    }
    y += block;
    doc.setDrawColor(229, 231, 235);
    doc.line(left, y - 2, right, y - 2);
  }

  if (y > 230) {
    doc.addPage();
    y = 18;
  }
  y += 4;
  const boxW = 78;
  const boxX = right - boxW;
  doc.setFontSize(10);
  doc.text(`TOTAL (${invoice.currency}):`, boxX + 2, y + 6);
  doc.text(pdfMoney(invoice.currency, invoice.total), right - 2, y + 6, { align: 'right' });
  y += 8;
  doc.setFillColor(17, 17, 17);
  doc.rect(boxX, y, boxW, 10, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL DUE (${invoice.currency})`, boxX + 2, y + 6.5);
  doc.text(pdfMoney(invoice.currency, invoice.total), right - 2, y + 6.5, { align: 'right' });
  doc.setTextColor(0);

  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Issued by, signature:', right, y, { align: 'right' });
  doc.setFont('times', 'italic');
  doc.setFontSize(18);
  doc.text(invoice.signatureName, right, y + 10, { align: 'right' });

  const footerY = doc.internal.pageSize.getHeight() - 14;
  doc.setDrawColor(209, 213, 219);
  doc.line(left, footerY - 6, right, footerY - 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80);
  const footer = [issuerLine, invoice.issuerEmail ? `Email: ${invoice.issuerEmail}` : ''].filter(Boolean).join('   ');
  doc.text(doc.splitTextToSize(footer, pageWidth - 32), left, footerY);

  doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
}
