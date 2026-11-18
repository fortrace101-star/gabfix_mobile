# Destination Selection: Feature and Tooling Spec

Expo React Native app, SafeBoda-style ride flow. Based on the client's requirements and the "Pickup & Drop Off" screenshots.

## 1. Client requirements

The client wants a destination picker with these input methods:

1. **Auto-search**: suggestions appear as the user types (e.g. typing "maganj" returns Maganjo, Maganjo Grain Millers Ltd, Maganjo Taxi Stage).
2. **Manual entry**: the user types their own destination text.
3. **Use Map**: pick a location by moving a pin on a map.
4. **Current location**: set a location with one tap using the device's GPS.
5. **Multiple destinations**: add all stops up front so the driver can plan the route (additional charges may apply).

## 2. Features to build

### 2.1 Autocomplete search input
- Debounced input (about 300 ms) calling a places API
- Suggestion rows with a primary name and a secondary address line
- Loading, empty, and error states
- Clear (X) button and keyboard handling

### 2.2 Manual entry fallback
- If no suggestion matches, show a "Use '<typed text>'" row
- Typed text has no coordinates, so geocode it or ask the user to confirm on the map
- Without coordinates the trip can't be priced or routed

### 2.3 Use Map (pin picker)
- Map with a fixed center pin; the user pans the map beneath it
- Reverse geocode the pin position to an address label
- Starts centered on the user's current position

### 2.4 Current location
- "Current location" row pinned at the top of the suggestion list, beside "Use Map"
- Visible even when the input is empty
- On tap: permission check, get coordinates, reverse geocode, fill the field, save the stop
- Most useful for pickup (prefill by default); still valid as a destination
- Edge cases: permission denied (offer "Open settings"), location services off, slow or unavailable GPS (timeout plus retry), low accuracy (let the user fine-tune on the map)

### 2.5 Multiple destinations
- Pickup, then stop 1, stop 2, and so on, each with its own search field
- Add, remove, and reorder stops
- Show a note that additional charges may apply

### 2.6 Location bias
- Bias or restrict results to Uganda and the user's area
- Use current coordinates to rank nearby results first

### 2.7 Nice-to-haves
- Recent searches
- Saved places (Home, Work)
- Distance from the user on each suggestion
- Local database of stages and landmarks merged with API results

## 3. Tools and libraries

| Need | Option |
|---|---|
| Places autocomplete and details | Google Places API (New). Alternatives: Mapbox Search Box, HERE, self-hosted Photon/Nominatim |
| Autocomplete UI | `react-native-google-places-autocomplete`, or a custom `TextInput` + `FlatList` to match the design exactly |
| Maps and pin picker | `react-native-maps` (Google provider on Android), or `@rnmapbox/maps` for Mapbox |
| Location and permissions | `expo-location` |
| Opening settings | `Linking.openSettings()` (React Native) |
| Reverse geocoding | Google Geocoding API, with `Location.reverseGeocodeAsync()` as a free fallback |
| Debounce | `use-debounce` or `lodash.debounce` |
| Request caching and cancellation | `@tanstack/react-query`, or `AbortController` with `fetch` |
| Trip and stops state | `zustand` or React Context |
| Reorderable stops | `react-native-draggable-flatlist` |
| Recents and saved places | `react-native-mmkv` or `@react-native-async-storage/async-storage` |
| Long lists | `FlatList` or `@shopify/flash-list` |
| Keyboard behavior | `KeyboardAvoidingView` or `react-native-keyboard-controller` |

Install the Expo-managed packages with:

```bash
npx expo install expo-location react-native-maps
npm install zustand use-debounce @tanstack/react-query react-native-draggable-flatlist
```

## 4. Data model

Every stop uses the same shape, regardless of how it was entered:

```ts
export type StopSource = 'search' | 'manual' | 'map' | 'current';

export interface Stop {
  id: string;
  label: string;        // "Maganjo"
  address: string;      // "Kawanda - Senge Rd, Kampala, Uganda"
  lat: number;
  lng: number;
  placeId?: string;
  source: StopSource;
}
```

