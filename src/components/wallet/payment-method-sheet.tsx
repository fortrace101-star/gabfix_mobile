import { Check, CreditCard, Smartphone } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import type { PaymentMethod } from '@/lib/pricing';
import { colors, radius, space, text } from '@/theme';
import { ugx } from '@/utils/format';

const methods: {
  id: Exclude<PaymentMethod, 'cash'>;
  label: string;
  hint: string;
  icon: typeof Smartphone;
}[] = [
  {
    id: 'mtn_momo',
    label: 'MTN Mobile Money',
    hint: 'Approve the prompt on your phone',
    icon: Smartphone,
  },
  {
    id: 'airtel_money',
    label: 'Airtel Money',
    hint: 'Approve the prompt on your phone',
    icon: Smartphone,
  },
  {
    id: 'visa_card',
    label: 'Visa card',
    hint: 'Secure hosted card page',
    icon: CreditCard,
  },
];

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  amount: number;
  onClose: () => void;
  onPay: (method: Exclude<PaymentMethod, 'cash'>) => void;
};

/** P27b digital payment picker. Cash is never offered here. */
export function PaymentMethodSheet({ visible, title, subtitle, amount, onClose, onPay }: Props) {
  const [method, setMethod] = useState<Exclude<PaymentMethod, 'cash'>>('mtn_momo');

  const close = () => {
    setMethod('mtn_momo');
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onDismiss={close}
      title={title}
      subtitle={subtitle}
      contentContainerStyle={styles.content}
      footer={
        <>
          <Button label={`Pay ${ugx(amount)}`} onPress={() => onPay(method)} />
          <Text style={styles.note} maxFontSizeMultiplier={1.2}>
            This local demo confirms the payment immediately. No money moves.
          </Text>
        </>
      }>
      <View style={styles.amountRow}>
        <Text style={styles.amountLabel} maxFontSizeMultiplier={1.2}>
          Amount
        </Text>
        <Text style={styles.amount} maxFontSizeMultiplier={1.2}>
          {ugx(amount)}
        </Text>
      </View>

      <View accessibilityRole="radiogroup" style={styles.methods}>
        {methods.map((item) => {
          const Icon = item.icon;
          const selected = method === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="radio"
              accessibilityLabel={`${item.label}. ${item.hint}`}
              accessibilityState={{ selected }}
              aria-checked={selected}
              onPress={() => setMethod(item.id)}
              style={[styles.method, selected && styles.methodSelected]}>
              <View style={styles.methodIcon}>
                <Icon size={22} color={colors.green700} strokeWidth={2} />
              </View>
              <View style={styles.methodCopy}>
                <Text style={styles.methodLabel} maxFontSizeMultiplier={1.3}>
                  {item.label}
                </Text>
                <Text style={styles.methodHint} maxFontSizeMultiplier={1.2}>
                  {item.hint}
                </Text>
              </View>
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? <Check size={14} color={colors.surface} strokeWidth={3} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space[4], gap: space[3] },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space[3],
    paddingHorizontal: space[3],
    borderRadius: radius.tile,
    backgroundColor: colors.green50,
  },
  amountLabel: { ...text.caption, color: colors.green700 },
  amount: { ...text.bodyM, color: colors.green900 },
  methods: { gap: space[2] },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: 64,
    padding: space[3],
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  methodSelected: { borderColor: colors.green500, backgroundColor: colors.green50 },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.tile,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodCopy: { flex: 1, gap: 1 },
  methodLabel: { ...text.bodyM, color: colors.text },
  methodHint: { ...text.caption, color: colors.textMuted },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.green500, backgroundColor: colors.green500 },
  note: { ...text.caption, color: colors.textMuted, textAlign: 'center', marginTop: space[2] },
});
