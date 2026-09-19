/**
 * TAMVA Financial Passport Hook
 *
 * Encapsulates state management, refresh cycles, share creation/revocation lifecycles,
 * single-active-share consistency, and demo QR presentation for the Financial Passport screen.
 */

import { useState, useCallback } from 'react';
import {
  FinancialPassportData,
  PassportStateMode,
  PassportShareRecord,
  PassportSharePurposeId,
  PassportShareScopeId,
  PassportShareDurationId,
} from '../types/passport';
import {
  mockFinancialPassportData,
  PASSPORT_SHARE_PURPOSES,
  PASSPORT_SHARE_DURATIONS,
  mockInitialShareHistory,
} from '../demo/data/mockPassportData';
import { useHaptics } from './useHaptics';

export interface UseFinancialPassportReturn {
  data: FinancialPassportData | null;
  stateMode: PassportStateMode;
  setStateMode: (mode: PassportStateMode) => void;
  isRefreshing: boolean;
  handleRefresh: () => Promise<void>;

  // Share Flow state & handlers
  isShareSheetVisible: boolean;
  openShareFlow: () => void;
  closeShareFlow: () => void;
  isCreatingShare: boolean;
  handleCreateShare: (
    purposeId: PassportSharePurposeId,
    scopes: PassportShareScopeId[],
    durationId: PassportShareDurationId,
    customNote?: string
  ) => Promise<PassportShareRecord>;

  // QR Modal state & handlers
  isQrSheetVisible: boolean;
  selectedShareForQr: PassportShareRecord | null;
  openQrView: (share?: PassportShareRecord | null) => void;
  closeQrView: () => void;

  // Revoke Flow state & handlers
  isRevokeSheetVisible: boolean;
  isRevoking: boolean;
  selectedShareForRevoke: PassportShareRecord | null;
  openRevokeFlow: (share: PassportShareRecord) => void;
  closeRevokeFlow: () => void;
  handleConfirmRevoke: () => Promise<void>;

  // Active Share & History
  activeShare: PassportShareRecord | null;
  shareHistory: PassportShareRecord[];
}

