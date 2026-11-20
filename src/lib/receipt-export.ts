import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { receiptHtml } from '@/lib/receipt';
import type { SavedBooking } from '@/store/bookings';

/**
 * P19 PDF export. Native builds render the receipt to a PDF and hand it to the share
 * sheet (Save to Files, Mail, WhatsApp); web opens the same document in a print view
 * so the browser's "Save as PDF" can be used until a hosted invoice service exists.
 */
export async function shareReceiptPdf(booking: SavedBooking): Promise<void> {
  const html = receiptHtml(booking);

  if (Platform.OS === 'web') {
    const printable = window.open('', '_blank');
    if (!printable) {
      throw new Error('Allow pop-ups to open the printable receipt, then choose Save as PDF.');
    }
    printable.document.open();
    printable.document.write(html);
    printable.document.close();
    printable.focus();
    printable.print();
    return;
  }

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Receipt ${booking.id}`,
      UTI: 'com.adobe.pdf',
    });
    return;
  }

  await Print.printAsync({ html });
}
