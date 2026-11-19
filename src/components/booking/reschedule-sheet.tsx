import { Check, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateStrip, toISODate } from '@/components/booking/date-strip';
import { SlotChips, slotLabel } from '@/components/booking/slot-chips';
import { Button } from '@/components/ui/button';
import { useAvailability } from '@/hooks/use-availability';
import { isFreeChangeWindow } from '@/lib/booking-policy';
import { rescheduleBooking, type SavedBooking } from '@/store/bookings';
import { colors, font, radius, space, text } from '@/theme';
import { successHaptic } from '@/utils/haptics';

const daysAhead = 30;
const leadHours = 3;

const buildDays = (): Date[] => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: daysAhead }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
};

const parseISODate = (iso: string): Date => {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const defaultDateISO = (): string => {
  const now = new Date();
  if (now.getHours() * 60 + now.getMinutes() + leadHours * 60 > 16 * 60) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toISODate(tomorrow);
  }
  return toISODate(now);
};

const longDate = (iso: string): string =>
  parseISODate(iso).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

type Props = {
  booking: SavedBooking | null;
  visible: boolean;
  onClose: () => void;
};

/** P16 reschedule sheet: new date and time, deposit unchanged. */
export function RescheduleSheet({ booking, visible, onClose }: Props) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      {visible && booking ? <RescheduleBody booking={booking} onClose={onClose} /> : null}
    </Modal>
  );
}

function RescheduleBody({ booking, onClose }: { booking: SavedBooking; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [days] = useState(buildDays);
  const [selectedISO, setSelectedISO] = useState(() => booking.dateISO ?? defaultDateISO());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const { slots, loading } = useAvailability(booking.serviceSlug, selectedISO || null);

  const isToday = selectedISO === toISODate(new Date());
  const earliestToday = new Date().getTime() + leadHours * 60 * 60 * 1000;
  const visibleSlots = slots.filter((slot) => {
    if (!isToday) return true;
    const [hour, minute] = slot.time.split(':').map(Number);
    const start = new Date(parseISODate(selectedISO));
    start.setHours(hour, minute, 0, 0);
    return start.getTime() >= earliestToday;
  });

  const freeChange = isFreeChangeWindow(booking);
  const canConfirm = Boolean(selectedISO && selectedTime);

  const onConfirm = () => {
    if (!selectedISO || !selectedTime) return;
    rescheduleBooking(booking.id, { dateISO: selectedISO, startTime: selectedTime });
    successHaptic();
    setDone(true);
  };

  return (
    <View style={styles.backdrop}>
      <Pressable
        accessibilityLabel="Close reschedule"
        accessibilityRole="button"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space[4]) }]}>
        <View style={styles.handle} />

        {done && selectedTime ? (
          <View style={styles.success}>
            <View style={styles.successIcon}>
              <Check size={30} color={colors.surface} strokeWidth={3} />
            </View>
            <Text style={styles.title} maxFontSizeMultiplier={1.3}>
              Time updated
            </Text>
            <Text style={styles.successBody} maxFontSizeMultiplier={1.3}>
              Your booking is now {longDate(selectedISO)} at {slotLabel(selectedTime)}. Your deposit
              stays with the booking.
            </Text>
            <Button label="Done" onPress={onClose} style={styles.fullWidth} />
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title} maxFontSizeMultiplier={1.3}>
                  Reschedule
                </Text>
                <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
                  {booking.serviceName}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close"
                accessibilityRole="button"
                hitSlop={8}
                onPress={onClose}
                style={styles.close}>
                <X size={22} color={colors.text} strokeWidth={2} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}>
              <View style={[styles.policy, !freeChange && styles.policyWarn]}>
                <Text
                  style={[styles.policyText, !freeChange && styles.policyTextWarn]}
                  maxFontSizeMultiplier={1.3}>
                  {freeChange
                    ? 'Free change. You are more than 24 hours before the appointment, and your deposit stays with the booking.'
                    : "This is within 24 hours. We'll try to move it, but availability may be limited and operations may need to confirm the new time."}
                </Text>
              </View>

              <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
                Choose a new date
              </Text>
              <View style={styles.stripWrap}>
                <DateStrip days={days} selectedISO={selectedISO} onSelect={setSelectedISO} />
              </View>

              <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
                Available times
              </Text>
              {selectedISO ? (
                visibleSlots.length > 0 ? (
                  <SlotChips slots={visibleSlots} value={selectedTime} onSelect={setSelectedTime} />
                ) : (
                  <Text style={styles.empty} maxFontSizeMultiplier={1.3}>
                    {loading
                      ? 'Checking availability…'
                      : 'No times left on this date. Pick another day.'}
                  </Text>
                )
              ) : (
                <Text style={styles.empty} maxFontSizeMultiplier={1.3}>
                  Pick a date to see times.
                </Text>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <Button label="Confirm new time" disabled={!canConfirm} onPress={onConfirm} />
              <Button label="Keep current time" variant="ghost" onPress={onClose} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space[4],
    paddingTop: space[2],
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: space[3],
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  headerText: { flex: 1, gap: 2 },
  title: { ...text.h2 },
  subtitle: { ...text.caption },
  close: { width: 48, height: 48, alignItems: 'flex-end', justifyContent: 'center' },
  content: { paddingTop: space[3], paddingBottom: space[3], gap: space[3] },
  policy: {
    backgroundColor: colors.successBg,
    borderRadius: 16,
    padding: space[3],
  },
  policyWarn: { backgroundColor: colors.warningBg },
  policyText: { ...text.caption, color: colors.green700 },
  policyTextWarn: { color: colors.yellow800 },
  sectionTitle: { ...text.h3, color: colors.text },
  stripWrap: { marginHorizontal: -space[4] },
  empty: { ...text.bodyM, color: colors.textMuted },
  footer: { paddingTop: space[2], gap: space[1] },
  fullWidth: { alignSelf: 'stretch' },
  success: { alignItems: 'center', gap: space[3], paddingVertical: space[6] },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBody: {
    ...text.bodyM,
    color: colors.textMuted,
    textAlign: 'center',
    fontFamily: font.body,
  },
});
