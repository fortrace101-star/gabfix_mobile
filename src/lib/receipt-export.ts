import { Directory, File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { receiptHtml } from '@/lib/receipt';
import type { SavedBooking } from '@/store/bookings';

/**
 * `Print.printToFileAsync` writes to the process-wide cache dir. In Expo Go that path is
 * outside the project's sandbox, so `expo-sharing` rejects it with "Not allowed to read
 * file under given URL." Copying the PDF into `Paths.cache` (the project-scoped cache
 * directory) gives the share sheet a URI it is allowed to read, and keeps the name stable.
 */
async function stageForSharing(uri: string, bookingId: string): Promise<string> {
  const directory = new Directory(Paths.cache, 'receipts');
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });

  const safeName = bookingId.replace(/[^a-zA-Z0-9-_]/g, '-');
  const destination = new File(directory, `${safeName}.pdf`);
  if (destination.exists) destination.delete();

  await new File(uri).copy(destination);
  return destination.uri;
}

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
    const shareableUri = await stageForSharing(uri, booking.id);
    await Sharing.shareAsync(shareableUri, {
      mimeType: 'application/pdf',
      dialogTitle: `Receipt ${booking.id}`,
      UTI: 'com.adobe.pdf',
    });
    return;
  }

  await Print.printAsync({ html });
}
