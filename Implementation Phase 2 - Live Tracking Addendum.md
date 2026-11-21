# Implementation Phase 2 - Live tracking addendum (technician on the map)

Extends **S4** (backend) and **S5** (permissions, privacy) for one feature: showing the assigned cleaner or technician moving on a Google map on `/booking/[id]/track`. It adds no unrelated screens and repeats nothing from S1 to S5. Written 2026-11-21 against the repo snapshot. Nothing was compiled or run, and I did not check current Google or Expo docs, so every item marked **confirm** must be verified in the step that uses it.

---

## 1. What already exists (checked in the repo)

| Piece | File | Behaviour today |
|---|---|---|
| Map component | `src/components/booking/tracking-map.tsx` | Uses `react-native-maps` only if the package is installed **and** `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is set; otherwise shows a schematic drawing. Draws a destination marker, a cleaner marker and a green line |
| Live data hook | `src/hooks/use-live-tracking.ts` | With an API base URL: tries a WebSocket at `/ws/bookings/{id}`, falls back to polling `GET /bookings/{id}/tracking` every 10 s (`TRACKING_POLL_INTERVAL_MS`). Without an API it stays in estimated mode. It is disabled for `completed` and `cancelled` bookings |
| Payload contract | `src/lib/tracking.ts` `LiveTrackingPayload` | `status`, `routeProgress`, `etaMinutes`, `etaText`, `detail`, `cleaner { id, name, initials, phone, lat, lng }`, `destination { lat, lng, label }`, `updatedAt` |
| Location permission | `app.json` | `expo-location` with a when-in-use string (used for the address pin) |
| Packages | `package.json` | `expo-location` installed; **`react-native-maps` is not installed** |

So the customer app already speaks the contract. What is missing: the package and key, a server that supplies `cleaner.lat/lng`, something on the technician's side that sends the position, and four small map improvements (Section 2).

---

## 2. Changes to the customer map (small, all in `tracking-map.tsx`)

| # | Gap found in the code | Change |
|---|---|---|
| M1 | `initialRegion` is read once, so the camera never follows the technician | Keep a `ref` to the map and call `fitToCoordinates([cleaner, destination], { edgePadding })` when either point changes, at most once every 5 s; stop auto-fitting after the customer drags the map, and show a small "Recentre" button to resume (**confirm** the method name in the installed version) |
| M2 | The line is a straight segment between two points, not a road route | Draw the **encoded polyline returned by the server** (Section 4.3) when present in the payload (`routePolyline`, new optional field); fall back to the straight line when absent |
| M3 | Marker is the default pin | Use the existing avatar component (S1 12.3, photo or initials) as a custom marker view; set `tracksViewChanges={false}` after the first render to avoid per-frame redraws |
| M4 | A stale position looks live | If `updatedAt` is older than 60 s show "Last seen 2 min ago" in the status area and dim the marker; older than 5 min show "Location unavailable" and keep the ETA text from the server |
| M5 | Movement jumps between updates | Animate the marker between points over about 1 s (`AnimatedRegion` or an interpolated state; **confirm** the approach for the installed version). Never animate when the new point is more than 1 km away (treat it as a reset) |

Add to `LiveTrackingPayload`: `routePolyline?: string` (encoded, Section 4.3). All other fields stay.

---

## 3. Turning the map on (checklist)

1. Google Cloud project, **Maps SDK for Android** enabled (and **Maps SDK for iOS** if shipping iOS); create the **app key**, restrict it to your package name and release SHA-1 (add the EAS and Play app-signing fingerprints; **confirm**), and set a quota cap and billing alert.
2. `npx expo install react-native-maps`; the new native module requires an EAS development build (**confirm** whether SDK 58 Expo Go supports your own key; assume no).
3. `app.json`: Android `android.config.googleMaps.apiKey`, iOS `ios.config.googleMapsApiKey` (**confirm** option names); and set `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in each EAS profile (S5 Section 1) because the component checks it.
4. A **separate server key** for the Directions or Routes API (Section 4.3), kept as a Supabase secret, restricted to the Edge Function's calls and never shipped in the app. Do not reuse the app key.

---

## 4. Backend additions (extends S4)

### 4.1 Tables

