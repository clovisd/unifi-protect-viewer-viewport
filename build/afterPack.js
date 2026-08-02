'use strict';
/**
 * @file build/afterPack.js
 * @description electron-builder afterPack hook — a completeness guard for the
 * packaged app.asar.
 *
 * WHY THIS EXISTS: v1.2.0–1.2.2 shipped an installer that crashed on launch
 * with "Cannot find module 'find-up'". Root cause was NOT electron-builder — the
 * build machine's node_modules was corrupt: several deeply-nested transitive
 * packages (electron-store → conf → pkg-up → find-up → locate-path → …) had lost
 * every file except package.json, so their entry `index.js` was missing.
 * electron-builder faithfully copied the sparse source into the asar, and the app
 * threw at startup when `require('find-up')` found the manifest but no code.
 *
 * This hook fails the build LOUDLY if any of those critical runtime entry files
 * is absent from the produced app.asar, so a corrupt node_modules can never
 * silently ship again. It is intentionally targeted (a curated list) rather than
 * a blanket "every package.json needs a main" scan, which would false-positive on
 * legitimately metadata-only packages.
 */

const path = require('node:path');

// Runtime entry files that MUST be present for the app to boot. Matched by path
// suffix so it works whether npm/electron-builder placed the package top-level
// (hoisted) or nested. Verified against a complete node_modules tree.
const REQUIRED_ENTRY_SUFFIXES = [
  'node_modules/electron-store/index.js',
  'node_modules/conf/dist/source/index.js',
  'node_modules/pkg-up/index.js',
  'node_modules/find-up/index.js',
  'node_modules/locate-path/index.js',
  'node_modules/path-exists/index.js',
  'node_modules/p-locate/index.js',
  'node_modules/p-limit/index.js',
];

exports.default = async function afterPack(context) {
  const asarPath = path.join(context.appOutDir, 'resources', 'app.asar');

  let asar;
  try {
    // electron-builder bundles @electron/asar; it is also a project dependency
    // (via electron-packager). If it cannot be loaded we WARN rather than block —
    // an unloadable tool is not evidence of a bad build.
    asar = require('@electron/asar');
  } catch (e) {
    console.warn(
      `[afterPack guard] @electron/asar not loadable (${e.message}); skipping asar completeness check.`,
    );
    return;
  }

  let entries;
  try {
    entries = asar.listPackage(asarPath); // array of '/'-prefixed paths
  } catch (e) {
    throw new Error(`[afterPack guard] could not read ${asarPath}: ${e.message}`);
  }

  const normalized = entries.map((p) => p.replace(/\\/g, '/'));
  const missing = REQUIRED_ENTRY_SUFFIXES.filter(
    (suffix) => !normalized.some((p) => p.endsWith('/' + suffix) || p.endsWith(suffix)),
  );

  if (missing.length) {
    throw new Error(
      '[afterPack guard] app.asar is missing critical runtime module files ' +
        '(corrupt/sparse node_modules — run a clean `npm ci` and rebuild):\n  - ' +
        missing.join('\n  - '),
    );
  }

  console.log(
    `[afterPack guard] OK — all ${REQUIRED_ENTRY_SUFFIXES.length} critical runtime entry files present in app.asar.`,
  );
};
