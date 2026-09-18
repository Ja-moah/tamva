/**
 * TAMVA Brand Registry & Asset Mapping
 *
 * Centralized brand registry providing official logos for financial institutions,
 * mobile money providers, and utilities across Ghana.
 *
 * Zero-dependency: uses React Native ImageSourcePropType with transparent PNGs.
 */

import { ImageSourcePropType } from 'react-native';

export type BrandKey =
  | 'gcb'
  | 'stanbic'
  | 'calbank'
  | 'mtn'
  | 'telecel'
  | 'absa'
  | 'ecobank'
  | 'ecg'
  | 'gwcl';

export interface BrandMetadata {
  key: BrandKey;
  displayName: string;
  category: 'bank' | 'mobile_money' | 'utility';
  source: ImageSourcePropType;
  /** Optical scale adjustment to balance visual weight across differing aspect ratios */
  opticalScale?: number;
  /** Recommended container background color (defaults to surface) */
  containerBg?: string;
  /** Whether the asset has dark or light dominant elements */
  themeAdaptable?: boolean;
}

export const BRAND_ASSETS: Record<BrandKey, ImageSourcePropType> = {
  gcb: require('../../assets/brands/financial/gcb-bank.png'),
  calbank: require('../../assets/brands/financial/calbank.png'),
  stanbic: require('../../assets/brands/financial/Stanbic.png'),
  absa: require('../../assets/brands/financial/absa.png'),
  ecobank: require('../../assets/brands/financial/Ecobank.png'),
  mtn: require('../../assets/brands/telecom/mtn-mobile-money.png'),
  telecel: require('../../assets/brands/telecom/telecel-cash.png'),
  ecg: require('../../assets/brands/utilities/ecg.png'),
  gwcl: require('../../assets/brands/utilities/GWCL.png'),
};

export const BRAND_DIRECTORY: Record<BrandKey, BrandMetadata> = {
  gcb: {
    key: 'gcb',
    displayName: 'GCB Bank PLC',
    category: 'bank',
    source: BRAND_ASSETS.gcb,
    opticalScale: 0.76,
  },
  stanbic: {
    key: 'stanbic',
    displayName: 'Stanbic Bank Ghana',
    category: 'bank',
    source: BRAND_ASSETS.stanbic,
    opticalScale: 0.88,
    containerBg: '#06427A',
  },
  calbank: {
    key: 'calbank',
    displayName: 'CalBank PLC',
    category: 'bank',
    source: BRAND_ASSETS.calbank,
    opticalScale: 0.82,
  },
  absa: {
    key: 'absa',
    displayName: 'Absa Bank Ghana',
    category: 'bank',
    source: BRAND_ASSETS.absa,
    opticalScale: 0.78,
  },
  ecobank: {
    key: 'ecobank',
    displayName: 'Ecobank Ghana',
    category: 'bank',
    source: BRAND_ASSETS.ecobank,
    opticalScale: 0.84,
  },
  mtn: {
    key: 'mtn',
    displayName: 'MTN Mobile Money',
    category: 'mobile_money',
    source: BRAND_ASSETS.mtn,
    opticalScale: 0.82,
  },
  telecel: {
    key: 'telecel',
    displayName: 'Telecel Cash',
    category: 'mobile_money',
    source: BRAND_ASSETS.telecel,
    opticalScale: 0.82,
  },
  ecg: {
    key: 'ecg',
    displayName: 'Electricity Company of Ghana (ECG)',
    category: 'utility',
    source: BRAND_ASSETS.ecg,
    opticalScale: 0.84,
  },
  gwcl: {
    key: 'gwcl',
    displayName: 'Ghana Water Company (GWCL)',
    category: 'utility',
    source: BRAND_ASSETS.gwcl,
    opticalScale: 0.84,
  },
};

/**
 * Normalizes an institution name, merchant label, or ID to a recognized BrandKey.
 * Returns null if no brand asset is mapped (triggering graceful icon fallback).
 */
export function normalizeBrandName(name?: string | null): BrandKey | null {
  if (!name) return null;
  const s = name.toLowerCase().trim();

  // 1. GCB Bank
  if (
    s.includes('gcb') ||
    s.includes('ghana commercial bank') ||
    s === 'cat-gcb' ||
    s === 'acc-001'
  ) {
    return 'gcb';
  }

  // 2. Stanbic Bank Ghana
  if (
    s.includes('stanbic') ||
    s === 'cat-stanbic' ||
    s === 'acc-002'
  ) {
    return 'stanbic';
  }

  // 3. CalBank PLC
  if (
    s.includes('calbank') ||
    s.includes('cal bank') ||
    s === 'cat-calbank' ||
    s === 'acc-004'
  ) {
    return 'calbank';
  }

  // 4. Absa Bank
  if (s.includes('absa') || s === 'cat-absa') {
    return 'absa';
  }

  // 5. Ecobank
  if (s.includes('ecobank') || s === 'cat-ecobank') {
    return 'ecobank';
  }

  // 6. MTN Mobile Money
  if (
    s.includes('mtn') ||
    s.includes('momo') ||
    s === 'cat-mtn' ||
    s === 'acc-003'
  ) {
    return 'mtn';
  }

  // 7. Telecel Cash / Broadband
  if (
    s.includes('telecel') ||
    s === 'cat-telecel' ||
    s === 'acc-005'
  ) {
    return 'telecel';
  }

  // 8. Electricity Company of Ghana (ECG)
  if (
    s.includes('ecg') ||
    s.includes('electricity company of ghana')
  ) {
    return 'ecg';
  }

  // 9. Ghana Water Company (GWCL)
  if (
    s.includes('gwcl') ||
    s.includes('ghana water')
  ) {
    return 'gwcl';
  }

  return null;
}

/**
 * Resolves an institution/merchant name to its official brand ImageSourcePropType.
 * Returns null if no official asset exists.
 */
export function getBrandAsset(name?: string | null): ImageSourcePropType | null {
  const key = normalizeBrandName(name);
  if (!key) return null;
  return BRAND_ASSETS[key] ?? null;
}

/**
 * Resolves complete brand metadata (including optical scale and display name) for an entity.
 */
export function getBrandMetadata(name?: string | null): BrandMetadata | null {
  const key = normalizeBrandName(name);
  if (!key) return null;
  return BRAND_DIRECTORY[key] ?? null;
}