## 5. `useCurrentLocation` hook

Handles permission, services-off detection, a timeout, a fast last-known fix, a fresh fix, and reverse geocoding in one place.

```ts
// hooks/useCurrentLocation.ts
import { useCallback, useRef, useState } from 'react';
import { Linking } from 'react-native';
import * as Location from 'expo-location';
import type { Stop } from '../types';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
const TIMEOUT_MS = 10000;

export type LocationError =
  | 'permission_denied'
  | 'services_disabled'
  | 'timeout'
  | 'unknown';

interface State {
  loading: boolean;
  error: LocationError | null;
  stop: Stop | null;
  accuracy: number | null; // meters
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ label: string; address: string }> {
  // 1) Google Geocoding (better coverage for Kampala)
  if (GOOGLE_API_KEY) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`
      );
      const json = await res.json();
      const first = json?.results?.[0];
      if (first?.formatted_address) {
        const label = first.formatted_address.split(',')[0];
        return { label, address: first.formatted_address };
      }
    } catch {
      // fall through to the on-device geocoder
    }
  }

  // 2) Expo's on-device reverse geocoder
  try {
    const [p] = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lng,
    });
    if (p) {
      const label = p.name || p.street || p.district || 'Current location';
      const address = [p.name, p.street, p.district, p.city, p.country]
        .filter(Boolean)
        .join(', ');
      return { label, address: address || label };
    }
  } catch {
    // ignore
  }

  // 3) Last resort
  return {
    label: 'Current location',
    address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
  };
}

export function useCurrentLocation() {
  const [state, setState] = useState<State>({
    loading: false,
    error: null,
    stop: null,
    accuracy: null,
  });
  const inFlight = useRef(false);

  const fetchLocation = useCallback(async (): Promise<Stop | null> => {
    if (inFlight.current) return null;
    inFlight.current = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      // Permission
      let perm = await Location.getForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        perm = await Location.requestForegroundPermissionsAsync();
      }
      if (perm.status !== 'granted') {
        setState((s) => ({ ...s, loading: false, error: 'permission_denied' }));
        return null;
      }

      // Location services (GPS toggle)
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setState((s) => ({ ...s, loading: false, error: 'services_disabled' }));
        return null;
      }

      // Fast path: a recent cached fix (under 30 s old, under 100 m accuracy)
      let pos = await Location.getLastKnownPositionAsync({
        maxAge: 30000,
        requiredAccuracy: 100,
      });

      // Fresh fix if there is no usable cached one
      if (!pos) {
        pos = await withTimeout(
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          }),
          TIMEOUT_MS
        );
      }

      const { latitude, longitude, accuracy } = pos.coords;
      const { label, address } = await reverseGeocode(latitude, longitude);

      const stop: Stop = {
        id: `current-${Date.now()}`,
        label,
        address,
        lat: latitude,
        lng: longitude,
        source: 'current',
      };

      setState({ loading: false, error: null, stop, accuracy: accuracy ?? null });
      return stop;
    } catch (e: any) {
      const error: LocationError =
        e?.message === 'timeout' ? 'timeout' : 'unknown';
      setState((s) => ({ ...s, loading: false, error }));
      return null;
    } finally {
      inFlight.current = false;
    }
  }, []);

  const openSettings = useCallback(() => Linking.openSettings(), []);

  const reset = useCallback(
    () => setState({ loading: false, error: null, stop: null, accuracy: null }),
    []
  );

  return { ...state, fetchLocation, openSettings, reset };
}
```

### Usage in the picker

```tsx
// components/CurrentLocationRow.tsx
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import type { Stop } from '../types';

