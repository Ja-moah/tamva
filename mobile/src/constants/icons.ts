/**
 * TAMVA Icon System
 *
 * Built on a unified glyph set (Feather) for visual harmony.
 * Every icon in the product shares the same stroke weight (2px),
 * geometric restraint, and optical balance.
 */

import { Feather } from '@expo/vector-icons';

export type FeatherIconName = keyof typeof Feather.glyphMap;

export const Icons = {
  // Navigation
  home: 'home',
  passport: 'shield',
  activity: 'activity',
  consent: 'lock',
  profile: 'user',
  notifications: 'bell',
  menu: 'menu',

  // Actions
  add: 'plus',
  remove: 'minus',
  close: 'x',
  check: 'check',
  search: 'search',
  filter: 'sliders',
  sort: 'arrow-down',
  edit: 'edit-2',
  share: 'share-2',
  copy: 'copy',
  download: 'download',
  refresh: 'refresh-cw',
  moreVertical: 'more-vertical',
  moreHorizontal: 'more-horizontal',
  externalLink: 'external-link',

  // Chevrons & Arrows
  chevronRight: 'chevron-right',
  chevronLeft: 'chevron-left',
  chevronDown: 'chevron-down',
  chevronUp: 'chevron-up',
  arrowUpRight: 'arrow-up-right',
  arrowDownLeft: 'arrow-down-left',
  arrowUp: 'arrow-up',
  arrowDown: 'arrow-down',

  // Financial & Security
  creditCard: 'credit-card',
  wallet: 'pocket',
  bank: 'dollar-sign',
  trendingUp: 'trending-up',
  trendingDown: 'trending-down',
  eye: 'eye',
  eyeOff: 'eye-off',
  key: 'key',
  shieldCheck: 'shield',
  alertCircle: 'alert-circle',
  alertTriangle: 'alert-triangle',
  info: 'info',
  helpCircle: 'help-circle',

  // Status & Categories
  checkCircle: 'check-circle',
  xCircle: 'x-circle',
  clock: 'clock',
  calendar: 'calendar',
  shoppingBag: 'shopping-bag',
  coffee: 'coffee',
  briefcase: 'briefcase',
  send: 'send',
} as const satisfies Record<string, FeatherIconName>;

export type IconName = keyof typeof Icons;
