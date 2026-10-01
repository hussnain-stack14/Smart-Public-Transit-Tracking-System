# Route stop map and driver Start Shift debug report

Verified 2026-09-17. This task changed frontend JavaScript/JSX and documentation only. All 43 backend file hashes remain unchanged. Browser checks used real existing records and made no route, stop, bus or account mutations.

## Admin map: actual contracts and data

- Route list: GET /api/routes via routeService.list(). It returns active route records with _id, routeName, startPoint, endPoint, description, isActive and timestamps. GET /api/routes/:id returns a single route. Neither response contains stops or route geometry.
- Stops: GET /api/stops/route/:routeId via stopService.listByRoute(). It returns an array of _id, route, stopName, latitude, longitude, stopOrder and timestamps. The route field is the owning Route ObjectId. The backend sorts by stopOrder ascending.
- Coordinates are separate numeric latitude/longitude fields, used as [latitude, longitude] in Leaflet. The API does not use GeoJSON. Valid coordinates must be finite numbers within latitude [-90, 90] and longitude [-180, 180]. Null, undefined, strings and out-of-range values are not turned into markers or silently converted to zero.
- Polyline source: none. The Route schema/API has no geometry/polyline/path field. Admin maps now show real stop markers without generating a route path between them.

Observed live route responses:

| Route ID | Route name | Stops returned |
| --- | --- | --- |
| 6aac0a8918360c4d3d6fbf6e | Abdullahpur to Numl | 0 |
| 6aaae1a24115ab1ff93d6b37 | kohinoor to gantaghar | 0 |
| 6aaae1414115ab1ff93d6b34 | Abdullahpur to Numl | 3 |
| 6a92cba4315dd0fefd55d1da | D-Ground to Jhang Road | 0 |

The populated route returned and rendered these three stops in backend order:

| stopOrder | stopName | latitude | longitude |
| --- | --- | --- | --- |
| 1 | Abdullahpur | 31.436 | 73.097 |
| 2 | D-Ground | 31.418 | 73.079 |
| 3 | Todhiwala | 31.4187 | 73.0791 |

These are saved backend positions, not newly geocoded locations. The two southern stops have nearby saved coordinates, so their symbols can overlap at a zoom level that also includes the northern stop; zooming in separates nearby markers. Their names/physical locations were not used to invent replacement coordinates.

### Root causes

The original populated preview already rendered all three stops returned by the API and fit their bounds. The current data does not contain five stops for any active route. Two route records share the same name, but their IDs and stop relationships differ: the newer record is empty and the older record owns the three stops. Records are kept separate by their actual IDs.

Several frontend defects were also confirmed:

1. StopMarker read name while this API supplies stopName, so raw backend stop popups showed a generic label.
2. The 280px preview inherited the global Leaflet 18rem minimum height, making its map 288px tall and clipping it inside the preview box. Its local minimum height is now overridden; the Leaflet viewport matches its visible container.
3. Stop/bus failures were treated as empty lists, and preview requests had no cleanup or protection against an older route response updating the selected route.
4. AdminDashboardPage supplied Promise.resolve([]) instead of requesting stops. The overview could therefore omit every stop even when route APIs had saved records.
5. Admin maps connected stop positions into a polyline although no backend route geometry exists. The overview also combined stops from different routes into one line.
6. MapControls passed a browser click event to Show transit network callbacks, which expected the Leaflet map instance.

### Fixes and changed files

| File under frontend/ | Change |
| --- | --- |
| src/components/admin/routes/RoutePreviewModal.jsx | Fetches stops for the actual selected route ID; cancels/ignores old requests; keeps loading, error/retry, confirmed empty and invalid-coordinate states distinct; lists all saved stops; renders every valid stop once in backend order; shows actual route ID to distinguish duplicate names; uses a scrolling native dialog; removes the unsupported polyline and prevents map clipping. |
| src/components/admin/AdminDashboardPage.jsx | Fetches stops through the existing stop API for each actual active route, preserves successful results and reports stop-fetch failures. |
| src/components/admin/AdminMapWidget.jsx | Renders valid real stop markers and saved bus positions, fits their bounds, displays stop loading/error notices, and removes the fabricated cross-route polyline. |
| src/components/admin/AdminDialog.jsx | Accepts an optional className through the existing cn helper so the route preview can reuse the current wider modal styling. Default driver dialogs keep their existing size. |
| src/components/map/StopMarker.jsx | Uses the actual stopName fallback, actual optional stopOrder, a marker title and popup; rejects invalid positions. Existing normalized name labels remain supported. |
| src/components/map/MapViewport.jsx | Validates coordinates, handles a single position, invalidates map size and refits bounds after container resizing; disconnects its observer and cancels pending work on cleanup. |
| src/components/map/MapControls.jsx | Supplies the real map instance when Show transit network is clicked. |
| src/lib/transit/coordinates.js | Shares coordinate validation and actual route-stop filtering, deduplication and numeric backend order. |
| src/services/stopService.js | Adds optional axios request configuration for aborting preview stop requests; the endpoint and existing client are unchanged. |
| src/components/driver/DriverDashboardPage.jsx | Clarifies why Start Shift is unavailable; no shift handler/state/API is added. |
| DRIVER_MANAGEMENT_BACKEND_GAPS.md | Repairs the two visible report encoding artifacts and links this debug report. |
| ROUTE_MAP_SHIFT_DEBUG.md | Records these contracts, fixes, verification results and remaining data/backend limitations. |

