import { CalendarClock, Check, Pause, Play, SkipForward, Trash2, UserRound, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateStrip, toISODate } from '@/components/booking/date-strip';
import { Button } from '@/components/ui/button';
import { shortDate, type RecurringPlan } from '@/lib/plans';
import { endPlan, pausePlan, resumePlan, skipNextVisit, type PlanOverride } from '@/store/plans';
import { colors, radius, space, text } from '@/theme';
import { successHaptic } from '@/utils/haptics';

const daysAhead = 30;

const buildDays = (): Date[] => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: daysAhead }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
};

type Mode = 'menu' | 'pause' | 'end' | 'done';

type Props = {
  plan: RecurringPlan | null;
  override: PlanOverride;
  nextVisit?: string;
  visible: boolean;
  onClose: () => void;
  onChangeDayTime: () => void;
};

/** P17 actions: skip next visit, pause/resume, change day or time, request a cleaner, end plan. */
export function PlanSheet({ plan, override, nextVisit, visible, onClose, onChangeDayTime }: Props) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      {visible && plan ? (
        <PlanBody
          plan={plan}
          override={override}
          nextVisit={nextVisit}
          onClose={onClose}
          onChangeDayTime={onChangeDayTime}
        />
      ) : null}
    </Modal>
  );
}

