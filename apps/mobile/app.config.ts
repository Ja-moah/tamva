/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { ExpoConfig } from 'expo/config';

/**
 * One config, three variants. `APP_VARIANT` (set per EAS build profile) selects the
 * display name and the application identifiers so development, staging and
 * production builds can be installed side by side.
 *
 * Application identifiers are permanent once an app is published to a store. The
 * defaults below are placeholders: confirm them (or override with
 * TAMVA_ANDROID_PACKAGE / TAMVA_IOS_BUNDLE_ID) before the first store submission.
 */
type Variant = 'development' | 'staging' | 'production';
const variant = (process.env.APP_VARIANT ?? 'development') as Variant;
if (!['development', 'staging', 'production'].includes(variant)) {
  throw new Error(`APP_VARIANT must be development, staging or production (got "${variant}")`);
}

const baseId = process.env.TAMVA_ANDROID_PACKAGE ?? 'com.tamva.app';
const baseBundle = process.env.TAMVA_IOS_BUNDLE_ID ?? baseId;
const suffix = variant === 'production' ? '' : `.${variant}`;
const label = variant === 'production' ? 'TAMVA' : `TAMVA (${variant})`;

// The marketing version is the repository VERSION file, so every surface reports one number.
const version = readFileSync(resolve(__dirname, '../../VERSION'), 'utf8').trim();
const buildNumber = Number(process.env.TAMVA_BUILD_NUMBER ?? '1');

const config: ExpoConfig = {
  name: label,
  slug: 'TAMVA',
  scheme: 'tamva',
  version,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: `${baseBundle}${suffix}`,
    buildNumber: String(buildNumber),
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: `${baseId}${suffix}`,
    versionCode: buildNumber,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
  plugins: ['expo-router', 'expo-font', 'expo-asset'],
};

export default config;
