import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { InlineBanner } from '@/components/ui/inline-banner';
import { Input } from '@/components/ui/input';
import { TopBar } from '@/components/ui/top-bar';
import { newId } from '@/lib/id';
import { addLoginEvent } from '@/store/login-activity';
import { addNotification } from '@/store/notifications';
import { markPasswordChanged } from '@/store/security';
import { colors, space, text } from '@/theme';
import { isStrongEnoughPassword, passwordStrength } from '@/utils/validation';

/** P29a Change password (mock/local). */
export default function ChangePasswordScreen() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [done, setDone] = useState(false);

  const strength = passwordStrength(next);
  const canSave = current.length > 0 && isStrongEnoughPassword(next) && next === confirm && next !== current;

  const onSave = async () => {
    const nextErrors: typeof errors = {};
    if (!current) nextErrors.current = 'Enter your current password.';
    if (!isStrongEnoughPassword(next)) nextErrors.next = 'Use at least 8 characters.';
    if (next && current && next === current) nextErrors.next = "Choose a password you haven't used here.";
    if (confirm !== next) nextErrors.confirm = "Passwords don't match.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (current === 'wrongpass') {
      setErrors({ current: "That password isn't right." });
      setSaving(false);
      return;
    }

    markPasswordChanged();
    addLoginEvent({
      id: newId(),
      type: 'password-changed',
      atISO: new Date().toISOString(),
      method: 'password',
      deviceName: 'This device',
    });
    addNotification({
      id: `security-password-${Date.now()}`,
      kind: 'security',
      title: 'Your password was changed',
      body: 'If this wasn’t you, review your devices and secure your account.',
      createdAtISO: new Date().toISOString(),
      href: '/profile/security',
    });
    setSaving(false);
    setDone(true);
  };

  if (done) {
    return (
      <View style={styles.screen}>
        <TopBar title="Change password" />
        <View style={styles.done}>
          <InlineBanner variant="success" message="Your password was updated." />
          <Button label="Back to Security" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <TopBar title="Change password" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro} maxFontSizeMultiplier={1.3}>
          Choose a strong password you don’t use elsewhere.
        </Text>
        <Input
          label="Current password"
          secure
          value={current}
          onChangeText={(value) => {
            setCurrent(value);
            if (errors.current) setErrors((e) => ({ ...e, current: undefined }));
          }}
          error={errors.current}
          textContentType="password"
          autoComplete="password"
        />
        <View style={styles.field}>
          <Input
            label="New password"
            secure
            value={next}
            onChangeText={(value) => {
              setNext(value);
              if (errors.next) setErrors((e) => ({ ...e, next: undefined }));
            }}
            error={errors.next}
            helper={`Strength: ${strength.label}`}
            textContentType="newPassword"
            autoComplete="new-password"
          />
        </View>
        <Input
          label="Confirm new password"
          secure
          value={confirm}
          onChangeText={(value) => {
            setConfirm(value);
            if (errors.confirm) setErrors((e) => ({ ...e, confirm: undefined }));
          }}
          onBlur={() => {
            if (confirm && confirm !== next) setErrors((e) => ({ ...e, confirm: "Passwords don't match." }));
          }}
          error={errors.confirm}
          textContentType="newPassword"
        />
        <Button label="Update password" onPress={() => void onSave()} loading={saving} disabled={!canSave} />
        <Text style={styles.note} maxFontSizeMultiplier={1.3}>
          Mock mode: use anything as your current password, except “wrongpass” to see the error state.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space[4], gap: space[4], paddingBottom: space[10] },
  intro: { ...text.bodyM, color: colors.textMuted },
  field: { gap: 4 },
  note: { ...text.caption, color: colors.textMuted },
  done: { padding: space[4], gap: space[4] },
});