export function CurrentLocationRow({ onSelect }: { onSelect: (s: Stop) => void }) {
  const { loading, error, fetchLocation, openSettings } = useCurrentLocation();

  const handlePress = async () => {
    const stop = await fetchLocation();
    if (stop) onSelect(stop);
  };

  return (
    <View>
      <Pressable onPress={handlePress} disabled={loading}>
        <Text>Use current location</Text>
        {loading && <ActivityIndicator />}
      </Pressable>

      {error === 'permission_denied' && (
        <Pressable onPress={openSettings}>
          <Text>Location permission is off. Tap to open settings.</Text>
        </Pressable>
      )}
      {error === 'services_disabled' && (
        <Text>Please turn on your phone's location (GPS).</Text>
      )}
      {error === 'timeout' && (
        <Pressable onPress={handlePress}>
          <Text>Couldn't get your location. Tap to retry.</Text>
        </Pressable>
      )}
    </View>
  );
}
```

### Prefilling pickup on screen load

```tsx
useEffect(() => {
  (async () => {
    const perm = await Location.getForegroundPermissionsAsync();
    if (perm.status === 'granted') {
      const stop = await fetchLocation();
      if (stop) setPickup(stop);
    }
  })();
}, []);
```

## 6. Provider decision: Google Places API (New)

SafeBoda-style search is best matched by Google Places for autocomplete and place details, Google Geocoding for reverse geocoding, and `react-native-maps` (Google provider) for the pin picker. Google's coverage of small Kampala places is not perfect, so merge in a local table of stages and landmarks (see 6.4).

### 6.1 Account and key setup

1. Create a Google Cloud project, ideally owned by the **client's company** rather than a personal account.
2. Create a billing account (country, business details, billing address, payment card). Billing is required even to use the free monthly usage. If the card is rejected, resolve it inside Google Cloud.
3. Enable only these APIs: **Places API (New)**, **Geocoding API**, **Maps SDK for Android**, **Maps SDK for iOS**.
4. Create API keys and restrict them:
   - Android key: restrict by package name and SHA-1 fingerprint, and to the APIs above
   - iOS key: restrict by bundle ID and to the APIs above
5. Put the key in `.env` as `EXPO_PUBLIC_GOOGLE_MAPS_KEY`. Anything prefixed `EXPO_PUBLIC_` ships inside the app bundle, so restrictions on the key are essential. For stronger protection, proxy Places calls through your backend.
6. For `react-native-maps` in production, set the key in `app.json`:

```json
{
  "expo": {
    "ios": {
      "config": { "googleMapsApiKey": "YOUR_IOS_KEY" }
    },
    "android": {
      "config": {
        "googleMaps": { "apiKey": "YOUR_ANDROID_KEY" }
      }
    }
  }
}
```

Use a development build or EAS build; Expo Go is only suitable for early testing.

### 6.2 Billing notes

- Free usage is per SKU each month (Essentials SKUs get 10,000 free events), not pooled across APIs.
- Autocomplete is billed per session when you send a **session token** and finish the session with a Place Details call. Per-request billing applies if you don't, and it adds up quickly while typing.
- Which Place Details fields you request decides the Place Details SKU (Essentials, Pro, Enterprise). Check Google's current pricing page before locking in your field mask.
- Abandoned sessions (user types but never selects) are billed per request, so keep the debounce and a minimum character count.

### 6.3 Autocomplete and place details helpers

```ts
// services/places.ts
import * as Crypto from 'expo-crypto'; // npx expo install expo-crypto

const KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY!;
const BASE = 'https://places.googleapis.com/v1';

// Kampala city center, used when the user's location is unknown
export const KAMPALA = { latitude: 0.3476, longitude: 32.5825 };

export interface Suggestion {
  id: string;            // placeId, or local-<id> for local places
  label: string;         // "Maganjo"
  address: string;       // "Kawanda - Senge Rd, Kampala, Uganda"
  source: 'google' | 'local';
  lat?: number;          // present for local places
  lng?: number;
}

export const newSessionToken = () => Crypto.randomUUID();