Viewport resizing uses the documented Leaflet invalidateSize and fitBounds operations on the existing React Leaflet map. See the [Leaflet map reference](https://leafletjs.com/reference.html#map-invalidatesize) and [React Leaflet map API](https://react-leaflet.js.org/docs/api-map/).

### Map verification

Production Chrome checks passed against the actual backend:

- Three stops returned, all three coordinates valid, three unique Leaflet markers rendered with exact saved [latitude, longitude], real names and backend stopOrder.
- Each marker popup displayed its real stop name and order. Map bounds contained every marker, and the visible map height matched the Leaflet viewport.
- Changing the selected route within the mounted preview removed old markers. Selecting the populated route again created one map with exactly the saved markers. Rapid route changes under latency could not restore an old response.
- The zero-stop route showed a confirmed empty state with no map or stale markers.
- Blocking the actual stop request showed a stop error without claiming an empty route; Retry loaded real markers. A failed bus lookup left valid stop markers available and its retry recovered bus details. No API response was mocked.
- Preview, stop-error and driver shift views fit 375, 390, 768, 1024 and 1440 pixels without horizontal overflow. The map refit all stops after each width change. Screenshots were inspected at mobile and desktop sizes.
- At 375 x 667 the preview stayed within the viewport, scrolled internally, and its close button remained reachable.
- The overview fetched saved stops and rendered them all; no unsupported line was drawn. Show transit network worked on both overview and driver maps.
- Coordinate checks using actual stop records verified route isolation, duplicate-ID removal, backend ordering and invalid/null coordinate rejection. No real coordinate was changed to perform these checks.
- No application JavaScript exceptions, hydration errors, Leaflet errors or application console errors occurred. No unexpected HTTP error responses occurred; blocked retry requests were intentional. Browser API operations were GET/OPTIONS and existing authentication POST only.

Exactly five stops could not be checked against the live API: active route stop counts are 0, 0, 3 and 0. No additional stops or coordinates were fabricated. A real five-stop route ID/data was requested while the independent fixes and checks continued. One-position viewport handling is implemented; a live one-stop route was not available for a separate route test. Routes with saved but invalid coordinates are handled in source and coordinate checks; none was returned by this live dataset.

## Driver shift: verified unsupported

SHIFT API STATUS: Not available.

Before this change, Start Shift was a disabled button with no onClick handler. It made no API call, emitted no Socket.IO event and produced no click error. The dashboard already displayed shift status Unavailable. The backend was rechecked through its server mounts, route files, User/Bus models, controllers and Socket.IO handlers: no shift lifecycle API, persisted shift record/status or shift event exists.

Supported operations are separate:

- PATCH /api/buses/:id/location is authorized for drivers and stores GPS coordinates, updates bus.status to active and emits locationUpdate to the watched bus room. This is not a persisted driver shift.
- PATCH /api/buses/:id/seats is the existing driver/admin seat operation.
- PUT /api/buses/:id is admin-only bus editing/assignment, not a driver shift operation.
- Existing Socket.IO watchBus and locationUpdate behavior is unchanged; no shift event was introduced.
- GPS starts independently through Start location sharing and navigator.geolocation.watchPosition. Cleanup stops the watcher and aborts an outstanding request. Stopping GPS does not end a shift or change the saved bus status.

Root cause: the requested shift operation has no backend capability. The frontend now explicitly says: Start Shift is currently unavailable because shift management is not supported by the backend. The disabled button and Unavailable status are retained. No localStorage shift flag, fake Shift Active state, fabricated endpoint or bus-status workaround was added.

Existing-driver checks passed in a separate browser context:

- Email/password login succeeded and redirected to /driver/dashboard.
- GET /api/auth/profile returned role driver and assignedBus 6a92cc52315dd0fefd55d1e0; the dashboard displayed its actual bus FSD-101.
- Start Shift remained visible and disabled. A click issued no mutation/shift request and created no fake active state or localStorage shift flag.
- Native GPS permission denial displayed the correct error without writing fabricated coordinates. Live Socket.IO remained connected, and dashboard refresh kept one active connection with a peak of one.
- DriverLocationControl.jsx, useSocket.js and lib/socket/socket.js passed hash comparison against the earlier baseline: their source is preserved. Real-device GPS permission approval/location transmission was not claimed as exercised by headless Chrome.
- The existing profile-based No bus assigned state remains available for unassigned accounts; no bus selection was introduced for drivers.

Required backend work before enabling shifts: authorized Start Shift, End Shift and current shift-status operations associated with the driver's assigned bus; persisted lifecycle/status; and documented success/error responses. This task did not modify or implement backend shift behavior.

## Build and remaining issues

npm.cmd run build passed after the map-height correction: production compilation succeeded and all 21 static pages were generated. Scoped ESLint passed for all ten changed/new application JS/JSX files. Backend SHA-256 comparison passed for all 43 files.

Remaining items are the unavailable shift capability, the absent real five-stop route needed for that exact acceptance check, and physical-device GPS testing. Current route-stop relationships and geographic positions are backend data; the frontend displays them without inventing missing records or route geometry.
