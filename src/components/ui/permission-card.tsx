import { MapPinOff } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, space, text } from '@/theme';

import { Button } from './button';

type Props = {
  title: string;
  body: string;
  onOpenSettings: () => void;
};

/** P26 permission denial: benefit copy, Open settings and the manual alternative. */
export function PermissionCard({ title, body, onOpenSettings }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <MapPinOff size={22} color={colors.warning} strokeWidth={2} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            {title}
          </Text>
          <Text style={styles.body} maxFontSizeMultiplier={1.3}>
            {body}
          </Text>
        </View>
      </View>
      <Button label="Open settings" variant="secondary" small onPress={onOpenSettings} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: space[3],
    padding: space[3],
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.warningBg,
    backgroundColor: colors.warningBg,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  title: { ...text.bodyM, fontFamily: text.h3.fontFamily, color: colors.text },
  body: { ...text.caption, color: colors.textMuted },
});
