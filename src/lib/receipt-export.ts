import { Directory, File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { receiptHtml } from '@/lib/receipt';
import type { SavedBooking } from '@/store/bookings';

/** Every export is named after the booking so the file is identifiable after saving. */
export function receiptFileName(bookingId: string): string {
  const safeId = bookingId.replace(/[^a-zA-Z0-9-_]/g, '-');
  return `Gabfix-Receipt-${safeId}.pdf`;
}

/**
 * The web has no file system to write to, so the receipt opens in a print view and the
 * browser's "Save as PDF" produces the document (until a hosted invoice service exists).
 */
function printOnWeb(booking: SavedBooking): void {
  const printable = window.open('', '_blank');
  if (!printable) {
    throw new Error('Allow pop-ups to open the printable receipt, then choose Save as PDF.');
  }
  printable.document.open();
  printable.document.write(receiptHtml(booking));
  printable.document.close();
  printable.focus();
  printable.print();
}

/**
 * Renders the receipt to a PDF in the project-scoped cache directory.
 *
 * `Print.printToFileAsync` writes to the process-wide cache dir. In Expo Go that path is
 * outside the project's sandbox, so `expo-sharing` rejects it with "Not allowed to read
 * file under given URL." Copying the PDF into `Paths.cache` gives the share sheet a URI it
 * is allowed to read, and the file keeps a stable name.
 */
export async function createReceiptPdf(
  booking: SavedBooking,
): Promise<{ uri: string; fileName: string }> {
  const { uri } = await Print.printToFileAsync({ html: receiptHtml(booking), base64: false });

  const directory = new Directory(Paths.cache, 'receipts');
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });

  const fileName = receiptFileName(booking.id);
  const destination = new File(directory, fileName);
  if (destination.exists) destination.delete();

  await new File(uri).copy(destination);
  return { uri: destination.uri, fileName };
}

/**
 * Save action for the PDF. Native apps are sandboxed, so the named file is handed to the
 * share sheet (Save to Files on iOS, Downloads/Files on Android); web prints instead.
 */
export async function downloadReceiptPdf(
  booking: SavedBooking,
): Promise<{ fileName: string; uri?: string }> {
  if (Platform.OS === 'web') {
    printOnWeb(booking);
    return { fileName: receiptFileName(booking.id) };
  }

  const { uri, fileName } = await createReceiptPdf(booking);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: fileName,
      UTI: 'com.adobe.pdf',
    });
    return { fileName, uri };
  }

  await Print.printAsync({ html: receiptHtml(booking) });
  return { fileName };
}

/** P19 PDF share: same document, opened straight in the share sheet. */
export async function shareReceiptPdf(booking: SavedBooking): Promise<void> {
  if (Platform.OS === 'web') {
    printOnWeb(booking);
    return;
  }

  const { uri } = await createReceiptPdf(booking);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Receipt ${booking.id}`,
      UTI: 'com.adobe.pdf',
    });
    return;
  }

  await Print.printAsync({ html: receiptHtml(booking) });
}