export function useFinancialPassport(
  initialMode: PassportStateMode = 'loaded'
): UseFinancialPassportReturn {
  const [stateMode, setStateMode] = useState<PassportStateMode>(initialMode);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const haptics = useHaptics();

  // Active share & history state
  const [activeShare, setActiveShare] = useState<PassportShareRecord | null>(null);
  const [shareHistory, setShareHistory] = useState<PassportShareRecord[]>(
    mockInitialShareHistory
  );

  // Modals & BottomSheets visibility
  const [isShareSheetVisible, setIsShareSheetVisible] = useState<boolean>(false);
  const [isCreatingShare, setIsCreatingShare] = useState<boolean>(false);
  const [isQrSheetVisible, setIsQrSheetVisible] = useState<boolean>(false);
  const [selectedShareForQr, setSelectedShareForQr] = useState<PassportShareRecord | null>(null);

  const [isRevokeSheetVisible, setIsRevokeSheetVisible] = useState<boolean>(false);
  const [isRevoking, setIsRevoking] = useState<boolean>(false);
  const [selectedShareForRevoke, setSelectedShareForRevoke] = useState<PassportShareRecord | null>(null);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    haptics.lightImpact();

    try {
      // Simulate light async network refresh
      await new Promise((resolve) => setTimeout(resolve, 800));
      haptics.success();
    } catch {
      haptics.error();
    } finally {
      setIsRefreshing(false);
    }
  }, [haptics]);

  const openShareFlow = useCallback(() => {
    haptics.lightImpact();
    setIsShareSheetVisible(true);
  }, [haptics]);

  const closeShareFlow = useCallback(() => {
    setIsShareSheetVisible(false);
  }, []);

  const openQrView = useCallback(
    (share?: PassportShareRecord | null) => {
      haptics.lightImpact();
      setSelectedShareForQr(share || activeShare);
      setIsQrSheetVisible(true);
    },
    [activeShare, haptics]
  );

  const closeQrView = useCallback(() => {
    setIsQrSheetVisible(false);
    setSelectedShareForQr(null);
  }, []);

  const openRevokeFlow = useCallback(
    (share: PassportShareRecord) => {
      haptics.warning();
      setSelectedShareForRevoke(share);
      setIsRevokeSheetVisible(true);
    },
    [haptics]
  );

  const closeRevokeFlow = useCallback(() => {
    if (isRevoking) return;
    setIsRevokeSheetVisible(false);
    setSelectedShareForRevoke(null);
  }, [isRevoking]);

  const handleCreateShare = useCallback(
    async (
      purposeId: PassportSharePurposeId,
      scopes: PassportShareScopeId[],
      durationId: PassportShareDurationId,
      customNote?: string
    ): Promise<PassportShareRecord> => {
      // Prevent repeated taps during processing
      if (isCreatingShare) {
        if (activeShare) return activeShare;
        throw new Error('Share creation already in progress.');
      }

      setIsCreatingShare(true);
      haptics.mediumImpact();

      try {
        // Simulate brief processing delay
        await new Promise((resolve) => setTimeout(resolve, 750));

        const purposeItem = PASSPORT_SHARE_PURPOSES.find((p) => p.id === purposeId);
        const durationItem = PASSPORT_SHARE_DURATIONS.find((d) => d.id === durationId);

        // Accurate date and timestamp calculation
        const now = new Date();
        const createdTimestamp = now.getTime();
        const createdStr = `${now.getDate()} ${now.toLocaleString('default', {
          month: 'short',
        })} ${now.getFullYear()}`;

        let expiresTimestamp: number | undefined = undefined;
        let expiresStr = 'Until Manually Revoked';

        if (durationItem?.days) {
          const expireDate = new Date(now.getTime() + durationItem.days * 24 * 60 * 60 * 1000);
          expiresTimestamp = expireDate.getTime();
          expiresStr = `${expireDate.getDate()} ${expireDate.toLocaleString('default', {
            month: 'short',
          })} ${expireDate.getFullYear()}`;
        }

        const randomSuffix = Math.floor(10000 + Math.random() * 90000);
        const shareId = `SHR-${randomSuffix}-TVA`;

        const newRecord: PassportShareRecord = {
          id: shareId,
          purposeId,
          purposeLabel: purposeItem?.label || 'General Verification',
          customPurposeNote: customNote || undefined,
          scopes,
          durationId,
          durationLabel: durationItem?.label || '30 Days',
          createdAt: createdStr,
          expiresAt: expiresStr,
          createdAtTimestamp: createdTimestamp,
          expiresAtTimestamp: expiresTimestamp,
          status: 'active',
          demoQrCode: `tamva-demo://share/${shareId}`,
          shareUrl: `https://demo.tamva.com/share/${shareId}`,
        };

        // State consistency rule: Only ONE active share permitted at a time.
        // If an active share existed, supersede it in history so it is no longer marked active.
        setActiveShare(newRecord);
        setShareHistory((prev) => {
          const superseded = prev.map((item) =>
            item.status === 'active' ? { ...item, status: 'revoked' as const } : item
          );
          return [newRecord, ...superseded];
        });

        haptics.success();
        return newRecord;
      } finally {
        setIsCreatingShare(false);
      }
    },
    [activeShare, isCreatingShare, haptics]
  );

  const handleConfirmRevoke = useCallback(async () => {
    if (!selectedShareForRevoke || isRevoking) return;

    setIsRevoking(true);
    haptics.mediumImpact();

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const revokedId = selectedShareForRevoke.id;
      if (activeShare?.id === revokedId) {
        setActiveShare(null);
      }

      setShareHistory((prev) =>
        prev.map((item) =>
          item.id === revokedId ? { ...item, status: 'revoked' as const } : item
        )
      );

      setIsRevokeSheetVisible(false);
      setSelectedShareForRevoke(null);
      haptics.success();
    } finally {
      setIsRevoking(false);
    }
  }, [activeShare, isRevoking, selectedShareForRevoke, haptics]);

  const resolveData = (): FinancialPassportData | null => {
    switch (stateMode) {
      case 'loaded':
        return {
          ...mockFinancialPassportData,
          activeShare,
          shareHistory,
        };
      case 'loading':
      case 'empty':
      case 'error':
      default:
        return null;
    }
  };

  return {
    data: resolveData(),
    stateMode,
    setStateMode,
    isRefreshing,
    handleRefresh,
    isShareSheetVisible,
    openShareFlow,
    closeShareFlow,
    isCreatingShare,
    handleCreateShare,
    isQrSheetVisible,
    selectedShareForQr,
    openQrView,
    closeQrView,
    isRevokeSheetVisible,
    isRevoking,
    selectedShareForRevoke,
    openRevokeFlow,
    closeRevokeFlow,
    handleConfirmRevoke,
    activeShare,
    shareHistory,
  };
}
