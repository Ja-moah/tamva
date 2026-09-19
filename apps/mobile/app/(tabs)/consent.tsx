/**
 * TAMVA Connected Accounts & Consent Screen (Phase 4B)
 *
 * Comprehensive trust, institution connection & consent management experience:
 * - Transparent screen header with privacy masking toggle & notifications
 * - Fact-based, restrained consent & data protection intro card
 * - Overview connection summary (total connected, active vs attention breakdown, freshness)
 * - Prominent "Connect an Institution" primary action
 * - Multi-step interactive connection flow:
 *     1. Institution Picker with real-time search & duplicate protection
 *     2. Consent Review with purpose, required/optional scopes & duration selector
 *     3. Simulated connection processing & Connection Result Sheet
 * - Manage Consent Scopes sheet allowing modification of granted scopes & duration
 * - Destructive Disconnect confirmation sheet with clear data retention copy
 * - Account detail inspection with "Sync Now" simulation
 * - 0-CLS layout-preserving skeleton loader
 * - Developer QA state switcher for testing loaded, loading, empty, and error modes
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../src/theme';
import { useConnectedAccounts } from '../../src/hooks/useConnectedAccounts';
import { AccountsStateMode } from '../../src/types/accounts';
import {
  ConnectedAccountsHeader,
  AccountTrustIntro,
  ConnectedAccountsSummary,
  ConnectedAccountRow,
  AccountDetailModal,
  ConnectedAccountsSkeleton,
  InstitutionPickerSheet,
  ConsentReviewSheet,
  ConsentSuccessSheet,
  ManageConsentSheet,
  DisconnectConfirmSheet,
} from '../../src/components/accounts';
import { Button } from '../../src/components/ui/Button';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { Chip } from '../../src/components/ui/Chip';
import { Icon } from '../../src/components/ui/Icon';
import { DEMO_MODE } from '../../src/config/env';
import { FeatureGate } from '../../src/components/ui/FeatureGate';
import { LiveConsentScreen } from '../../src/components/consent/LiveConsentScreen';

export function DemoConsentScreen() {
  const { theme } = useTheme();

  const {
    stateMode,
    setStateMode,
    accounts,
    rawAccounts,
    summary,
    selectedAccount,
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
    // Sync Action
    handleSyncAccount,
  } = useConnectedAccounts();

  // 1. Loading State (Layout-preserving skeleton for zero CLS)
  if (stateMode === 'loading') {
    return (
      <View style={[styles.screenContainer, { backgroundColor: theme.colors.background }]}>
        <ConnectedAccountsSkeleton />
        {renderStateSwitcher(stateMode, setStateMode, theme)}
      </View>
    );
  }

  // 2. Error / Degraded State
  if (stateMode === 'error') {
    return (
      <View style={[styles.screenContainer, { backgroundColor: theme.colors.background }]}>
        <ConnectedAccountsHeader />
        <View style={styles.centerContainer}>
          <ErrorState
            title="Unable to Load Accounts"
            message="We couldn't synchronize your connected institutions and permissions. Please check your network and retry."
            errorCode="ACC-SYNC-503"
            retryLabel="Retry Synchronization"
            onRetry={() => setStateMode('loaded')}
          />
        </View>
        {renderStateSwitcher(stateMode, setStateMode, theme)}
      </View>
    );
  }

  // 3. Loaded & Empty States
  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.colors.background }]}>
      {/* Top Navigation Header */}
      <ConnectedAccountsHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Trust & Data Protection Context Card */}
        <AccountTrustIntro />

        {/* Overview Summary */}
        <ConnectedAccountsSummary
          summary={summary}
          onRefreshPress={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Primary Action Button */}
        <View style={styles.actionRow}>
          <Button
            label="Connect an Institution"
            onPress={openConnectFlow}
            variant="primary"
            size="lg"
            leftIcon="plus"
            fullWidth
          />
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              },
            ]}
          >
            Connected Institutions ({accounts.length})
          </Text>
        </View>

        {/* Accounts List or Empty State */}
        {accounts.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <EmptyState
              icon="shield"
              title="No financial accounts connected"
              description="Connect your bank accounts and mobile money wallets to unlock your unified financial intelligence, cashflow timeline, and credit readiness."
              actionLabel="Connect your first account"
              onActionPress={openConnectFlow}
            />
          </View>
        ) : (
          accounts.map((account) => (
            <ConnectedAccountRow
              key={account.id}
              account={account}
              onPress={handleSelectAccount}
            />
          ))
        )}

        {/* Bottom Trust Microcopy */}
        <View style={styles.footerWrapper}>
          <View style={styles.securityNote}>
            <Icon name="lock" size={12} color={theme.colors.textTertiary} />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, marginLeft: 6 },
              ]}
            >
              Read-only synchronization • Revocable anytime
            </Text>
          </View>

          {/* QA State Switcher for rapid verification */}
          {renderStateSwitcher(stateMode, setStateMode, theme)}
        </View>
      </ScrollView>

      {/* 1. Account Detail Bottom Sheet Inspection */}
      <AccountDetailModal
        account={selectedAccount}
        visible={Boolean(selectedAccount)}
        onClose={handleCloseDetail}
        onSync={handleSyncAccount}
        onManagePermissions={openManageConsent}
        onDisconnect={openDisconnectConfirm}
        onReconnect={handleReconnect}
        onReviewConnection={handleReviewConnection}
      />

      {/* 2. Connection Flow Step 1: Institution Picker */}
      <InstitutionPickerSheet
        visible={isPickerVisible}
        onClose={closePicker}
        onSelectInstitution={handleSelectInstitution}
        connectedAccounts={rawAccounts}
      />

      {/* 3. Connection Flow Step 2: Consent Review & Duration */}
      <ConsentReviewSheet
        institution={selectedInstitutionForConnect}
        visible={isConsentReviewVisible}
        onClose={closeConsentReview}
        onConfirmConsent={handleConfirmConsent}
        isConnecting={isConnecting}
      />

      {/* 4. Connection Flow Step 3: Connection Success */}
      <ConsentSuccessSheet
        account={justConnectedAccount}
        visible={isSuccessVisible}
        onClose={closeSuccess}
        onViewAccount={handleViewJustConnectedAccount}
      />

      {/* 5. Manage Consent Scopes Sheet */}
      <ManageConsentSheet
        account={targetAccountForManage}
        visible={isManageConsentVisible}
        onClose={closeManageConsent}
        onSaveConsent={handleSaveConsentChanges}
      />

      {/* 6. Disconnect Confirmation Sheet */}
      <DisconnectConfirmSheet
        account={targetAccountForDisconnect}
        visible={isDisconnectConfirmVisible}
        onClose={closeDisconnectConfirm}
        onConfirmDisconnect={handleConfirmDisconnect}
      />
    </View>
  );
}

