import { Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';

import { colors, font, radius, shadow, space, text } from '@/theme';
import type { GeoPoint } from '@/lib/tracking';

type Point = { x: number; y: number };

type NativeMapsModule = {
  default?: React.ComponentType<Record<string, unknown>>;
  Marker?: React.ComponentType<Record<string, unknown>>;
  Polyline?: React.ComponentType<Record<string, unknown>>;
  PROVIDER_GOOGLE?: unknown;
};

let nativeMaps: NativeMapsModule | null | undefined;

function getNativeMaps(): NativeMapsModule | null {
  if (nativeMaps !== undefined) return nativeMaps;
  try {
    // Optional dependency: available once a native map package is installed and
    // a provider key is configured. Metro resolves this at bundle time when
    // present; the try/catch keeps the schematic fallback working otherwise.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nativeMaps = require('react-native-maps') as NativeMapsModule;
  } catch {
    nativeMaps = null;
  }
  return nativeMaps;
}

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

export function hasNativeTrackingMap(): boolean {
  if (!GOOGLE_MAPS_KEY) return false;
  if (Platform.OS === 'web') return false;
  const maps = getNativeMaps();
  return Boolean(maps?.default);
}

/** A schematic Ntinda/Kiwatule route used when no native map is configured. */
const ROUTE: readonly Point[] = [
  { x: 12, y: 43 },
  { x: 24, y: 41 },
  { x: 32, y: 31 },
  { x: 46, y: 33 },
  { x: 56, y: 22 },
  { x: 72, y: 18 },
];

const ROUTE_PATH = ROUTE.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(
  ' ',
);

const pointAt = (progress: number): Point => {
  const clamped = Math.min(1, Math.max(0, progress));
  const scaled = clamped * (ROUTE.length - 1);
  const index = Math.min(ROUTE.length - 2, Math.floor(scaled));
  const t = scaled - index;
  const from = ROUTE[index];
  const to = ROUTE[index + 1];
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
  };
};

export type TrackingMapProps = {
  progress: number;
  cleanerName?: string;
  initials?: string;
  area?: string;
  live: boolean;
  cleanerLocation?: GeoPoint;
  destinationLocation?: GeoPoint & { label?: string };
};

