const { getDefaultConfig } = require('expo/metro-config');

/**
 * Windows file-watcher fix.
 *
 * Expo's `@expo/metro-file-map` ships a `NativeWatcher` — one recursive `fs.watch`, which uses
 * ReadDirectoryChangesW on Windows — but `NativeWatcher.isSupported()` only allows macOS. Windows
 * therefore falls back to `FallbackWatcher`, which holds a handle per directory (`node_modules`
 * included). With a normal app that is thousands of handles, so the dev server dies with
 * "EMFILE: too many open files" and the cache writer cannot open its temp files.
 *
 * https://github.com/expo/expo/issues/52326
 *
 * The override is guarded: if an SDK upgrade changes the internal path or removes the static
 * method, Metro keeps its default watcher instead of failing to start.
 */
if (process.platform === 'win32') {
  try {
    const NativeWatcher = require('@expo/metro-file-map/build/watchers/NativeWatcher').default;
    if (NativeWatcher && typeof NativeWatcher.isSupported === 'function') {
      NativeWatcher.isSupported = () => true;
    }
  } catch {
    // Internal API moved; the default watcher still works, just with more handles.
  }
}

/** @type {import('@expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fewer parallel workers means fewer files open at once on low-limit Windows machines.
if (process.platform === 'win32') {
  config.maxWorkers = Math.min(config.maxWorkers ?? 4, 4);
}

// Local QA artifacts live under `.expo/qa` (headless-Chrome profiles, logs, screenshots).
// Chrome's profile `LOCK` files are ACL-locked on Windows, so watching them makes the dev
// server crash with `EPERM: operation not permitted, lstat`. Keep the whole folder out of Metro.
const existingBlockList = config.resolver.blockList
  ? Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : [config.resolver.blockList]
  : [];
config.resolver.blockList = [...existingBlockList, /\.expo[\\/]qa[\\/]/];

module.exports = config;
