import { Check, type LucideIcon } from 'lucide-react-native';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';

import { colors, font, radius, selectable, space, text } from '@/theme';
import { selectionHaptic } from '@/utils/haptics';

type Props = {
  title: string;
  description: string;
  meta: string;
  icon: LucideIcon;
  selected: boolean;
  onToggle: () => void;
  onOpenIncluded: () => void;
};

type StoppableEvent = GestureResponderEvent & { stopPropagation?: () => void };

/** Card plus a visual checkbox; tapping anywhere on the card toggles (Part 2, P9). */
export function AddOnCard({
  title,
  description,
  meta,
  icon: Icon,
  selected,
  onToggle,
  onOpenIncluded,
}: Props) {
  const openIncluded = (event: StoppableEvent) => {
    // On web the link sits inside the card's press area, so stop the tap from toggling.
    event.stopPropagation?.();
    onOpenIncluded();
  };

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={`${title}. ${meta}`}
      accessibilityState={{ checked: selected }}
      // RN Web does not map accessibilityState.checked to the DOM; this keeps web parity.
      aria-checked={selected}
      onPress={() => {
        selectionHaptic();
        onToggle();
      }}
      style={[selectable.card, styles.card, selected && selectable.selected]}>
      <View style={styles.icon}>
        <Icon size={28} color={colors.green500} strokeWidth={2} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title} maxFontSizeMultiplier={1.3}>
          {title}
        </Text>
        <Text style={styles.description} maxFontSizeMultiplier={1.3}>
          {description}
        </Text>
        <Text style={styles.meta} maxFontSizeMultiplier={1.3}>
          {meta}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`What's included in ${title}`}
          hitSlop={8}
          onPress={openIncluded}>
          <Text style={styles.link} maxFontSizeMultiplier={1.3}>
            What&apos;s included
          </Text>
        </Pressable>
      </View>

      <View style={[styles.checkbox, selected && styles.checkboxOn]}>
        {selected ? <Check size={16} color={colors.surface} strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'flex-start' },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.tile,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: space[1] },
  title: { ...text.bodyM, fontFamily: font.bodySemi, fontSize: 15 },
  description: { ...text.caption },
  meta: { ...text.caption, color: colors.green700 },
  link: { ...text.caption, color: colors.green500, fontFamily: font.bodySemi },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: colors.green500, borderColor: colors.green500 },
});