/**
 * Developer QA State Switcher Dock
 */
function renderStateSwitcher(
  currentMode: AccountsStateMode,
  setMode: (mode: AccountsStateMode) => void,
  theme: any
) {
  const modes: AccountsStateMode[] = ['loaded', 'loading', 'empty', 'error'];

  return (
    <View style={styles.switcherContainer}>
      <Text
        style={[
          theme.typography.captionMedium,
          {
            color: theme.colors.textTertiary,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 6,
          },
        ]}
      >
        Consent Screen QA State Preview
      </Text>
      <View style={styles.switcherRow}>
        {modes.map((mode) => {
          const isSelected = currentMode === mode;
          return (
            <Chip
              key={mode}
              label={mode.charAt(0).toUpperCase() + mode.slice(1)}
              selected={isSelected}
              onPress={() => setMode(mode)}
              style={styles.switcherChip}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function ConsentScreen() {
  if (DEMO_MODE) return <DemoConsentScreen />;
  return (
    <FeatureGate
      capability="customer_consent"
      wired
      title="Consent"
      description="Consent access is not available from the API right now."
    >
      <LiveConsentScreen />
    </FeatureGate>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  actionRow: {
    width: '100%',
    marginBottom: 20,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  emptyWrapper: {
    paddingVertical: 20,
  },
  footerWrapper: {
    marginTop: 20,
    alignItems: 'center',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  switcherContainer: {
    marginTop: 8,
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  switcherRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  switcherChip: {
    minHeight: 30,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
});
