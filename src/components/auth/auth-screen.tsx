import { ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Blob, type BlobVariant } from '@/components/auth/blob';
import { BrandMark } from '@/components/auth/brand-mark';
import { LoadingOverlay } from '@/components/auth/loading-overlay';
import { useStatusBarStyle } from '@/hooks/use-status-bar-style';
import { auth, authSize, size } from '@/theme';

type Props = {
  children: ReactNode;
  footer?: ReactNode;
  blobs?: BlobVariant[];
  loading?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  brand?: boolean;
  center?: boolean;
  contentTop?: number;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Full-bleed coloured page for every auth screen: gradient, optional blob and brand mark,
 * keyboard-safe scrolling, a bottom-pinned footer and the shared loading treatment.
 */
export function AuthScreen({
  children,
  footer,
  blobs = [],
  loading = false,
  showBack = false,
  onBack,
  brand = true,
  center = false,
  contentTop = 0,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();
  useStatusBarStyle('light');

  return (
    <LinearGradient
      colors={[auth.bgTop, auth.bgBottom]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}>
      {blobs.map((variant) => (
        <Blob key={variant} variant={variant} />
      ))}

      <View style={styles.layer}>
        {brand ? (
          <View style={[styles.brandRow, { paddingTop: insets.top + authSize.brandTop }]}>
            {showBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={8}
                onPress={onBack}
                style={styles.back}>
                <ChevronLeft size={size.icon} color={auth.text} strokeWidth={2} />
              </Pressable>
            ) : null}
            <BrandMark size={authSize.logoMark} />
          </View>
        ) : null}

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View
            style={[styles.flex, loading && styles.dim]}
            pointerEvents={loading ? 'none' : 'auto'}
            importantForAccessibility={loading ? 'no-hide-descendants' : 'auto'}
            accessibilityElementsHidden={loading}>
            <ScrollView
              contentContainerStyle={[
                styles.content,
                { paddingTop: contentTop, paddingBottom: insets.bottom + 16 },
                center && styles.center,
                contentStyle,
              ]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              bounces={false}
              showsVerticalScrollIndicator={false}>
              {children}
              {footer ? <View style={styles.footer}>{footer}</View> : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>

      <LoadingOverlay visible={loading} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  layer: { flex: 1 },
  flex: { flex: 1 },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: authSize.pageX,
    minHeight: 44,
  },
  back: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: authSize.pageX,
  },
  center: { justifyContent: 'center' },
  footer: { marginTop: 'auto', paddingTop: 24 },
  dim: { opacity: auth.dim },
});