| Table | Columns | Notes |
|---|---|---|
| `technician_locations` | `cleaner_id` pk, `booking_id`, `lat`, `lng`, `accuracy_m`, `heading`, `speed_mps`, `captured_at`, `received_at` | **One row per technician, overwritten**, not a history, so the table stays tiny and nothing is retained |
| `tracking_state` | `booking_id` pk, `status` (`'confirmed' \| 'on_the_way' \| 'in_progress' \| 'completed' \| 'cancelled'`), `eta_minutes`, `eta_text`, `route_polyline`, `route_updated_at`, `started_at` | The server-side status that the app payload mirrors; S4 `bookings.status` remains the customer-facing `upcoming/completed/cancelled` and is derived from it |

RLS: `technician_locations` has **no customer policy**. Customers never read it directly; they read only through the tracking function (4.2), which checks the booking belongs to them and the status allows sharing. Technicians write only their own row.

### 4.2 Endpoints

| Path | Who | Behaviour |
|---|---|---|
| `POST /technician/location` | Technician | Body `{ bookingId, lat, lng, accuracy, heading, speed, capturedAt }`. Validates: the technician is assigned to that booking, status is `on_the_way` or `in_progress`, coordinates in range, `capturedAt` not more than 60 s in the future and not older than the stored row. Upserts `technician_locations`. Rate limit: 1 request per 5 s per technician |
| `POST /technician/booking/{id}/status` | Technician | Moves `confirmed` to `on_the_way` to `in_progress` to `completed`; each change calls `notify` (S4 5.4) with the cleaner-on-the-way as **critical** |
| `GET /bookings/{id}/tracking` | Customer | The existing polling endpoint. Returns the `LiveTrackingPayload`. Includes `cleaner.lat/lng` **only** when status is `on_the_way` or `in_progress` **and** the booking is the caller's; otherwise omits coordinates and returns the status text only |
| `/ws/bookings/{id}` | Customer | See 4.4 |

### 4.3 Route and ETA

- Call the Google **Directions or Routes API from an Edge Function**, with the server key, at most **once per 60 s per booking** (and again if the technician moves more than 500 m from the last route start). Cache `route_polyline`, `eta_minutes`, `eta_text` in `tracking_state` and reuse them for every customer poll in between. **Confirm** which API and field mask are current and priced for your volume.
- If the API is unavailable or over quota: fall back to straight-line distance divided by an assumed average speed, label the result "about", and set `eta_text` accordingly (never a precise minute from a guess).
- Set `routeProgress` = fraction of route length already covered (server-side), so the existing progress UI keeps working.

### 4.4 Real-time delivery

The app's hook already expects a WebSocket at `/ws/bookings/{id}` and silently falls back to polling. Supabase does not serve that path. Options:

| Option | Effort | Notes |
|---|---|---|
| **A. Polling only (default for v1)** | None | Works today: 10 s polling via `GET /bookings/{id}/tracking`; good enough for a 5 to 30 minute drive. Leave `trackingWsUrl` returning null on the backend; the hook falls back automatically |
| B. Edge Function WebSocket proxy at `/ws/bookings/{id}` | Medium | Keeps the client unchanged; **confirm** Edge Function WebSocket support and limits |
| C. Supabase Realtime in the hook | Medium | Change `use-live-tracking.ts` to subscribe to a per-booking broadcast channel; **confirm** channel authorisation for private channels |

Take A first; move to B or C only if 10 s feels slow in testing.

---

## 5. Technician side (what must exist for `POST /technician/location` to be called)

There is no technician app in S1 to S5. Choose one (Q44, default **separate small technician app**, because it has different permissions and store listing):

| Option | Notes |
|---|---|
| **Separate technician app (default)** | Own Expo project and store listing; sign-in for staff only; a "My jobs" list, a status button ("Start trip", "Arrived", "Complete"), and the location sender below |
| Technician mode inside the customer app | Fewer builds but forces background-location permission and the Play declaration onto all customers; not recommended |
| Admin web page on the technician's phone | Browser geolocation stops when the page is in the background; unsuitable for a drive |

**Location sender rules (technician app):**

