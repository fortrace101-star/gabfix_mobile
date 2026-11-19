import { router } from 'expo-router';
import { Home, MapPin, MoreHorizontal, Plus, Star, Trash2, Pencil, X } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { TopBar } from '@/components/ui/top-bar';
import { Button } from '@/components/ui/button';
import {
  deleteAddress,
  setDefaultAddress,
  useAddresses,
  useAddressesHydrated,
  type SavedAddress,
} from '@/store/addresses';
import { colors, font, radius, shadow, space, text } from '@/theme';

function AddressMenu({
  address,
  visible,
  onClose,
}: {
  address: SavedAddress | null;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [confirming, setConfirming] = useState(false);

  if (!address) return null;

  const close = () => {
    setConfirming(false);
    onClose();
  };

  return (
    <Modal animationType="slide" onRequestClose={close} transparent visible={visible}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Close address actions"
          accessibilityRole="button"
          onPress={close}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space[4]) }]}>
          <View style={styles.handle} />
          {confirming ? (
            <View style={styles.confirm}>
              <View style={styles.confirmIcon}>
                <Trash2 size={24} color={colors.error} strokeWidth={2} />
              </View>
              <Text style={styles.confirmTitle} maxFontSizeMultiplier={1.3}>
                Delete this address?
              </Text>
              <Text style={styles.confirmBody} maxFontSizeMultiplier={1.3}>
                {address.street} will be removed from your address book. Bookings that already use
                it keep their address.
              </Text>
              <Button
                label="Delete address"
                variant="destructive"
                onPress={() => {
                  deleteAddress(address.id);
                  close();
                }}
                style={styles.fullWidth}
              />
              <Button label="Keep address" variant="ghost" onPress={() => setConfirming(false)} />
            </View>
          ) : (
            <>
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleWrap}>
                  <Text style={styles.sheetTitle} maxFontSizeMultiplier={1.3}>
                    {address.label}
                  </Text>
                  <Text style={styles.sheetSubtitle} maxFontSizeMultiplier={1.3} numberOfLines={1}>
                    {address.street}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel="Close"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={close}
                  style={styles.close}>
                  <X size={22} color={colors.text} strokeWidth={2} />
                </Pressable>
              </View>
              <MenuRow
                icon={Pencil}
                label="Edit address"
                onPress={() => {
                  close();
                  router.push({ pathname: '/addresses/[id]', params: { id: address.id } });
                }}
              />
              {!address.isDefault ? (
                <MenuRow
                  icon={Star}
                  label="Set as default"
                  onPress={() => {
                    setDefaultAddress(address.id);
                    close();
                  }}
                />
              ) : null}
              <MenuRow
                icon={Trash2}
                label="Delete address"
                destructive
                onPress={() => setConfirming(true)}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function MenuRow({
  icon: Icon,
  label,
  onPress,
  destructive,
}: {
  icon: typeof Pencil;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.menuRow}>
      <View style={[styles.menuIcon, destructive && styles.menuIconDanger]}>
        <Icon size={20} color={destructive ? colors.error : colors.green700} strokeWidth={2} />
      </View>
      <Text
        style={[styles.menuLabel, destructive && styles.menuLabelDanger]}
        maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </Pressable>
  );
}

function AddressCard({ address, onMenu }: { address: SavedAddress; onMenu: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${address.label} address, ${address.street}`}
      onPress={() => router.push({ pathname: '/addresses/[id]', params: { id: address.id } })}
      style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.labelPill}>
          <Home size={14} color={colors.green700} strokeWidth={2} />
          <Text style={styles.labelText} maxFontSizeMultiplier={1.2}>
            {address.label}
          </Text>
        </View>
        {address.isDefault ? (
          <View style={styles.defaultPill}>
            <View style={styles.defaultDot} />
            <Text style={styles.defaultText} maxFontSizeMultiplier={1.2}>
              Default
            </Text>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Manage ${address.label} address`}
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            onMenu();
          }}
          style={styles.more}>
          <MoreHorizontal size={22} color={colors.textMuted} strokeWidth={2} />
        </Pressable>
      </View>
      <Text style={styles.street} maxFontSizeMultiplier={1.3}>
        {address.street}
      </Text>
      {address.landmark ? (
        <Text style={styles.landmark} maxFontSizeMultiplier={1.3} numberOfLines={2}>
          {address.landmark}
        </Text>
      ) : null}
      <View style={styles.areaRow}>
        <MapPin size={14} color={colors.textMuted} strokeWidth={2} />
        <Text style={styles.area} maxFontSizeMultiplier={1.2}>
          {address.area} · {address.propertyType}
        </Text>
      </View>
    </Pressable>
  );
}

