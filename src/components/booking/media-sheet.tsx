import * as Linking from 'expo-linking';
import { Camera, Images, Video, X } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';

import { PermissionCard } from '@/components/ui/permission-card';
import { jobMedia } from '@/config/media';
import { pickJobMedia, type MediaPickSource } from '@/lib/media';
import type { BookingMediaItem } from '@/lib/pricing';
import { colors, font, radius, space, text } from '@/theme';

import { MediaTile } from './media-tile';

type Props = {
  visible: boolean;
  items: BookingMediaItem[];
  onClose: () => void;
  onChange: (items: BookingMediaItem[]) => void;
  onRemove: (id: string) => void;
  onPreview: (item: BookingMediaItem) => void;
};

type ViewName = 'list' | 'picker';

/** P8b “Photos and video” sheet: added list plus the two-view add picker (3.7). */
export function MediaSheet({ visible, items, onClose, onChange, onRemove, onPreview }: Props) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [view, setView] = useState<ViewName>('list');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<'camera' | 'library' | null>(null);

  const videos = items.filter((item) => item.kind === 'video').length;
  const remaining = Math.max(0, jobMedia.maxItems - items.length);
  const videosRemaining = Math.max(0, jobMedia.maxVideos - videos);
  const limitReached = remaining === 0;

  useEffect(() => {
    if (visible) return;
    // Reset picker view when the sheet closes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView('list');
    setBusy(false);
    setError(null);
    setBlocked(null);
  }, [visible]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(timer);
  }, [error]);

  const add = async (source: MediaPickSource) => {
    if (busy) return;
    setError(null);
    setProgress('');
    setBusy(true);
    const result = await pickJobMedia({
      source,
      remaining,
      videosRemaining,
      existingAssetIds: items.map((item) => item.assetId).filter((id): id is string => Boolean(id)),
      onProgress: (done, total) => setProgress(`Adding ${done} of ${total}…`),
    });
    setBusy(false);
    setProgress('');
    if (result.permission === 'blocked') {
      setBlocked(source === 'library' ? 'library' : 'camera');
      return;
    }
    if (result.permission === 'denied') {
      setError(
        source === 'library'
          ? 'Allow photo access to add pictures, or use your camera instead.'
          : 'Allow camera access to take a photo, or choose from your library instead.',
      );
      return;
    }
    if (result.errors.length > 0) setError(result.errors[0]);
    if (result.items.length > 0) {
      onChange([...items, ...result.items]);
      setBlocked(null);
      setView('list');
    }
  };

  const close = () => {
    if (busy) return;
    onClose();
  };

  return (
    <>
      <Modal
        animationType={reducedMotion ? 'none' : 'slide'}
        transparent
        visible={visible}
        onRequestClose={() => (view === 'picker' ? setView('list') : close())}
        statusBarTranslucent>
        <View style={styles.backdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            disabled={busy}
            onPress={close}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space[4]) }]}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.title} maxFontSizeMultiplier={1.3}>
                {view === 'list' ? 'Photos and video' : 'Add photos or video'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                disabled={busy}
                hitSlop={8}
                onPress={close}
                style={styles.close}>
                <X size={22} color={colors.text} strokeWidth={2} />
              </Pressable>
            </View>

            {error ? (
              <View style={styles.error} accessibilityRole="alert">
                <Text style={styles.errorText} maxFontSizeMultiplier={1.3}>
                  {error}
                </Text>
              </View>
            ) : null}

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled">
              {view === 'list' ? (
                <>
                  <View style={styles.sectionHead}>
                    <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
                      Add media
                    </Text>
                    <Text style={styles.caption} maxFontSizeMultiplier={1.3}>
                      Up to {jobMedia.maxItems} items · Only {jobMedia.maxVideos} videos
                    </Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Add photos or video, ${remaining} left`}
                    disabled={busy || limitReached}
                    onPress={() => setView('picker')}
                    style={[styles.addRow, (busy || limitReached) && styles.disabled]}>
                    <View style={styles.addIcon}>
                      <Text style={styles.plus} maxFontSizeMultiplier={1.2}>
                        ＋
                      </Text>
                    </View>
                    <Text style={styles.addLabel} maxFontSizeMultiplier={1.3}>
                      Add photos or video
                    </Text>
                    <View style={styles.countPill}>
                      <Text style={styles.countText} maxFontSizeMultiplier={1.2}>
                        {remaining} left
                      </Text>
                    </View>
                  </Pressable>

                  {limitReached ? (
                    <Text style={styles.note} maxFontSizeMultiplier={1.3}>
                      You&apos;ve reached {jobMedia.maxItems} items. Remove one to add more.
                    </Text>
                  ) : null}

                  <View style={styles.sectionHead}>
                    <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.3}>
                      Added
                    </Text>
                    <Text style={styles.caption} maxFontSizeMultiplier={1.2}>
                      {items.length}
                      {videos > 0 ? ` · ${videos} video${videos === 1 ? '' : 's'}` : ''}
                    </Text>
                  </View>

                  {items.length > 0 ? (
                    <View style={styles.grid}>
                      {items.map((item, index) => (
                        <MediaTile
                          key={item.id}
                          item={item}
                          index={index}
                          total={items.length}
                          onPress={() => onPreview(item)}
                          onRemove={() => onRemove(item.id)}
                        />
                      ))}
                    </View>
                  ) : (
                    <View style={styles.empty}>
                      <Text style={styles.emptyTitle} maxFontSizeMultiplier={1.3}>
                        No media added yet
                      </Text>
                      <Text style={styles.note} maxFontSizeMultiplier={1.3}>
                        Add photos of rooms or a short video walkthrough.
                      </Text>
                    </View>
                  )}

                  <Text style={styles.footer} maxFontSizeMultiplier={1.3}>
                    Uploads start after your booking is saved.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={close}
                    style={[styles.primary, busy && styles.disabled]}>
                    <Text style={styles.primaryText} maxFontSizeMultiplier={1.2}>
                      Done
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <View style={styles.infoChip}>
                    <Text style={styles.infoText} maxFontSizeMultiplier={1.3}>
                      Videos: max {jobMedia.maxVideos} · {jobMedia.videoMaxSeconds} s · 25 MB
                    </Text>
                  </View>

                  {busy ? (
                    <View style={styles.busyRow} accessibilityRole="progressbar">
                      <ActivityIndicator color={colors.green500} />
                      <Text style={styles.busyText} maxFontSizeMultiplier={1.3}>
                        {progress || 'Adding your media…'}
                      </Text>
                    </View>
                  ) : null}

                  {blocked === 'camera' ? (
                    <PermissionCard
                      icon={Camera}
                      title="Camera access is off"
                      body="Allow camera access in Settings to take photos, or choose from your library instead."
                      onOpenSettings={() => void Linking.openSettings()}
                    />
                  ) : null}
                  {blocked === 'library' ? (
                    <PermissionCard
                      icon={Images}
                      title="Photo access is off"
                      body="Allow photo access in Settings to choose pictures and videos of the space."
                      onOpenSettings={() => void Linking.openSettings()}
                    />
                  ) : null}

                  <View style={styles.rowCard}>
                    {Platform.OS !== 'web' ? (
                      <>
                        <PickerRow
                          icon={<Camera size={20} color={colors.green700} strokeWidth={2} />}
                          title="Take photo"
                          caption="Capture a clear image"
                          disabled={busy || limitReached || blocked === 'camera'}
                          onPress={() => void add('camera')}
                        />
                        <View style={styles.divider} />
                        <PickerRow
                          icon={<Video size={20} color={colors.green700} strokeWidth={2} />}
                          title="Record video"
                          caption={
                            videosRemaining === 0
                              ? `${jobMedia.maxVideos} of ${jobMedia.maxVideos} videos added`
                              : `Max ${jobMedia.videoMaxSeconds} s · 25 MB`
                          }
                          trailing={`${videos}/${jobMedia.maxVideos}`}
                          disabled={busy || limitReached || videosRemaining === 0 || blocked === 'camera'}
                          onPress={() => void add('video')}
                        />
                        <View style={styles.divider} />
                      </>
                    ) : null}
                    <PickerRow
                      icon={<Images size={20} color={colors.green700} strokeWidth={2} />}
                      title="Choose from library"
                      caption="Select photos or video"
                      disabled={busy || limitReached || blocked === 'library'}
                      onPress={() => void add('library')}
                    />
                  </View>

                  <Text style={styles.footer} maxFontSizeMultiplier={1.3}>
                    Videos are limited to {jobMedia.videoMaxSeconds} s and 25 MB to keep uploads fast.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() => setView('list')}
                    style={[styles.secondary, busy && styles.disabled]}>
                    <Text style={styles.secondaryText} maxFontSizeMultiplier={1.2}>
                      Close
                    </Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function PickerRow({
  icon,
  title,
  caption,
  trailing,
  disabled,
  onPress,
}: {
  icon: ReactNode;
  title: string;
  caption: string;
  trailing?: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${caption}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.pickerRow, disabled && styles.rowDisabled]}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} maxFontSizeMultiplier={1.3}>
          {title}
        </Text>
        <Text style={styles.caption} maxFontSizeMultiplier={1.3}>
          {caption}
        </Text>
      </View>
      {trailing ? (
        <Text style={styles.trailing} maxFontSizeMultiplier={1.2}>
          {trailing}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '85%',
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
  title: { ...text.h3, flex: 1 },
  close: { width: 48, height: 48, alignItems: 'flex-end', justifyContent: 'center' },
  error: {
    backgroundColor: colors.errorBg,
    borderRadius: radius.input,
    padding: space[3],
    marginTop: space[2],
  },
  errorText: { ...text.caption, color: colors.error, lineHeight: 18 },
  content: { paddingTop: space[3], paddingBottom: space[2], gap: space[3] },
  sectionHead: { gap: 1 },
  sectionTitle: { ...text.bodyM, fontFamily: font.bodySemi },
  caption: { ...text.caption, color: colors.textMuted },
  addRow: {
    minHeight: 56,
    borderRadius: radius.input,
    backgroundColor: colors.green50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[3],
  },
  addIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  plus: { fontFamily: font.bodySemi, fontSize: 20, color: colors.green700, lineHeight: 24 },
  addLabel: { ...text.bodyM, fontFamily: font.bodySemi, color: colors.green700, flex: 1 },
  countPill: {
    height: 24,
    paddingHorizontal: space[2] + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  countText: { ...text.caption, color: colors.green700, fontSize: 11 },
  disabled: { opacity: 0.55 },
  note: { ...text.caption, color: colors.textMuted, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  empty: {
    padding: space[4],
    borderRadius: radius.input,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    gap: 4,
  },
  emptyTitle: { ...text.bodyM, fontFamily: font.bodySemi },
  footer: { ...text.caption, color: colors.textMuted, lineHeight: 18 },
  primary: {
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { ...text.button, color: colors.surface },
  secondary: {
    height: 52,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.green500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { ...text.button, color: colors.green500 },
  infoChip: {
    borderRadius: radius.input,
    backgroundColor: colors.infoBg,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
  },
  infoText: { ...text.caption, color: colors.info },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  busyText: { ...text.caption, color: colors.textMuted },
  rowCard: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pickerRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingHorizontal: space[3],
    paddingVertical: space[2],
  },
  rowDisabled: { opacity: 0.45 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.input,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 1 },
  rowTitle: { ...text.bodyM, fontFamily: font.bodySemi },
  trailing: { ...text.caption, color: colors.textMuted },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 64 },
});