1. Starts only when the technician taps **Start trip** (status `on_the_way`); stops on **Arrived** or when status leaves `on_the_way`/`in_progress`.
2. Uses `expo-location` background updates with `expo-task-manager` (**confirm** install and API for SDK 58), balanced accuracy, **time interval about 10 s, distance filter about 25 m**.
3. Android needs a **foreground service notification** while tracking ("Sharing your location with the customer"); declare the foreground service type for location (**confirm** requirement for the target Android version).
4. Request foreground permission first, then background ("Always"), each with a purpose text that says the location is shared only during active jobs.
5. On failure (no GPS, offline) queue only the **latest** point and send it when back online; never replay a history.
6. The technician can see a persistent "Location sharing ON" banner and a **Stop sharing** control; stopping it moves the job to a status the dispatcher sees.

---

## 6. Privacy, security and cost

| Topic | Rule |
|---|---|
| Who sees it | Only the booking's customer, only during `on_the_way` and `in_progress`, and only through the tracking function (4.2) |
| Retention | Only the latest point is stored (4.1); delete the row on `completed` or `cancelled`; no location history |
| Technician consent | Written into the technician agreement and the technician app's first-run screen; add to the privacy policy (S5 Section 4) |
| Data safety form | Add **precise location** collected from technicians (S5 Section 4 forms), shared with customers during active jobs only |
| Customer address | The destination coordinates come from the saved booking address (location picker); never exposed to the technician before assignment |
| Abuse | Rate limits in 4.2; reject points that jump unrealistically (more than about 150 km/h implied speed) |
| Cost | Directions or Routes calls are the billed part: one per 60 s per active job; cap with a quota and alert (Section 3). Map tiles in the app are billed by Google's current rules (**confirm**) |

---

## 7. Additions to S5 and S4

- **S4 Section 1:** add row "11. Estimated tracking (no live position) → `technician_locations` + `tracking_state`".
- **S4 Section 4:** add the three endpoints in 4.2 to the endpoint map.
- **S5 Section 3 (permissions):** customer app unchanged; add a technician-app block: location when in use and always, foreground service, notifications.
- **S5 Section 6 (monitoring):** alert when an `on_the_way` job has no location update for 3 minutes; track Directions API call count against quota.

---

## 8. Tests and acceptance

| Check | Expectation |
|---|---|
| Customer opens Track with no key or package | Schematic map still shows (no crash) |
| Technician sends a point | Customer marker moves within 10 s on polling |
| Customer pans the map | Auto-fit stops; Recentre restores it |
| No update for 90 s | "Last seen" text and dimmed marker |
| Booking `completed` | No location returned; `technician_locations` row removed |
| Wrong customer requests another booking's tracking | Rejected (403), no coordinates |
| Technician not assigned posts a location | Rejected |
| Directions API fails | Straight-line fallback with "about" ETA, no crash |
| Poor GPS jump of 50 km | Point rejected server-side |
| Unit tests | `route progress`, polyline decode, stale-position text, implausible-speed filter |

---

## 9. Open questions (defaults adopted)

| Q | Question | Default |
|---|---|---|
| Q44 | Technician app form | Separate small app |
| Q45 | Real-time transport | Polling every 10 s (4.4 option A) |
| Q46 | Directions or Routes API | Decide at implementation; server-side only, cached 60 s |
| Q47 | Show the technician's phone number on the Track screen | Use the existing call button; number comes from the payload and is shown only while the job is active |
| Q48 | Start sharing automatically on assignment | **No**; only after "Start trip" |

---

## 10. Hand-off summary

- **Changed in the customer app:** five improvements in `tracking-map.tsx` (follow camera, road route, avatar marker, stale-position states, smooth movement) and one optional field `routePolyline` in `LiveTrackingPayload`.
- **Added to the backend:** two tables, three endpoints, a Directions call cached 60 s, polling as the v1 transport.
- **Not decided:** whether to build the technician app now. Without it the customer map cannot show a live technician, so Track stays in estimated mode.
- **Depends on:** the assignment work (S4 5.5), `notify` (S4 5.4), the development build and map key (Section 3).
- **Unchanged and still valid:** everything else in S1 to S5, the Dashboard Addendum (the Active job card reads the same tracking state), and the deferred SMS and gateway decisions.
- **Index:** add this file under "After the screens" in `Implementation Phase 2 - Index.md`.