/** P24 saved addresses. P11 reads this list when choosing where to clean. */
export default function AddressesScreen() {
  const addresses = useAddresses();
  const hydrated = useAddressesHydrated();
  const [menuId, setMenuId] = useState<string | null>(null);
  const menuAddress = addresses.find((address) => address.id === menuId) ?? null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <TopBar
        title="Saved addresses"
        onBack={() => router.back()}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a new address"
            hitSlop={8}
            onPress={() => router.push({ pathname: '/addresses/[id]', params: { id: 'new' } })}
            style={styles.addTop}>
            <Plus size={22} color={colors.green700} strokeWidth={2} />
          </Pressable>
        }
      />
      <FlatList
        data={hydrated ? addresses : []}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, hydrated && addresses.length === 0 && styles.emptyContent]}
        renderItem={({ item }) => (
          <AddressCard address={item} onMenu={() => setMenuId(item.id)} />
        )}
        ListEmptyComponent={
          hydrated ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <MapPin size={28} color={colors.green700} strokeWidth={2} />
              </View>
              <Text style={styles.emptyTitle} maxFontSizeMultiplier={1.3}>
                No saved addresses
              </Text>
              <Text style={styles.emptyBody} maxFontSizeMultiplier={1.3}>
                Add the places you clean most. They will be ready to pick whenever you book.
              </Text>
              <Button
                label="Add an address"
                onPress={() => router.push({ pathname: '/addresses/[id]', params: { id: 'new' } })}
              />
            </View>
          ) : undefined
        }
        ListFooterComponent={
          hydrated && addresses.length > 0 ? (
            <Button
              label="Add a new address"
              variant="secondary"
              icon={Plus}
              onPress={() => router.push({ pathname: '/addresses/[id]', params: { id: 'new' } })}
            />
          ) : undefined
        }
      />
      <AddressMenu address={menuAddress} visible={Boolean(menuAddress)} onClose={() => setMenuId(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  addTop: { width: 48, height: 48, alignItems: 'flex-end', justifyContent: 'center' },
  content: { padding: space[4], paddingBottom: 120, gap: space[3] },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space[4],
    gap: space[2],
    ...shadow.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  labelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.green50,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  labelText: { ...text.caption, color: colors.green700, fontFamily: font.bodySemi },
  defaultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.yellow50,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  defaultDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.yellow600 },
  defaultText: { ...text.caption, fontSize: 11, color: colors.yellow800 },
  more: { marginLeft: 'auto', width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' },
  street: { ...text.bodyL, color: colors.text, fontFamily: font.bodyMedium },
  landmark: { ...text.caption, color: colors.textMuted },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  area: { ...text.caption, color: colors.textMuted, textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingHorizontal: space[6], gap: space[2] },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[1],
  },
  emptyTitle: { ...text.h3, color: colors.text, textAlign: 'center' },
  emptyBody: { ...text.bodyM, color: colors.textMuted, textAlign: 'center', marginBottom: space[2] },
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
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  sheetTitleWrap: { flex: 1, gap: 2 },
  sheetTitle: { ...text.h2 },
  sheetSubtitle: { ...text.caption },
  close: { width: 48, height: 48, alignItems: 'flex-end', justifyContent: 'center' },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.tile,
    backgroundColor: colors.green50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: colors.errorBg },
  menuLabel: { ...text.bodyM, color: colors.text },
  menuLabelDanger: { color: colors.error },
  confirm: { alignItems: 'center', gap: space[3], paddingVertical: space[4] },
  confirmIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: { ...text.h3, color: colors.text, textAlign: 'center' },
  confirmBody: { ...text.bodyM, color: colors.textMuted, textAlign: 'center' },
  fullWidth: { alignSelf: 'stretch' },
});
