import { router, type Href } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CreditCard,
  ChevronRight,
  Plus,
  ReceiptText,
  Smartphone,
  Trash2,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { AddMethodSheet } from '@/components/wallet/add-method-sheet';
import { PaymentMethodSheet } from '@/components/wallet/payment-method-sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChip } from '@/components/ui/filter-chip';
import { Skeleton } from '@/components/ui/skeleton';
import { TopBar } from '@/components/ui/top-bar';
import { savedCardLabel, type SavedCard, type SavedMobileMoney } from '@/config/payments';
import { paymentMethodLabel } from '@/lib/booking-policy';
import {
  accountBalanceBookings,
  balanceDueBookings,
  filterTransactions,
  totalAccountBalance,
  totalBalanceDue,
  transactionFilters,
  walletTransactions,
  type TransactionFilter,
  type WalletTransaction,
} from '@/lib/wallet';
import type { PaymentMethod } from '@/lib/pricing';
import {
  payBookingBalance,
  settleLateFees,
  useBookings,
  useBookingsHydrated,
  type SavedBooking,
} from '@/store/bookings';
import {
  addCard,
  addMobileMoney,
  removePaymentMethod,
  usePaymentMethodsHydrated,
  useSavedCards,
  useSavedMobileMoney,
} from '@/store/payment-methods';
import { colors, font, radius, shadow, space, text } from '@/theme';
import { ugx } from '@/utils/format';
import { successHaptic } from '@/utils/haptics';

const maskPhone = (digits: string): string => {
  const clean = digits.replace(/\D/g, '');
  if (clean.length < 9) return `+256 ${clean}`;
  return `+256 ${clean.slice(0, 3)} ••• ${clean.slice(6)}`;
};

const dateTimeLabel = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const methodCaption = (method?: string): string =>
  method ? paymentMethodLabel(method) : 'Payment method';

type PayAction =
  | { kind: 'booking'; booking: SavedBooking }
  | { kind: 'account'; amount: number; bookingIds: string[] };


function MethodRow({
  icon,
  title,
  caption,
  onRemove,
}: {
  icon: LucideIcon;
  title: string;
  caption: string;
  onRemove: () => void;
}) {
  const Icon = icon;
  return (
    <View style={styles.methodRow}>
      <View style={styles.methodIconTile}>
        <Icon size={20} color={colors.green700} strokeWidth={2} />
      </View>
      <View style={styles.methodCopy}>
        <Text style={styles.methodTitle} maxFontSizeMultiplier={1.3}>
          {title}
        </Text>
        <Text style={styles.methodCaption} maxFontSizeMultiplier={1.2}>
          {caption}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ${title}`}
        hitSlop={8}
        onPress={onRemove}
        style={styles.removeButton}>
        <Trash2 size={16} color={colors.error} strokeWidth={2} />
        <Text style={styles.removeText} maxFontSizeMultiplier={1.2}>
          Remove
        </Text>
      </Pressable>
    </View>
  );
}

function TxIcon({ tx }: { tx: WalletTransaction }) {
  let Icon: LucideIcon = CreditCard;
  let bg: string = colors.green50;
  let fg: string = colors.green700;

  if (tx.kind === 'refund') {
    Icon = ArrowDownLeft;
    bg = colors.successBg;
    fg = colors.success;
  } else if (tx.kind === 'cash') {
    Icon = Banknote;
    bg = colors.yellow50;
    fg = colors.yellow800;
  } else if (tx.kind === 'deposit') {
    Icon = ArrowUpRight;
    bg = colors.infoBg;
    fg = colors.info;
  } else {
    Icon = Wallet;
    bg = colors.green50;
    fg = colors.green700;
  }

  return (
    <View style={[styles.txIcon, { backgroundColor: bg }]}>
      <Icon size={20} color={fg} strokeWidth={2} />
    </View>
  );
}

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const caption = tx.cashConfirmed
    ? 'Cash · confirmed by cleaner'
    : `${dateTimeLabel(tx.atISO)} · ${methodCaption(tx.method)}`;
  const amountLabel = tx.direction === 'in' ? `+${ugx(tx.amount)}` : ugx(tx.amount);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${tx.title}. ${caption}. ${amountLabel}. Open receipt`}
      onPress={() => router.push(`/booking/${tx.bookingId}/receipt` as Href)}
      style={styles.txRow}>
      <TxIcon tx={tx} />
      <View style={styles.txBody}>
        <Text style={styles.txTitle} maxFontSizeMultiplier={1.3} numberOfLines={1}>
          {tx.title}
        </Text>
        <Text style={styles.txCaption} maxFontSizeMultiplier={1.2} numberOfLines={1}>
          {caption}
        </Text>
      </View>
      <Text
        style={[styles.txAmount, tx.direction === 'in' && styles.txAmountIn]}
        maxFontSizeMultiplier={1.2}>
        {amountLabel}
      </Text>
    </Pressable>
  );
}

