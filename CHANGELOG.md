# Changelog

All notable changes to this fork are documented here. This fork adds **Viewport
mode** on top of [`digital195/unifi-protect-viewer`](https://github.com/digital195/unifi-protect-viewer).

## [1.2.3] — 2026-08-02

### Fixed — installer

- **Installer no longer crashes on launch.** The 1.2.0–1.2.2 Windows installer could start with `Error: Cannot find module 'find-up'`. The cause was a corrupt build-machine `node_modules` (several nested runtime packages had lost everything but their `package.json`), which was copied verbatim into the app. Rebuilt from a clean, complete dependency tree; a new build-time guard (`build/afterPack.js`) now fails the build if the packaged `app.asar` is ever missing a critical runtime module, so this can't ship again. _(The portable build was never affected.)_
- **Uninstaller no longer thinks the app is running when it isn't.** Because the app lives in the system tray, electron-builder's default "is it running?" check (a scan for any process under the install folder) could false-positive. The installer/uninstaller now closes the app by its exact executable name and proceeds, instead of nagging.

### Improved — Viewport

- **Settings opens on the Viewport tab in Viewport mode.** When a window is running as a Viewport, opening its settings now lands directly on the **Viewport** tab (rather than **Connection**) — the context you came to manage.

## [1.2.2] — 2026-08-02

### Improved — Viewport polish

- **"Reconnecting" overlay state** — if the adoption link drops while a Viewport is still waiting for a Live View, the overlay now shows **"Viewport offline — Reconnecting…"** instead of lingering on "assign a Live View."
- **Name-matches-model warning** — the Viewport settings now warn when you set the Device name to "UP Viewport" (Protect's default model name), which makes the rename look like it did nothing.
- **Quieter admin API** — the post-adopt rename now runs once per session instead of on every in-session reconnect (no more repeated bootstrap fetches).
- Fixed two dev-only spike scripts (`scripts/dev/adopt-*`) that passed no `dataDir` to the token mint.

## [1.2.1] — 2026-08-02

### Fixed / Improved — Viewport polish

- **Device name now shows in Protect.** After the Viewport adopts, the app renames it to your configured name (or the `<HOSTNAME>_VIEWPORT` default) via the Protect admin API — Protect otherwise names adopted viewers by model ("UP Viewport"). Best-effort and non-fatal; it never blocks adoption.
- **Clearer connecting state.** The loading overlay now shows **"Registering Viewport…"** and, once online without an assignment, **"Assign a Live View to it in Protect → Devices"** — instead of a generic, stuck "Connecting."
- **Remove from the app.** A **"Remove this Viewport from Protect"** button (Viewport settings, two-click confirm) deletes the device from the console, resets the local device identity, and turns Viewport mode off — which also clears the "can't re-add" state caused by a half-removed device.
- **UniFi OS CSRF.** Admin-API writes (rename/delete) now send the required `X-CSRF-Token` (read from the session cookie). A refused delete is reported honestly and makes no local changes, so it stays retryable.

## [1.2.0] — 2026-08-01

### Added — Viewport mode

Make a viewer window act like a **UniFi Protect Viewport**: it registers itself
with your Protect console as a Viewport device, and you **Share a Live View** to
it from Protect. The window then displays that Live View fullscreen and follows
whatever you re-share — natively, no polling.

- **Native device adoption** over the console's UCP device channel (mTLS
  WebSocket on port 7442). The first launch registers the device using an admin
  login; afterwards the device connection reconnects **without a password**,
  using a self-adopted identity (key + pinned certificate) stored on this
  machine. TLS is trust-on-first-use pinned per `host:port`.
- **Online status** — the adopted Viewport shows Online while the app is open,
  which also clears Protect's "X devices offline" banner.
- **Dedicated Viewport tab** in the configuration screen: enable Viewport mode,
  set the console URL + admin login, an optional device name
  (default `<HOSTNAME>_VIEWPORT`), and an optional fallback profile. Includes a
  "How Viewport mode works" explainer with the exact steps to share a Live View
  to the device.
- **Save & Restart** / **Save without restarting** controls; a discoverability
  pointer from the Connection tab.
- Viewport credentials are stored **encrypted on this device** (OS keychain via
  Electron `safeStorage`; where no keychain is available they are stored
  unencrypted with a clear in-app warning). The saved login is used to sign in
  to the Protect **web interface** on each launch — it is only ever sent to your
  own console.
- The real viewer IP is reported to Protect (via the `x-ip` header) instead of
  `127.0.0.1`.
- **Single-instance lock** — prevents duplicate zombie instances (and duplicate
  device adoption) after reload/restart.

### Notes

- Requires a UniFi OS console (UDM / UDM-Pro / UDM-SE / CloudKey Gen2+) running
  Protect **4.x – 7.x+**. Live-verified against Protect 7.1.87 on a UDM-PRO-SE.
- Terminology follows Protect's own UI ("Live View"), and setup copy avoids
  internal implementation detail.

### Build

- **Portable** (run-from-folder): `npm run build:win:x64:portable`
  (set a fixed `UPV_ENCRYPTION_KEY` for distributable portable builds).
- **Installer** (Windows NSIS `setup.exe`): `npm run build:win:installer`
  (adds electron-builder via `npx`; Wine is required when building on Linux).

[1.2.0]: https://github.com/clovisd/unifi-protect-viewer/releases/tag/v1.2.0