export async function autocomplete(
  input: string,
  sessionToken: string,
  bias: { latitude: number; longitude: number } = KAMPALA,
  signal?: AbortSignal
): Promise<Suggestion[]> {
  const res = await fetch(`${BASE}/places:autocomplete`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
    },
    body: JSON.stringify({
      input,
      sessionToken,
      languageCode: 'en',
      includedRegionCodes: ['ug'],
      locationBias: {
        circle: { center: bias, radius: 50000 }, // 50 km is the maximum
      },
    }),
  });

  if (!res.ok) throw new Error(`Autocomplete failed: ${res.status}`);
  const json = await res.json();

  return (json.suggestions ?? [])
    .filter((s: any) => s.placePrediction)
    .map((s: any) => {
      const p = s.placePrediction;
      return {
        id: p.placeId,
        label: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
        address: p.structuredFormat?.secondaryText?.text ?? '',
        source: 'google' as const,
      };
    });
}

// Call once when the user taps a suggestion. This ends the session.
export async function getPlaceCoords(
  placeId: string,
  sessionToken: string
): Promise<{ lat: number; lng: number; address: string }> {
  const res = await fetch(
    `${BASE}/places/${placeId}?sessionToken=${sessionToken}`,
    {
      headers: {
        'X-Goog-Api-Key': KEY,
        // Request only what you need; fields decide the billing SKU
        'X-Goog-FieldMask': 'location,formattedAddress',
      },
    }
  );
  if (!res.ok) throw new Error(`Place details failed: ${res.status}`);
  const json = await res.json();
  return {
    lat: json.location.latitude,
    lng: json.location.longitude,
    address: json.formattedAddress,
  };
}
```

### 6.4 `usePlaceSearch` hook (debounce, cancellation, session token, local merge)

```ts
// hooks/usePlaceSearch.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import {
  autocomplete,
  getPlaceCoords,
  newSessionToken,
  Suggestion,
} from '../services/places';
import type { Stop } from '../types';

const MIN_CHARS = 3;

interface Options {
  bias?: { latitude: number; longitude: number };
  // Your own stages and landmarks, searched on-device or via your backend
  searchLocal?: (q: string) => Promise<Suggestion[]>;
}