function LoadingState() {
  return (
    <View style={styles.loading}>
      <Skeleton style={styles.skeletonCard} />
      <Skeleton style={styles.skeletonList} />
      <Skeleton style={styles.skeletonList} />
    </View>
  );
}

/** P27b Payments and wallet. All data is derived from local booking records. */
export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const bookings = useBookings();
  const bookingsHydrated = useBookingsHydrated();
  const methodsHydrated = usePaymentMethodsHydrated();
  const cards = useSavedCards();
  const mobileMoney = useSavedMobileMoney();

  const [filter, setFilter] = useState<TransactionFilter>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [payAction, setPayAction] = useState<PayAction | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; label: string } | null>(null);

  const dueBookings = useMemo(() => balanceDueBookings(bookings), [bookings]);
  const dueTotal = useMemo(() => totalBalanceDue(bookings), [bookings]);
  const owedBookings = useMemo(() => accountBalanceBookings(bookings), [bookings]);
  const owedTotal = useMemo(() => totalAccountBalance(bookings), [bookings]);
  const transactions = useMemo(() => walletTransactions(bookings), [bookings]);
  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filter),
    [transactions, filter],
  );

  const hydrated = bookingsHydrated && methodsHydrated;

  const confirmRemove = (id: string, label: string) => {
    setRemoveTarget({ id, label });
  };

  const onPay = (method: Exclude<PaymentMethod, 'cash'>) => {
    if (!payAction) return;
    if (payAction.kind === 'booking') {
      payBookingBalance(payAction.booking.id, method);
    } else {
      settleLateFees(payAction.bookingIds, method);
    }
    successHaptic();
    setPayAction(null);
  };

  const paySheetTitle = payAction?.kind === 'booking' ? 'Pay balance' : 'Pay account balance';
  const paySheetSubtitle =
    payAction?.kind === 'booking'
      ? `${payAction.booking.serviceName} · ${payAction.booking.id}`
      : owedBookings.length > 1
        ? `${owedBookings.length} late fees`
        : 'Cash late fee';
  const paySheetAmount =
    payAction?.kind === 'booking' ? payAction.booking.balance : (payAction?.amount ?? 0);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar title="Payments and wallet" />
      {!hydrated ? (
        <LoadingState />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space[6] }]}>
          {dueBookings.length > 0 ? (
            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <View style={styles.balanceHeaderCopy}>
                  <Text style={styles.balanceKicker} maxFontSizeMultiplier={1.2}>
                    Balance due
                  </Text>
                  <Text style={styles.balanceAmount} maxFontSizeMultiplier={1.2}>
                    {ugx(dueTotal)}
                  </Text>
                </View>
                <View style={styles.balanceIcon}>
                  <ReceiptText size={22} color={colors.warning} strokeWidth={2} />
                </View>
              </View>
              <Text style={styles.balanceBody} maxFontSizeMultiplier={1.3}>
                Settle the amount left after your deposits. Cash is never collected in the app.
              </Text>
              <View style={styles.dueList}>
                {dueBookings.map((booking) => (
                  <View key={booking.id} style={styles.dueRow}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Open receipt for ${booking.serviceName}`}
                      onPress={() => router.push(`/booking/${booking.id}/receipt` as Href)}
                      style={styles.dueCopy}>
                      <Text style={styles.dueTitle} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                        {booking.serviceName}
                      </Text>
                      <Text style={styles.dueMeta} maxFontSizeMultiplier={1.2} numberOfLines={1}>
                        {booking.id} · {ugx(booking.balance)} due
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Pay ${ugx(booking.balance)} for ${booking.serviceName}`}
                      onPress={() => setPayAction({ kind: 'booking', booking })}
                      style={styles.payChip}>
                      <Text style={styles.payChipText} maxFontSizeMultiplier={1.2}>
                        Pay
                      </Text>
                      <ChevronRight size={14} color={colors.green700} strokeWidth={2} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
              Methods
            </Text>
            <View style={styles.methodsCard}>
              {cards.length === 0 && mobileMoney.length === 0 ? (
                <View style={styles.emptyMethods}>
                  <Text style={styles.emptyMethodsText} maxFontSizeMultiplier={1.3}>
                    No saved methods yet. Add a card or Mobile Money number for faster checkout.
                  </Text>
                </View>
              ) : null}

              {cards.map((card: SavedCard) => (
                <MethodRow
                  key={card.id}
                  icon={CreditCard}
                  title={savedCardLabel(card)}
                  caption={`Expires ${card.expiry}`}
                  onRemove={() => confirmRemove(card.id, savedCardLabel(card))}
                />
              ))}

              {mobileMoney.map((method: SavedMobileMoney) => (
                <MethodRow
                  key={method.id}
                  icon={Smartphone}
                  title={`${method.provider} Mobile Money`}
                  caption={maskPhone(method.phone)}
                  onRemove={() =>
                    confirmRemove(method.id, `${method.provider} ${maskPhone(method.phone)}`)
                  }
                />
              ))}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add payment method"
                onPress={() => setAddOpen(true)}
                style={styles.addRow}>
                <View style={styles.addIcon}>
                  <Plus size={18} color={colors.green700} strokeWidth={2.5} />
                </View>
                <Text style={styles.addText} maxFontSizeMultiplier={1.3}>
                  Add method
                </Text>
              </Pressable>
            </View>
            <Text style={styles.cashCaption} maxFontSizeMultiplier={1.2}>
              Cash is paid to your cleaner after the service.
            </Text>
          </View>

          {owedTotal > 0 ? (
            <View style={styles.accountCard}>
              <View style={styles.balanceHeader}>
                <View style={styles.balanceHeaderCopy}>
                  <Text style={styles.accountKicker} maxFontSizeMultiplier={1.2}>
                    Account balance
                  </Text>
                  <Text style={styles.accountAmount} maxFontSizeMultiplier={1.2}>
                    {ugx(owedTotal)}
                  </Text>
                </View>
                <View style={styles.accountIcon}>
                  <Wallet size={22} color={colors.error} strokeWidth={2} />
                </View>
              </View>
              <Text style={styles.accountBody} maxFontSizeMultiplier={1.3}>
                Cash late fees charged to your account. New bookings are blocked until it is cleared.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Pay account balance of ${ugx(owedTotal)}`}
                onPress={() =>
                  setPayAction({
                    kind: 'account',
                    amount: owedTotal,
                    bookingIds: owedBookings.map((booking) => booking.id),
                  })
                }
                style={styles.payNowButton}>
                <Text style={styles.payNowText} maxFontSizeMultiplier={1.2}>
                  Pay now
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
              Transactions
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}>
              {transactionFilters.map((item) => (
                <FilterChip
                  key={item.id}
                  label={item.label}
                  selected={filter === item.id}
                  onPress={() => setFilter(item.id)}
                />
              ))}
            </ScrollView>

            {transactions.length === 0 ? (
              <View style={styles.emptyTxWrap}>
                <EmptyState
                  icon={ReceiptText}
                  title="No transactions yet"
                  body="Deposits, balances, cash payments and refunds will appear here after you book a service."
                />
              </View>
            ) : filteredTransactions.length === 0 ? (
              <View style={styles.emptyFilter}>
                <Text style={styles.emptyFilterText} maxFontSizeMultiplier={1.3}>
                  No transactions in this filter.
                </Text>
              </View>
            ) : (
              <View style={styles.txList}>
                {filteredTransactions.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <AddMethodSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onAddMobileMoney={(provider, phone) => addMobileMoney(provider, phone)}
        onAddCard={(last4, expiry) => addCard(last4, expiry)}
      />
      <PaymentMethodSheet
        visible={payAction !== null}
        title={paySheetTitle}
        subtitle={paySheetSubtitle}
        amount={paySheetAmount}
        onClose={() => setPayAction(null)}
        onPay={onPay}
      />
      <Modal
        animationType="slide"
        onRequestClose={() => setRemoveTarget(null)}
        transparent
        visible={removeTarget !== null}>
        {removeTarget ? (
          <View style={styles.confirmBackdrop}>
            <Pressable
              accessibilityLabel="Close remove method"
              accessibilityRole="button"
              onPress={() => setRemoveTarget(null)}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.confirmSheet, { paddingBottom: insets.bottom + space[4] }]}>
              <View style={styles.confirmIcon}>
                <Trash2 size={24} color={colors.error} strokeWidth={2} />
              </View>
              <Text style={styles.confirmTitle} maxFontSizeMultiplier={1.3}>
                Remove this method?
              </Text>
              <Text style={styles.confirmBody} maxFontSizeMultiplier={1.3}>
                {removeTarget.label} will no longer appear at checkout on this device.
              </Text>
              <Button
                label="Remove method"
                variant="destructive"
                onPress={() => {
                  removePaymentMethod(removeTarget.id);
                  setRemoveTarget(null);
                }}
                style={styles.fullWidth}
              />
              <Button
                label="Keep method"
                variant="ghost"
                onPress={() => setRemoveTarget(null)}
              />
            </View>
          </View>
        ) : null}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space[4], paddingTop: space[3], gap: space[5] },
  loading: { padding: space[4], gap: space[3] },
  skeletonCard: { height: 160, borderRadius: radius.card },
  skeletonList: { height: 72, borderRadius: radius.card },
  balanceCard: {
    borderRadius: radius.card,
    backgroundColor: colors.warningBg,
    padding: space[4],
    gap: space[3],
    ...shadow.card,
  },
  balanceHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  balanceHeaderCopy: { flex: 1, gap: 2 },
  balanceKicker: {
    ...text.caption,
    color: colors.yellow800,
    fontFamily: font.bodySemi,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  balanceAmount: { fontFamily: font.poppinsBold, fontSize: 28, lineHeight: 34, color: colors.text },
  balanceIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.tile,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceBody: { ...text.caption, color: colors.text },
  dueList: { gap: space[2] },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingTop: space[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(138,109,0,0.18)',
  },
  dueCopy: { flex: 1, gap: 1 },
  dueTitle: { ...text.bodyM, fontFamily: font.bodySemi },
  dueMeta: { ...text.caption, color: colors.textMuted },
  payChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 36,
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  payChipText: { ...text.caption, fontFamily: font.bodySemi, color: colors.green700 },
  accountCard: {
    borderRadius: radius.card,
    backgroundColor: colors.errorBg,
    padding: space[4],
    gap: space[3],
  },
  accountKicker: {
    ...text.caption,
    color: colors.error,
    fontFamily: font.bodySemi,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  accountAmount: { fontFamily: font.poppinsBold, fontSize: 28, lineHeight: 34, color: colors.error },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.tile,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountBody: { ...text.caption, color: colors.text },
  payNowButton: {
    alignSelf: 'flex-start',
    height: 44,
    paddingHorizontal: space[4],
    borderRadius: radius.button,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payNowText: { ...text.button, color: colors.surface },
  section: { gap: space[2] },
  sectionTitle: { ...text.h3 },
  methodsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[2],
    gap: space[1],
    ...shadow.card,
  },
  emptyMethods: { padding: space[3] },
  emptyMethodsText: { ...text.caption, color: colors.textMuted },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: 64,
    paddingHorizontal: space[2],
  },
  methodIconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.tile,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodCopy: { flex: 1, gap: 1 },
  methodTitle: { ...text.bodyM, fontFamily: font.bodySemi },
  methodCaption: { ...text.caption, color: colors.textMuted },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: space[1],
  },
  removeText: { ...text.caption, color: colors.error, fontFamily: font.bodySemi },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: 56,
    paddingHorizontal: space[2],
    marginTop: space[1],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  addIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { ...text.bodyM, color: colors.green700, fontFamily: font.bodySemi },
  cashCaption: { ...text.caption, color: colors.textMuted },
  filters: { gap: space[2], paddingVertical: space[1] },
  txList: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadow.card,
  },
  txRow: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txBody: { flex: 1, gap: 1 },
  txTitle: { ...text.bodyM, fontFamily: font.bodySemi },
  txCaption: { ...text.caption, color: colors.textMuted },
  txAmount: {
    ...text.bodyM,
    fontFamily: font.bodySemi,
    fontVariant: ['tabular-nums'],
    color: colors.text,
  },
  txAmountIn: { color: colors.success },
  emptyTxWrap: { marginTop: space[2] },
  emptyFilter: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[4],
    alignItems: 'center',
    ...shadow.card,
  },
  emptyFilterText: { ...text.caption, color: colors.textMuted },
  confirmBackdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  confirmSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space[4],
    paddingTop: space[6],
    alignItems: 'center',
    gap: space[3],
  },
  confirmIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: { ...text.h3, textAlign: 'center' },
  confirmBody: { ...text.bodyM, color: colors.textMuted, textAlign: 'center' },
  fullWidth: { alignSelf: 'stretch' },
});