function SchematicTrackingMap({ progress, cleanerName, initials, area, live }: TrackingMapProps) {
  const cleanerPoint = pointAt(progress);
  const destination = ROUTE[ROUTE.length - 1];

  return (
    <View style={styles.map} accessibilityLabel="Schematic map showing your cleaner's route">
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Rect width="100" height="100" fill="#EDF3EA" />

        <Path d="M-8 30 C 10 18, 22 28, 37 16 S 72 8, 108 20 L 108 -8 L -8 -8 Z" fill="#E0EDDF" />
        <Path d="M-5 86 C 16 76, 31 82, 50 69 S 79 61, 105 67 L 105 108 L -5 108 Z" fill="#F6F9F4" />
        <Rect x="4" y="6" width="15" height="12" rx="2" fill="#F8FAF6" />
        <Rect x="79" y="35" width="18" height="14" rx="2" fill="#F8FAF6" />
        <Rect x="41" y="52" width="14" height="12" rx="2" fill="#F8FAF6" />
        <Rect x="61" y="48" width="11" height="9" rx="2" fill="#F8FAF6" />

        <Path d="M-8 58 C 19 51, 33 57, 51 43 S 81 31, 108 38" stroke="#D7E1D4" strokeWidth="8" fill="none" />
        <Path d="M18 -8 C 22 14, 37 25, 32 48 S 23 81, 33 108" stroke="#DCE5D9" strokeWidth="6" fill="none" />
        <Path d="M62 -8 C 58 17, 70 27, 68 48 S 78 77, 72 108" stroke="#DCE5D9" strokeWidth="5" fill="none" />
        <Path d="M-8 75 C 20 66, 40 75, 61 63 S 87 56, 108 61" stroke="#F1E6B8" strokeWidth="3.5" fill="none" />
        <Path d="M-8 58 C 19 51, 33 57, 51 43 S 81 31, 108 38" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.7" />

        <Circle cx={destination.x} cy={destination.y} r="5" fill={colors.green500} opacity="0.16" />
        <Circle
          cx={destination.x}
          cy={destination.y}
          r="2.3"
          fill={colors.surface}
          stroke={colors.green500}
          strokeWidth="1.3"
        />

        <Path
          d={ROUTE_PATH}
          fill="none"
          stroke={colors.surface}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d={ROUTE_PATH}
          fill="none"
          stroke={colors.green500}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={live ? undefined : '2 2'}
        />

        <SvgText x="5" y="13" fontSize="2.4" fill={colors.textMuted} fontFamily={font.bodyMedium}>
          Ntinda
        </SvgText>
        <SvgText x="78" y="31" fontSize="2.2" fill={colors.textMuted} fontFamily={font.bodyMedium}>
          Kiwatule
        </SvgText>
        <SvgText x="8" y="72" fontSize="2.2" fill={colors.textMuted} fontFamily={font.bodyMedium}>
          Bukoto
        </SvgText>
        <SvgText x="47" y="84" fontSize="2" fill={colors.textMuted} fontFamily={font.bodyMedium}>
          Kira Road
        </SvgText>
      </Svg>

      <View
        style={[
          styles.destinationTag,
          {
            left: `${destination.x}%`,
            top: `${destination.y + 4}%`,
          },
        ]}>
        <Text style={styles.destinationText} maxFontSizeMultiplier={1.1} numberOfLines={1}>
          {area ? `${area} · Your address` : 'Your address'}
        </Text>
      </View>

      <View
        accessibilityLabel={
          cleanerName ? `${cleanerName} is on the route to your address` : 'Cleaner location'
        }
        style={[
          styles.cleanerMarker,
          {
            left: `${cleanerPoint.x}%`,
            top: `${cleanerPoint.y}%`,
          },
        ]}>
        <View style={styles.markerHalo} />
        <View style={styles.markerAvatar}>
          <Text style={styles.markerInitials} maxFontSizeMultiplier={1.1}>
            {initials || 'GF'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function NativeTrackingMap(props: TrackingMapProps) {
  const maps = getNativeMaps();
  const MapView = maps?.default;
  const Marker = maps?.Marker;
  const Polyline = maps?.Polyline;
  if (!MapView || !Marker || !Polyline) return <SchematicTrackingMap {...props} />;

  const cleanerCoord = props.cleanerLocation;
  const destinationCoord = props.destinationLocation;
  if (!cleanerCoord && !destinationCoord) return <SchematicTrackingMap {...props} />;

  const fallback = destinationCoord ?? cleanerCoord!;
  const region = {
    latitude: fallback.lat,
    longitude: fallback.lng,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };
  const route =
    cleanerCoord && destinationCoord
      ? [
          { latitude: cleanerCoord.lat, longitude: cleanerCoord.lng },
          { latitude: destinationCoord.lat, longitude: destinationCoord.lng },
        ]
      : undefined;

  return (
    <View style={styles.map} accessibilityLabel="Map showing your cleaner's route">
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        provider={Platform.OS === 'android' ? maps?.PROVIDER_GOOGLE : undefined}
        showsUserLocation={false}
        showsCompass={false}>
        {route ? <Polyline coordinates={route} strokeColor={colors.green500} strokeWidth={4} /> : null}
        {destinationCoord ? (
          <Marker coordinate={{ latitude: destinationCoord.lat, longitude: destinationCoord.lng }} title={props.destinationLocation?.label ?? 'Your address'} />
        ) : null}
        {cleanerCoord ? (
          <Marker
            coordinate={{ latitude: cleanerCoord.lat, longitude: cleanerCoord.lng }}
            title={props.cleanerName ?? 'Cleaner'}
            description={props.live ? 'On the way' : undefined}
          />
        ) : null}
      </MapView>
      {!cleanerCoord || !destinationCoord ? (
        <View style={styles.nativeHint} pointerEvents="none">
          <Text style={styles.nativeHintText} maxFontSizeMultiplier={1.1}>
            Waiting for live location details…
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * P15c map: renders a native map when `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is set
 * and `react-native-maps` is installed with live coordinates; otherwise falls
 * back to the schematic SVG route so the screen remains usable without a key or
 * a new native build.
 */
export function TrackingMap(props: TrackingMapProps) {
  if (hasNativeTrackingMap()) {
    return <NativeTrackingMap {...props} />;
  }
  return <SchematicTrackingMap {...props} />;
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: '#EDF3EA',
    overflow: 'hidden',
  },
  cleanerMarker: {
    position: 'absolute',
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerHalo: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(17,142,69,0.18)',
  },
  markerAvatar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.green500,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  markerInitials: {
    fontFamily: font.poppinsSemi,
    fontSize: 11,
    color: colors.surface,
  },
  destinationTag: {
    position: 'absolute',
    width: 132,
    marginLeft: -66,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.green100,
    paddingHorizontal: space[2],
    paddingVertical: 5,
    alignItems: 'center',
    ...shadow.card,
  },
  destinationText: {
    ...text.caption,
    fontSize: 10,
    lineHeight: 13,
    color: colors.green700,
    fontFamily: font.bodySemi,
  },
  nativeHint: {
    position: 'absolute',
    left: space[4],
    right: space[4],
    bottom: space[4],
    alignItems: 'center',
  },
  nativeHintText: {
    ...text.caption,
    color: colors.textMuted,
    backgroundColor: colors.surface,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