export function usePlaceSearch({ bias, searchLocal }: Options = {}) {
  const [query, setQuery] = useState('');
  const [debounced] = useDebounce(query, 300);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const session = useRef(newSessionToken());
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = debounced.trim();
    if (q.length < MIN_CHARS) {
      setResults([]);
      setLoading(false);
      return;
    }

    abortRef.current?.abort(); // cancel the stale request
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [local, google] = await Promise.all([
          searchLocal ? searchLocal(q) : Promise.resolve([]),
          autocomplete(q, session.current, bias, controller.signal),
        ]);

        // Local results first, then Google, removing duplicate labels
        const seen = new Set<string>();
        const merged = [...local, ...google].filter((s) => {
          const key = `${s.label}|${s.address}`.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setResults(merged);
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setError('Could not load suggestions. Check your connection.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [debounced, bias?.latitude, bias?.longitude]);

  // Convert a tapped suggestion into a Stop
  const select = useCallback(async (s: Suggestion): Promise<Stop> => {
    let lat = s.lat;
    let lng = s.lng;
    let address = s.address;

    if (s.source === 'google') {
      const details = await getPlaceCoords(s.id, session.current);
      lat = details.lat;
      lng = details.lng;
      address = details.address;
      session.current = newSessionToken(); // session ended, start a new one
    }

    return {
      id: `${s.source}-${s.id}`,
      label: s.label,
      address,
      lat: lat!,
      lng: lng!,
      placeId: s.source === 'google' ? s.id : undefined,
      source: 'search',
    };
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  return { query, setQuery, results, loading, error, select, clear };
}
```

### 6.5 Wiring it up

```tsx
// components/DestinationSearch.tsx
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { usePlaceSearch } from '../hooks/usePlaceSearch';
import { CurrentLocationRow } from './CurrentLocationRow';
import type { Stop } from '../types';

export function DestinationSearch({
  userCoords,
  onPick,
  onOpenMap,
}: {
  userCoords?: { latitude: number; longitude: number };
  onPick: (s: Stop) => void;
  onOpenMap: () => void;
}) {
  const { query, setQuery, results, loading, error, select, clear } =
    usePlaceSearch({ bias: userCoords });

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Add Destination"
        autoCorrect={false}
      />
      {query.length > 0 && (
        <Pressable onPress={clear}><Text>Clear</Text></Pressable>
      )}

      <Pressable onPress={onOpenMap}><Text>Use Map</Text></Pressable>
      <CurrentLocationRow onSelect={onPick} />

      {loading && <ActivityIndicator />}
      {error && <Text>{error}</Text>}

      <FlatList
        data={results}
        keyExtractor={(s) => s.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable onPress={async () => onPick(await select(item))}>
            <Text style={{ fontWeight: '700' }}>{item.label}</Text>
            <Text numberOfLines={1}>{item.address}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          query.trim().length >= 3 && !loading ? (
            <Pressable onPress={onOpenMap}>
              <Text>No match for "{query}". Place it on the map instead.</Text>
            </Pressable>
          ) : null
        }
      />
    </View>
  );
}
```

### 6.6 Local stages and landmarks table (suggested shape)

```ts
export interface LocalPlace {
  id: string;
  name: string;        // "Maganjo Taxi Stage"
  area: string;        // "Kampala-Masindi Highway"
  lat: number;
  lng: number;
  aliases?: string[];  // alternate spellings, e.g. ["Maganjo stage"]
}
```

Store it on your backend (with an endpoint like `GET /places/search?q=`) or bundle a small version in the app for offline use. Searching it on the server also lets you rank by popularity and add places the client's drivers and riders report.

## 7. Implementation notes

- **Debounce and cancel** stale autocomplete requests so fast typing doesn't spam the API or show out-of-order results.
- **Session tokens**: generate one per search session and reuse it until the user selects a place (reduces Google billing).
- **API keys**: restrict by Android package and SHA-1 or iOS bundle ID. For stronger protection, proxy requests through your backend, which can add caching and a local-places fallback.
- **Local coverage**: Google can be patchy for smaller Kampala neighborhoods and taxi stages. Keep your own table of stages and landmarks and merge it with API results.
- **Reverse geocoding quality**: labels may be generic ("Kampala, Uganda"). Offer a "Confirm on map" step so the user can fine-tune.
- **Accuracy**: `Accuracy.High` is better for pickup but slower and more battery-hungry. `Balanced` is a reasonable default for destinations.
- **Expo setup**: `react-native-maps` works in Expo Go for development. For production Google Maps keys, use a development build or EAS build and set the key in `app.json`. Mapbox needs a development build from the start.
- **Permissions in `app.json`**:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "We use your location to set your pickup point and find nearby places."
        }
      ]
    ]
  }
}
```

## 8. Build order

1. Location permission and current position (`useCurrentLocation`)
2. Reverse geocoding helper
3. "Current location" row and pickup prefill
4. Google Cloud project, billing, restricted API keys
5. Autocomplete (`usePlaceSearch`) with debounce, session token, location bias
6. Place Details fetch on select (to get coordinates)
7. Use Map pin picker with reverse geocoding
8. Manual entry fallback
9. Multi-stop management (add, remove, reorder)
10. Recents, saved places, and local-places fallback

## 9. Open questions for the client

- Which maps provider is preferred (Google, Mapbox, other)? This affects cost and Kampala coverage.
- Is there an existing database of stages and landmarks to merge into search?
- What is the maximum number of stops, and how are extra charges calculated?
- Should pickup always default to current location?
- Does the app need to work offline or on poor connections (e.g. cached recents)?