function PlanBody({
  plan,
  override,
  nextVisit,
  onClose,
  onChangeDayTime,
}: Omit<Props, 'visible' | 'plan'> & { plan: RecurringPlan }) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('menu');
  const [notice, setNotice] = useState<string | null>(null);
  const [resumeISO, setResumeISO] = useState(() => nextVisit ?? toISODate(new Date()));
  const [days] = useState(buildDays);
  const paused = Boolean(override.pausedUntil);

  const finish = (message: string) => {
    successHaptic();
    setNotice(message);
    setMode('done');
  };

  const onSkip = () => {
    if (!nextVisit) return;
    skipNextVisit(plan.bookingId, nextVisit);
    finish(`The visit on ${shortDate(nextVisit)} is skipped. The plan continues after that.`);
  };

  const onPause = () => {
    pausePlan(plan.bookingId, resumeISO);
    finish(`Plan paused. Visits resume on ${shortDate(resumeISO)}.`);
  };

  const onResume = () => {
    resumePlan(plan.bookingId);
    finish('Plan resumed. Your next visit is back on the regular schedule.');
  };

  const onEnd = () => {
    endPlan(plan.bookingId);
    finish('Plan ended. Your booking history and receipts are unchanged.');
  };

  return (
    <View style={styles.backdrop}>
      <Pressable
        accessibilityLabel="Close plan actions"
        accessibilityRole="button"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space[4]) }]}>
        <View style={styles.handle} />

        {mode === 'done' ? (
          <View style={styles.success}>
            <View style={styles.successIcon}>
              <Check size={30} color={colors.surface} strokeWidth={3} />
            </View>
            <Text style={styles.title} maxFontSizeMultiplier={1.3}>
              Plan updated
            </Text>
            <Text style={styles.successBody} maxFontSizeMultiplier={1.3}>
              {notice}
            </Text>
            <Button label="Done" onPress={onClose} style={styles.fullWidth} />
          </View>
        ) : mode === 'pause' ? (
          <>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title} maxFontSizeMultiplier={1.3}>
                  {paused ? 'Change pause' : 'Pause plan'}
                </Text>
                <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
                  Choose the date visits should resume
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
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pauseContent}>
              <View style={styles.stripWrap}>
                <DateStrip days={days} selectedISO={resumeISO} onSelect={setResumeISO} />
              </View>
              <Text style={styles.helper} maxFontSizeMultiplier={1.3}>
                Nothing is charged while the plan is paused. You can resume earlier at any time.
              </Text>
            </ScrollView>
            <View style={styles.footer}>
              <Button label={`Resume on ${shortDate(resumeISO)}`} onPress={onPause} />
              <Button label="Back" variant="ghost" onPress={() => setMode('menu')} />
            </View>
          </>
        ) : mode === 'end' ? (
          <View style={styles.endPanel}>
            <View style={styles.endIcon}>
              <Trash2 size={24} color={colors.error} strokeWidth={2} />
            </View>
            <Text style={styles.title} maxFontSizeMultiplier={1.3}>
              End this plan?
            </Text>
            <Text style={styles.successBody} maxFontSizeMultiplier={1.3}>
              Future visits stop and the recurring discount ends. Past bookings, payments and
              receipts stay in your history.
            </Text>
            <Button label="End plan" variant="destructive" onPress={onEnd} style={styles.fullWidth} />
            <Button label="Keep plan" variant="ghost" onPress={() => setMode('menu')} />
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title} maxFontSizeMultiplier={1.3}>
                  Manage plan
                </Text>
                <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
                  {plan.serviceName} · {plan.bookingId}
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

            <View style={styles.summary}>
              <Text style={styles.summaryLabel} maxFontSizeMultiplier={1.2}>
                Next visit
              </Text>
              <Text style={styles.summaryValue} maxFontSizeMultiplier={1.3}>
                {paused
                  ? `Paused until ${shortDate(override.pausedUntil!)}`
                  : nextVisit
                    ? shortDate(nextVisit)
                    : 'No date set'}
              </Text>
            </View>

            <View style={styles.menu}>
              <ActionRow
                icon={SkipForward}
                label="Skip next visit"
                hint={nextVisit ? shortDate(nextVisit) : 'No upcoming visit'}
                disabled={!nextVisit}
                onPress={onSkip}
              />
              <ActionRow
                icon={paused ? Play : Pause}
                label={paused ? 'Resume plan' : 'Pause plan'}
                hint={paused ? 'Return to the regular schedule' : 'Choose a resume date'}
                onPress={() => {
                  if (paused) onResume();
                  else setMode('pause');
                }}
              />
              <ActionRow
                icon={CalendarClock}
                label="Change day or time"
                hint="Pick a new slot for the next visit"
                onPress={() => {
                  onClose();
                  onChangeDayTime();
                }}
              />
              <ActionRow
                icon={UserRound}
                label="Request a different cleaner"
                hint="We'll find the best available match"
                onPress={() =>
                  Alert.alert(
                    'Request a different cleaner',
                    'Cleaner assignment and requests will connect once the scheduling backend is available. Your plan keeps its current cleaner preference.',
                  )
                }
              />
              <ActionRow
                icon={Trash2}
                label="End plan"
                hint="Stop future visits"
                destructive
                onPress={() => setMode('end')}
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function ActionRow({
  icon: Icon,
  label,
  hint,
  onPress,
  disabled,
  destructive,
}: {
  icon: typeof SkipForward;
  label: string;
  hint: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${hint}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.actionRow}>
      <View style={[styles.actionIcon, destructive && styles.actionIconDanger]}>
        <Icon
          size={20}
          color={destructive ? colors.error : colors.green700}
          strokeWidth={2}
        />
      </View>
      <View style={styles.actionCopy}>
        <Text
          style={[styles.actionLabel, destructive && styles.actionLabelDanger, disabled && styles.disabled]}
          maxFontSizeMultiplier={1.3}>
          {label}
        </Text>
        <Text style={styles.actionHint} maxFontSizeMultiplier={1.2}>
          {hint}
        </Text>
      </View>
    </Pressable>
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
  summary: {
    marginTop: space[3],
    backgroundColor: colors.green50,
    borderRadius: radius.tile,
    padding: space[3],
    gap: 2,
  },
  summaryLabel: { ...text.caption, color: colors.green700 },
  summaryValue: { ...text.bodyM, color: colors.green900 },
  menu: { marginTop: space[2] },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.tile,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconDanger: { backgroundColor: colors.errorBg },
  actionCopy: { flex: 1, gap: 1 },
  actionLabel: { ...text.bodyM, color: colors.text },
  actionLabelDanger: { color: colors.error },
  actionHint: { ...text.caption, color: colors.textMuted },
  disabled: { color: colors.disabledText },
  pauseContent: { paddingTop: space[3], gap: space[3] },
  stripWrap: { marginHorizontal: -space[4] },
  helper: { ...text.caption, color: colors.textMuted },
  footer: { paddingTop: space[3], gap: space[1] },
  endPanel: { alignItems: 'center', gap: space[3], paddingVertical: space[4] },
  endIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  success: { alignItems: 'center', gap: space[3], paddingVertical: space[6] },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBody: { ...text.bodyM, color: colors.textMuted, textAlign: 'center' },
  fullWidth: { alignSelf: 'stretch' },
});
