import { router } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import { BackHandler } from 'react-native';

import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { deleteDraftMedia } from '@/lib/media';
import type { BookingDraftStep } from '@/lib/pricing';
import {
  draftIsDirty,
  getBookingDraft,
  resetDraft,
  saveDraftNow,
  setDraftStep,
  useBookingDraft,
} from '@/store/booking';

const SERVICES = '/(tabs)/services';
const HOME = '/(tabs)/home';

type Options = {
  step: BookingDraftStep;
  /** Set on screens that should not trip the guard while the draft is being cleared. */
  enabled?: boolean;
};

export type DraftExit = {
  /** Call from the X button, header back and any in-screen cancel. */
  requestExit: () => void;
  /** Render once, inside the screen. */
  sheet: ReactElement;
};

/**
 * One exit path for every order-flow step (Section 12.1): hardware back, header back and
 * X all share the "Save as draft?" drawer, and the drawer writes the draft before Home
 * reads it. Screens only call `requestExit()` and render `{sheet}`.
 */
export function useDraftExit({ step, enabled = true }: Options): DraftExit {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (enabled) setDraftStep(step);
  }, [enabled, step]);

  const save = useCallback(async () => {
    setOpen(false);
    await saveDraftNow();
    router.replace(HOME);
  }, []);

  const discard = useCallback(() => {
    setOpen(false);
    deleteDraftMedia();
    resetDraft();
    router.replace(SERVICES);
  }, []);

  const requestExit = useCallback(() => {
    const current = getBookingDraft();
    // No changes since the draft was created: leave quietly and keep nothing.
    if (!draftIsDirty(current)) {
      deleteDraftMedia();
      resetDraft();
      router.replace(SERVICES);
      return;
    }
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      requestExit();
      return true;
    });
    return () => subscription.remove();
  }, [enabled, requestExit]);

  const sheet = (
    <ConfirmSheet
      visible={open}
      title="Save as draft?"
      body="Your choices are kept so you can finish booking later."
      confirmLabel="Save draft"
      destructive={false}
      icon={FileText}
      extraLabel="Discard"
      onExtra={discard}
      cancelLabel="Keep editing"
      compact
      onConfirm={() => {
        void save();
      }}
      onClose={() => setOpen(false)}
    />
  );

  return { requestExit, sheet };
}

/**
 * If the draft for this slug is gone (after Discard, a deep link or a cold start), send the
 * customer to Services instead of rendering an empty screen.
 */
export function useDraftGuard(slug: string): boolean {
  const draft = useBookingDraft();

  useEffect(() => {
    if (!draft || draft.serviceSlug !== slug) router.replace(SERVICES);
  }, [draft, slug]);

  return Boolean(draft && draft.serviceSlug === slug);
}
