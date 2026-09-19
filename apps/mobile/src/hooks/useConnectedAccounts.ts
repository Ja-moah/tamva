/**
 * TAMVA useConnectedAccounts Hook
 *
 * Comprehensive state management for Connected Accounts & Consent experience:
 * - Handles screen state modes (loaded, loading, empty, error)
 * - Manages account list, selected account for detail inspection
 * - Manages connection flow (Institution Picker -> Consent Review -> Success Result)
 * - Manages consent modifications (ManageConsentSheet -> Save changes with no-op check)
 * - Manages destructive disconnection flow (DisconnectConfirmSheet -> Revocation)
 * - Manages reconnection flow for previously disconnected accounts
 * - Manages connection review for action_required accounts
 * - Pull-to-refresh simulation with haptics
 * - Account synchronization simulation with state guards and haptics
 */

import { useState, useCallback, useMemo } from 'react';
import {
  ConnectedAccount,
  AccountsStateMode,
  ConsentedScope,
  ConsentDuration,
  InstitutionCatalogItem,
} from '../types/accounts';
import {
  mockConnectedAccountsData,
  mockEmptyConnectedAccountsData,
  DEFAULT_CONSENT_PURPOSE,
  INSTITUTION_CATALOG,
} from '../demo/data/mockConnectedAccountsData';
import { useHaptics } from './useHaptics';
import { useToast } from '../components/ui/Toast';

