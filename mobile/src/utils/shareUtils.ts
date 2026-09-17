/**
 * TAMVA Financial Passport Share Utilities
 *
 * Provides accurate expiration calculation, typed status resolution,
 * and semantic badges for share records.
 */

import { PassportShareRecord } from '../types/passport';
import { BadgeTone } from '../components/ui/Badge';

export interface ShareStatusInfo {
  isExpired: boolean;
  isRevoked: boolean;
  isActive: boolean;
  isUntilRevoked: boolean;
  statusLabel: string;
  badgeTone: BadgeTone;
  expiryDisplay: string;
  countdownText: string;
}

export function getShareStatusInfo(share: PassportShareRecord): ShareStatusInfo {
  // 1. Manually revoked state takes absolute precedence
  if (share.status === 'revoked') {
    return {
      isExpired: false,
      isRevoked: true,
      isActive: false,
      isUntilRevoked: false,
      statusLabel: 'Revoked',
      badgeTone: 'neutral',
      expiryDisplay: 'Access revoked',
      countdownText: 'Revoked',
    };
  }

  // 2. Until revoked duration has no automatic expiration
  if (share.durationId === 'until_revoked') {
    return {
      isExpired: false,
      isRevoked: false,
      isActive: true,
      isUntilRevoked: true,
      statusLabel: 'Active',
      badgeTone: 'success',
      expiryDisplay: 'Valid until manually revoked',
      countdownText: 'No auto-expiry',
    };
  }

  // 3. Date-based calculation
  const now = Date.now();
  const expireTime = share.expiresAtTimestamp;

  if (expireTime !== undefined && expireTime <= now) {
    return {
      isExpired: true,
      isRevoked: false,
      isActive: false,
      isUntilRevoked: false,
      statusLabel: 'Expired',
      badgeTone: 'warning',
      expiryDisplay: `Expired on ${share.expiresAt}`,
      countdownText: 'Expired',
    };
  }

  if (expireTime !== undefined) {
    const diffMs = expireTime - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        isExpired: false,
        isRevoked: false,
        isActive: true,
        isUntilRevoked: false,
        statusLabel: 'Expires Today',
        badgeTone: 'warning',
        expiryDisplay: `Expires today (${share.expiresAt})`,
        countdownText: 'Expires today',
      };
    }

    if (diffDays === 1) {
      return {
        isExpired: false,
        isRevoked: false,
        isActive: true,
        isUntilRevoked: false,
        statusLabel: '1 Day Left',
        badgeTone: 'warning',
        expiryDisplay: `Expires tomorrow (${share.expiresAt})`,
        countdownText: '1 day left',
      };
    }

    return {
      isExpired: false,
      isRevoked: false,
      isActive: true,
      isUntilRevoked: false,
      statusLabel: 'Active',
      badgeTone: 'success',
      expiryDisplay: `Expires ${share.expiresAt}`,
      countdownText: `${diffDays} days left`,
    };
  }

  // Fallback if timestamp is omitted
  return {
    isExpired: share.status === 'expired',
    isRevoked: false,
    isActive: share.status === 'active',
    isUntilRevoked: false,
    statusLabel: share.status === 'active' ? 'Active' : 'Expired',
    badgeTone: share.status === 'active' ? 'success' : 'warning',
    expiryDisplay: `Expires ${share.expiresAt}`,
    countdownText: share.expiresAt,
  };
}
