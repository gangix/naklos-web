import jsPDF from 'jspdf';
import type { Invoice, Trip } from '../types';

/**
 * Generate PDF invoice from invoice and related trips data
 */
export function generateInvoicePDF(
  invoice: Invoice,
  relatedTrips: Trip[],
  fleetInfo: { name: string; phone: string; email: string }
) {
  const doc = new jsPDF();

  // Set up fonts and colors
  const primaryColor: [number, number, number] = [37, 99, 235]; // primary-600
  const textColor: [number, number, number] = [31, 41, 55]; // gray-800

  let yPosition = 20;

  // Header - Company Name
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.text('NAKLOS', 20, yPosition);

  yPosition += 10;
  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.text(fleetInfo.name, 20, yPosition);

  yPosition += 6;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // gray-500
  doc.text(`Tel: ${fleetInfo.phone} | E-posta: ${fleetInfo.email}`, 20, yPosition);

  // Invoice Title
  yPosition += 15;
  doc.setFontSize(20);
  doc.setTextColor(...textColor);
  doc.text('FATURA', 20, yPosition);

  // Invoice Info Box
  yPosition += 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);

  const invoiceNumber = invoice.id.split('-')[1];
  doc.text(`Fatura No: ${invoiceNumber}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Düzenleme Tarihi: ${new Date(invoice.issueDate).toLocaleDateString('tr-TR')}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Vade Tarihi: ${new Date(invoice.dueDate).toLocaleDateString('tr-TR')}`, 20, yPosition);

  // Client Info
  yPosition += 12;
  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.text('Müşteri Bilgileri:', 20, yPosition);
  yPosition += 8;
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.text(invoice.clientName, 20, yPosition);

  // Status Badge
  if (invoice.status === 'paid' && invoice.paidDate) {
    yPosition += 6;
    doc.setTextColor(22, 163, 74); // green-600
    doc.text(`✓ Ödendi: ${new Date(invoice.paidDate).toLocaleDateString('tr-TR')}`, 20, yPosition);
  }

  // Trips Table Header
  yPosition += 15;
  doc.setFontSize(12);
  doc.setTextColor(...textColor);
  doc.text('Sefer Detayları:', 20, yPosition);

  yPosition += 8;
  doc.setFillColor(243, 244, 246); // gray-100
  doc.rect(20, yPosition - 5, 170, 8, 'F');

  doc.setFontSize(9);
  doc.setTextColor(...textColor);
  doc.text('Güzergah', 25, yPosition);
  doc.text('Plaka', 100, yPosition);
  doc.text('Tutar', 150, yPosition);

  // Trips List
  yPosition += 8;
  doc.setFontSize(9);
  relatedTrips.forEach((trip) => {
    const route = `${trip.originCity} → ${trip.destinationCity}`;
    doc.text(route, 25, yPosition);
    doc.text(trip.truckPlate || 'N/A', 100, yPosition);
    doc.text(`₺${(trip.revenue || 0).toLocaleString('tr-TR')}`, 150, yPosition);

    // Add delivery confirmation indicator if exists
    if (trip.deliveryDocuments && trip.deliveryDocuments.length > 0) {
      doc.setTextColor(22, 163, 74); // green-600
      doc.setFontSize(7);
      doc.text(`✓ ${trip.deliveryDocuments.length} teslimat belgesi`, 25, yPosition + 4);
      doc.setTextColor(...textColor);
      doc.setFontSize(9);
    }

    yPosition += trip.deliveryDocuments?.length > 0 ? 10 : 7;

    // Check if we need a new page
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
  });

  // Total Amount Box
  yPosition += 10;
  doc.setFillColor(...primaryColor);
  doc.rect(20, yPosition - 5, 170, 15, 'F');

  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255); // white
  doc.text('TOPLAM TUTAR:', 25, yPosition + 5);
  doc.text(`₺${invoice.amount.toLocaleString('tr-TR')}`, 150, yPosition + 5);

  // Footer
  yPosition += 25;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Bu fatura elektronik ortamda oluşturulmuştur.', 105, yPosition, { align: 'center' });
  yPosition += 5;
  doc.text(`Oluşturulma: ${new Date().toLocaleString('tr-TR')}`, 105, yPosition, { align: 'center' });

  return doc;
}

/**
 * Download invoice as PDF
 */
export function downloadInvoicePDF(
  invoice: Invoice,
  relatedTrips: Trip[],
  fleetInfo: { name: string; phone: string; email: string }
) {
  const doc = generateInvoicePDF(invoice, relatedTrips, fleetInfo);
  const fileName = `Fatura_${invoice.id.split('-')[1]}_${invoice.clientName.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}

/**
 * Generate email mailto link for sending invoice
 */
export function generateInvoiceEmailLink(
  invoice: Invoice,
  relatedTrips: Trip[],
  clientEmail: string
): string {
  const subject = `Fatura #${invoice.id.split('-')[1]} - ${invoice.clientName}`;

  const body = `
Sayın ${invoice.clientName},

Aşağıdaki seferler için faturanızı ektedir:

${relatedTrips.map((trip, index) =>
  `${index + 1}. ${trip.originCity} → ${trip.destinationCity} - ₺${(trip.revenue || 0).toLocaleString('tr-TR')}`
).join('\n')}

TOPLAM TUTAR: ₺${invoice.amount.toLocaleString('tr-TR')}

Düzenleme Tarihi: ${new Date(invoice.issueDate).toLocaleDateString('tr-TR')}
Vade Tarihi: ${new Date(invoice.dueDate).toLocaleDateString('tr-TR')}

Saygılarımızla,
Naklos Filo Yönetimi
  `.trim();

  return `mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