export function useConnectedAccounts() {
  const haptics = useHaptics();
  const { showToast } = useToast();

  const [stateMode, setStateMode] = useState<AccountsStateMode>('loaded');
  const [accounts, setAccounts] = useState<ConnectedAccount[]>(
    mockConnectedAccountsData.accounts
  );

  // Selected account for detail bottom sheet inspection
  const [selectedAccount, setSelectedAccount] = useState<ConnectedAccount | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Flow 1: Connection Modal States
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isConsentReviewVisible, setIsConsentReviewVisible] = useState(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [selectedInstitutionForConnect, setSelectedInstitutionForConnect] =
    useState<InstitutionCatalogItem | null>(null);
  const [justConnectedAccount, setJustConnectedAccount] =
    useState<ConnectedAccount | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Flow 2: Consent Management Modal States
  const [isManageConsentVisible, setIsManageConsentVisible] = useState(false);
  const [targetAccountForManage, setTargetAccountForManage] =
    useState<ConnectedAccount | null>(null);

  // Flow 3: Disconnect Confirmation Modal States
  const [isDisconnectConfirmVisible, setIsDisconnectConfirmVisible] = useState(false);
  const [targetAccountForDisconnect, setTargetAccountForDisconnect] =
    useState<ConnectedAccount | null>(null);

  // Active accounts according to stateMode
  const currentAccounts = useMemo(() => {
    if (stateMode === 'empty' || stateMode === 'error') {
      return [];
    }
    return accounts;
  }, [stateMode, accounts]);

  // Derived summary
  const summary = useMemo(() => {
    if (stateMode === 'empty') {
      return mockEmptyConnectedAccountsData.summary;
    }

    const total = currentAccounts.filter((a) => a.status !== 'disconnected').length;
    const active = currentAccounts.filter((a) => a.status === 'connected').length;
    const attention = currentAccounts.filter(
      (a) => a.status === 'action_required'
    ).length;

    return {
      totalConnected: total,
      activeCount: active,
      attentionCount: attention,
      lastGlobalSync: total > 0 ? '5 min ago' : 'Never',
    };
  }, [stateMode, currentAccounts]);

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    haptics.lightImpact();

    setTimeout(() => {
      setIsRefreshing(false);
      haptics.success();
    }, 850);
  }, [haptics]);

  // Account selection for detail preview
  const handleSelectAccount = useCallback(
    (account: ConnectedAccount) => {
      haptics.lightImpact();
      setSelectedAccount(account);
    },
    [haptics]
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedAccount(null);
  }, []);

  // ----------------------------------------------------
  // CONNECTION FLOW HANDLERS
  // ----------------------------------------------------

  const openConnectFlow = useCallback(() => {
    haptics.lightImpact();
    setIsPickerVisible(true);
  }, [haptics]);

  const closePicker = useCallback(() => {
    setIsPickerVisible(false);
  }, []);

  const handleSelectInstitution = useCallback(
    (institution: InstitutionCatalogItem) => {
      setSelectedInstitutionForConnect(institution);
      setIsPickerVisible(false);
      setIsConsentReviewVisible(true);
    },
    []
  );

  const closeConsentReview = useCallback(() => {
    setIsConsentReviewVisible(false);
    setSelectedInstitutionForConnect(null);
  }, []);

  const handleConfirmConsent = useCallback(
    (
      institution: InstitutionCatalogItem,
      grantedScopes: ConsentedScope[],
      duration: ConsentDuration
    ) => {
      setIsConnecting(true);
      haptics.lightImpact();

      setTimeout(() => {
        // Build or update mock ConnectedAccount
        const newAccount: ConnectedAccount = {
          id: `acc-${Date.now()}`,
          institutionName: institution.name,
          institutionType: institution.type,
          accountType: institution.defaultAccountType,
          maskedIdentifier: institution.mockIdentifier,
          status: 'connected',
          lastSyncedAt: 'Just now',
          currency: 'GHS',
          balance: institution.mockBalance,
          icon: institution.icon,
          consentedScopes: grantedScopes,
          connectedSince: '14 Sep 2026',
          consent: {
            purpose: DEFAULT_CONSENT_PURPOSE,
            grantedScopes,
            duration,
            grantedAt: '14 Sep 2026',
          },
        };

        // Add to state, replacing if existing was disconnected or reconnected
        setAccounts((prev) => {
          const filtered = prev.filter(
            (a) => a.institutionName.toLowerCase() !== institution.name.toLowerCase()
          );
          return [newAccount, ...filtered];
        });

        setStateMode((prev) => (prev === 'empty' ? 'loaded' : prev));
        setIsConnecting(false);
        setIsConsentReviewVisible(false);
        setSelectedInstitutionForConnect(null);
        setJustConnectedAccount(newAccount);
        setIsSuccessVisible(true);
        haptics.success();

        showToast({
          type: 'success',
          title: 'Account Connected',
          message: `${institution.name} linked with read-only access.`,
          duration: 3000,
        });
      }, 1100);
    },
    [haptics, showToast]
  );

  const closeSuccess = useCallback(() => {
    setIsSuccessVisible(false);
    setJustConnectedAccount(null);
  }, []);

  const handleViewJustConnectedAccount = useCallback(
    (account: ConnectedAccount) => {
      setIsSuccessVisible(false);
      setJustConnectedAccount(null);
      setSelectedAccount(account);
    },
    []
  );

  // ----------------------------------------------------
  // RECONNECT EXPERIENCE (Section 3)
  // ----------------------------------------------------

  const handleReconnect = useCallback(
    (accountId: string) => {
      const target = accounts.find((a) => a.id === accountId);
      if (!target) return;

      haptics.lightImpact();
      setSelectedAccount(null);

      // Find or construct matching catalog item
      const catalogItem =
        INSTITUTION_CATALOG.find(
          (item) =>
            item.name.toLowerCase() === target.institutionName.toLowerCase()
        ) || {
          id: `cat-${target.id}`,
          name: target.institutionName,
          type: target.institutionType,
          icon: target.icon,
          categoryLabel: target.accountType,
          defaultAccountType: target.accountType,
          mockIdentifier: target.maskedIdentifier,
          mockBalance: target.balance ?? 1500,
          supportedScopes: [
            'account_identity',
            'balances',
            'transaction_history',
            'income_verification',
          ],
        };

      setSelectedInstitutionForConnect(catalogItem);
      setIsConsentReviewVisible(true);
    },
    [accounts, haptics]
  );

  // ----------------------------------------------------
  // ACTION REQUIRED REVIEW (Section 4)
  // ----------------------------------------------------

  const handleReviewConnection = useCallback(
    (accountId: string) => {
      const target = accounts.find((a) => a.id === accountId);
      if (!target) return;

      haptics.lightImpact();

      // Show immediate verifying state
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId
            ? {
                ...acc,
                status: 'syncing',
                statusMessage: 'Verifying credentials with provider...',
                lastSyncedAt: 'Verifying...',
              }
            : acc
        )
      );

      setSelectedAccount((prev) =>
        prev && prev.id === accountId
          ? {
              ...prev,
              status: 'syncing',
              statusMessage: 'Verifying credentials with provider...',
              lastSyncedAt: 'Verifying...',
            }
          : prev
      );

      // Simulate verification delay
      setTimeout(() => {
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === accountId
              ? {
                  ...acc,
                  status: 'connected',
                  statusMessage: undefined,
                  lastSyncedAt: 'Just now',
                  consent: acc.consent ? { ...acc.consent, isExpired: false } : undefined,
                }
              : acc
          )
        );

        setSelectedAccount((prev) =>
          prev && prev.id === accountId
            ? {
                ...prev,
                status: 'connected',
                statusMessage: undefined,
                lastSyncedAt: 'Just now',
                consent: prev.consent ? { ...prev.consent, isExpired: false } : undefined,
              }
            : prev
        );

        haptics.success();
        showToast({
          type: 'success',
          title: 'Connection Verified',
          message: `Re-authenticated with ${target.institutionName} successfully.`,
          duration: 3000,
        });
      }, 1200);
    },
    [accounts, haptics, showToast]
  );

  // ----------------------------------------------------
  // CONSENT SCOPES MANAGEMENT
  // ----------------------------------------------------

  const openManageConsent = useCallback(
    (accountId: string) => {
      const target = accounts.find((a) => a.id === accountId);
      if (target) {
        haptics.selection();
        setTargetAccountForManage(target);
        setIsManageConsentVisible(true);
      }
    },
    [accounts, haptics]
  );

  const closeManageConsent = useCallback(() => {
    setIsManageConsentVisible(false);
    setTargetAccountForManage(null);
  }, []);

  const handleSaveConsentChanges = useCallback(
    (
      accountId: string,
      newScopes: ConsentedScope[],
      newDuration: ConsentDuration
    ) => {
      const target = accounts.find((a) => a.id === accountId);
      if (!target) return;

      // Check for unchanged permissions (Edge Case 6)
      const currentScopes = target.consentedScopes ?? [];
      const currentDuration = target.consent?.duration ?? '90_days';
      const isScopesIdentical =
        currentScopes.length === newScopes.length &&
        currentScopes.every((s) => newScopes.includes(s));
      const isDurationIdentical = currentDuration === newDuration;

      if (isScopesIdentical && isDurationIdentical) {
        haptics.lightImpact();
        showToast({
          type: 'info',
          title: 'No Changes',
          message: 'Consent permissions are already up to date.',
          duration: 2000,
        });
        return;
      }

      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id !== accountId) return acc;

          const updated: ConnectedAccount = {
            ...acc,
            consentedScopes: newScopes,
            consent: {
              purpose: acc.consent?.purpose ?? DEFAULT_CONSENT_PURPOSE,
              grantedScopes: newScopes,
              duration: newDuration,
              grantedAt: acc.consent?.grantedAt ?? acc.connectedSince,
            },
          };
          return updated;
        })
      );

      // Keep active inspection modal updated
      setSelectedAccount((prev) => {
        if (!prev || prev.id !== accountId) return prev;
        return {
          ...prev,
          consentedScopes: newScopes,
          consent: {
            purpose: prev.consent?.purpose ?? DEFAULT_CONSENT_PURPOSE,
            grantedScopes: newScopes,
            duration: newDuration,
            grantedAt: prev.consent?.grantedAt ?? prev.connectedSince,
          },
        };
      });

      haptics.success();
      showToast({
        type: 'success',
        title: 'Consent Updated',
        message: 'Your revised permission scopes were saved successfully.',
        duration: 2500,
      });
    },
    [accounts, haptics, showToast]
  );

  // ----------------------------------------------------
  // DISCONNECT CONFIRMATION FLOW
  // ----------------------------------------------------

  const openDisconnectConfirm = useCallback(
    (accountId: string) => {
      const target = accounts.find((a) => a.id === accountId);
      if (target) {
        haptics.warning();
        setTargetAccountForDisconnect(target);
        setIsDisconnectConfirmVisible(true);
      }
    },
    [accounts, haptics]
  );

  const closeDisconnectConfirm = useCallback(() => {
    setIsDisconnectConfirmVisible(false);
    setTargetAccountForDisconnect(null);
  }, []);

  const handleConfirmDisconnect = useCallback(
    (accountId: string) => {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id !== accountId) return acc;

          return {
            ...acc,
            status: 'disconnected',
            statusMessage: 'Consent revoked. Access discontinued.',
            lastSyncedAt: 'Disconnected',
            consent: acc.consent
              ? {
                  ...acc.consent,
                  revokedAt: '14 Sep 2026',
                }
              : undefined,
          };
        })
      );

      // Update inspection modal or close if disconnected
      setSelectedAccount((prev) => {
        if (!prev || prev.id !== accountId) return prev;
        return {
          ...prev,
          status: 'disconnected',
          statusMessage: 'Consent revoked. Access discontinued.',
          lastSyncedAt: 'Disconnected',
        };
      });

      haptics.warning();
      showToast({
        type: 'warning',
        title: 'Institution Disconnected',
        message: 'TAMVA will no longer synchronize or access this account.',
        duration: 3000,
      });
    },
    [haptics, showToast]
  );

  // ----------------------------------------------------
  // SYNCHRONIZATION ACTION (Edge Cases 1 & 9)
  // ----------------------------------------------------

  const handleSyncAccount = useCallback(
    (accountId: string) => {
      const target = accounts.find((a) => a.id === accountId);
      if (!target) return;

      // Guard 1: Already syncing
      if (target.status === 'syncing') {
        return;
      }

      // Guard 2: Disconnected
      if (target.status === 'disconnected') {
        showToast({
          type: 'warning',
          title: 'Cannot Synchronize',
          message: 'This account has been disconnected. Reconnect to resume sync.',
          duration: 3000,
        });
        return;
      }

      // Guard 3: Action Required
      if (target.status === 'action_required') {
        showToast({
          type: 'warning',
          title: 'Re-authentication Required',
          message: 'Please review your connection before attempting to synchronize.',
          duration: 3000,
        });
        return;
      }

      haptics.lightImpact();

      // Set syncing
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId
            ? { ...acc, status: 'syncing', lastSyncedAt: 'Syncing in progress...' }
            : acc
        )
      );

      setSelectedAccount((prev) =>
        prev && prev.id === accountId
          ? { ...prev, status: 'syncing', lastSyncedAt: 'Syncing in progress...' }
          : prev
      );

      // Simulate completed sync
      setTimeout(() => {
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === accountId
              ? {
                  ...acc,
                  status: 'connected',
                  statusMessage: undefined,
                  lastSyncedAt: 'Just now',
                }
              : acc
          )
        );

        setSelectedAccount((prev) =>
          prev && prev.id === accountId
            ? {
                ...prev,
                status: 'connected',
                statusMessage: undefined,
                lastSyncedAt: 'Just now',
              }
            : prev
        );

        haptics.success();
      }, 1400);
    },
    [accounts, haptics, showToast]
  );

  return {
    stateMode,
    setStateMode,
    accounts: currentAccounts,
    rawAccounts: accounts,
    summary,
    selectedAccount,
    setSelectedAccount,
    handleSelectAccount,
    handleCloseDetail,
    isRefreshing,
    handleRefresh,
    // Connection Flow
    isPickerVisible,
    openConnectFlow,
    closePicker,
    selectedInstitutionForConnect,
    handleSelectInstitution,
    isConsentReviewVisible,
    closeConsentReview,
    handleConfirmConsent,
    isConnecting,
    isSuccessVisible,
    justConnectedAccount,
    closeSuccess,
    handleViewJustConnectedAccount,
    // Manage Consent Flow
    isManageConsentVisible,
    targetAccountForManage,
    openManageConsent,
    closeManageConsent,
    handleSaveConsentChanges,
    // Disconnect Flow
    isDisconnectConfirmVisible,
    targetAccountForDisconnect,
    openDisconnectConfirm,
    closeDisconnectConfirm,
    handleConfirmDisconnect,
    // Reconnect & Review Actions
    handleReconnect,
    handleReviewConnection,
    // Sync
    handleSyncAccount,
  };
}
