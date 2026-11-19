import { CreditCard, Smartphone, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SavedMobileMoney } from '@/config/payments';
import { colors, radius, space, text } from '@/theme';

type MethodKind = 'mtn' | 'airtel' | 'visa';

const kinds: { id: MethodKind; label: string; hint: string }[] = [
  { id: 'mtn', label: 'MTN Mobile Money', hint: 'Save a number for faster checkout' },
  { id: 'airtel', label: 'Airtel Money', hint: 'Save a number for faster checkout' },
  { id: 'visa', label: 'Visa card', hint: 'Save a card reference' },
];

const phoneDigits = (value: string): string =>
  value.replace(/\D/g, '').replace(/^256/, '').replace(/^0/, '').slice(0, 9);

const formatExpiry = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onAddMobileMoney: (provider: SavedMobileMoney['provider'], phone: string) => void;
  onAddCard: (last4: string, expiry: string) => void;
};

/** P27b “＋ Add method”. Card numbers are never collected; only a local reference. */
export function AddMethodSheet({ visible, onClose, onAddMobileMoney, onAddCard }: Props) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      {visible ? (
        <AddMethodBody
          onClose={onClose}
          onAddMobileMoney={onAddMobileMoney}
          onAddCard={onAddCard}
        />
      ) : null}
    </Modal>
  );
}

function AddMethodBody({ onClose, onAddMobileMoney, onAddCard }: Omit<Props, 'visible'>) {
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<MethodKind>('mtn');
  const [phone, setPhone] = useState('');
  const [last4, setLast4] = useState('');
  const [expiry, setExpiry] = useState('');
  const [touched, setTouched] = useState(false);

  const phoneValid = /^7\d{8}$/.test(phone);
  const last4Valid = /^\d{4}$/.test(last4);
  const expiryValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry);
  const valid =
    kind === 'visa' ? last4Valid && expiryValid : phoneValid;

  const save = () => {
    setTouched(true);
    if (!valid) return;
    if (kind === 'visa') onAddCard(last4, expiry);
    else onAddMobileMoney(kind === 'mtn' ? 'MTN' : 'Airtel', phone);
    onClose();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.backdrop}>
      <Pressable
        accessibilityLabel="Close add method"
        accessibilityRole="button"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space[4]) }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            Add method
          </Text>
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={styles.close}>
            <X size={22} color={colors.text} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.kinds}>
          {kinds.map((item) => {
            const selected = kind === item.id;
            const Icon = item.id === 'visa' ? CreditCard : Smartphone;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="radio"
                accessibilityLabel={item.label}
                accessibilityState={{ selected }}
                aria-checked={selected}
                onPress={() => {
                  setKind(item.id);
                  setTouched(false);
                }}
                style={[styles.kind, selected && styles.kindSelected]}>
                <Icon
                  size={18}
                  color={selected ? colors.green700 : colors.textMuted}
                  strokeWidth={2}
                />
                <Text
                  style={[styles.kindLabel, selected && styles.kindLabelSelected]}
                  maxFontSizeMultiplier={1.2}>
                  {item.id === 'visa' ? 'Visa' : item.id === 'mtn' ? 'MTN' : 'Airtel'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.hint} maxFontSizeMultiplier={1.2}>
          {kinds.find((item) => item.id === kind)?.hint}
        </Text>

        {kind === 'visa' ? (
          <View style={styles.cardFields}>
            <Input
              containerStyle={styles.flex}
              label="Last 4 digits"
              value={last4}
              onChangeText={(value) => setLast4(value.replace(/\D/g, '').slice(0, 4))}
              onBlur={() => setTouched(true)}
              placeholder="4242"
              keyboardType="number-pad"
              maxLength={4}
              error={touched && !last4Valid ? 'Enter the last 4 digits.' : undefined}
            />
            <Input
              containerStyle={styles.flex}
              label="Expiry"
              value={expiry}
              onChangeText={(value) => setExpiry(formatExpiry(value))}
              onBlur={() => setTouched(true)}
              placeholder="MM/YY"
              keyboardType="number-pad"
              maxLength={5}
              error={touched && !expiryValid ? 'Use MM/YY.' : undefined}
            />
          </View>
        ) : (
          <Input
            label="Mobile Money number"
            prefix="+256"
            value={phone}
            onChangeText={(value) => setPhone(phoneDigits(value))}
            onBlur={() => setTouched(true)}
            placeholder="772 123 456"
            keyboardType="phone-pad"
            error={
              touched && !phoneValid
                ? 'Enter the 9 digits after +256, for example 772 123 456.'
                : undefined
            }
          />
        )}

        {kind === 'visa' ? (
          <Text style={styles.helper} maxFontSizeMultiplier={1.2}>
            Full card details are entered on the secure hosted page. This demo only saves a local
            reference so the card appears at checkout.
          </Text>
        ) : null}

        <Button
          label={kind === 'visa' ? 'Add card' : `Add ${kind === 'mtn' ? 'MTN' : 'Airtel'} number`}
          onPress={save}
          disabled={touched && !valid}
          style={styles.save}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: {
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
  header: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  title: { ...text.h2, flex: 1 },
  close: { width: 48, height: 48, alignItems: 'flex-end', justifyContent: 'center' },
  kinds: { flexDirection: 'row', gap: space[2], marginTop: space[3] },
  kind: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[1],
  },
  kindSelected: { borderColor: colors.green500, backgroundColor: colors.green50 },
  kindLabel: { ...text.caption, color: colors.textMuted },
  kindLabelSelected: { color: colors.green700 },
  hint: { ...text.caption, color: colors.textMuted, marginTop: space[3] },
  cardFields: { flexDirection: 'row', gap: space[3], marginTop: space[3] },
  flex: { flex: 1 },
  helper: { ...text.caption, color: colors.textMuted, marginTop: space[2] },
  save: { marginTop: space[4] },
});
