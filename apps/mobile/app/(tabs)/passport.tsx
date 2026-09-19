/**
 * TAMVA Financial Passport Screen (Phase 5B)
 *
 * One trusted, portable view of customer financial standing and trust profile:
 * - Structured Identity Card (Holder name, status, verified ID, jurisdiction)
 * - Prominent "Share Financial Passport" primary action
 * - Active Share presentation card (with View QR & Revoke access)
 * - Calibrated Financial Confidence Card (780 / 850 score, 5-tier meter, non-bureau framing)
 * - Consolidated Financial Standing (GH₵ 28,450 net position, inflow vs outflow, savings rate)
 * - Behavioural Intelligence (5 key behavioral pillars: consistency, stability, savings, repayment, resilience)
 * - Consented Data Sources Summary (4 connected Ghanaian financial institutions)
 * - Compact Recent Shares history list
 * - Factual Freshness & Transparency Footnote
 * - Multi-step Share BottomSheet (Purpose -> Scopes -> Duration -> Review -> Success)
 * - Native Geometric Demo Passport QR modal
 * - Destructive Revoke Access confirmation sheet
 * - 0-CLS layout-preserving skeleton loader
 * - Developer QA state switcher for testing loaded, loading, empty, and error modes
 */

import { withFeatureGate } from '../../src/components/ui/withFeatureGate';
import { DEMO_MODE } from '../../src/config/env';
import { PassportLive } from '../../src/components/live/PassportLive';
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { useFinancialPassport } from '../../src/hooks/useFinancialPassport';
import { PassportStateMode } from '../../src/types/passport';
import {
  PassportHeader,
  PassportIdentityCard,
  PassportActionsRow,
  PassportActiveShareCard,
  PassportConfidenceCard,
  PassportFinancialPositionCard,
  PassportBehaviorMetrics,
  PassportInstitutionsCard,
  PassportShareHistory,
  PassportFreshnessFooter,
  PassportSkeleton,
  PassportShareSheet,
  PassportShareQrModal,
  PassportRevokeSheet,
} from '../../src/components/passport';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { Chip } from '../../src/components/ui/Chip';

function PassportScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const {
    data,
    stateMode,
    setStateMode,
    isRefreshing,
    handleRefresh,

    // Sharing flow
    isShareSheetVisible,
    openShareFlow,
    closeShareFlow,
    isCreatingShare,
    handleCreateShare,

    // QR Presentation
    isQrSheetVisible,
    selectedShareForQr,
    openQrView,
    closeQrView,

    // Revoke flow
    isRevokeSheetVisible,
    isRevoking,
    selectedShareForRevoke,
    openRevokeFlow,
    closeRevokeFlow,
    handleConfirmRevoke,

    // Active Share & History
    activeShare,
    shareHistory,
  } = useFinancialPassport();

  // 1. Loading State (Layout-preserving skeleton for zero Cumulative Layout Shift)
  if (stateMode === 'loading') {
    return (
      <View
        style={[
          styles.screenContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <PassportSkeleton />
        {renderStateSwitcher(stateMode, setStateMode, theme)}
      </View>
    );
  }

  // 2. Error / Degraded State
  if (stateMode === 'error') {
    return (
      <View
        style={[
          styles.screenContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <PassportHeader />
        <View style={styles.centerContainer}>
          <ErrorState
            title="Unable to Load Financial Passport"
            message="We could not aggregate your consented financial profile. Please verify your connection and retry."
            errorCode="PASS-AGG-502"
            retryLabel="Retry Verification"
            onRetry={() => setStateMode('loaded')}
          />
        </View>
        {renderStateSwitcher(stateMode, setStateMode, theme)}
      </View>
    );
  }

  // 3. Empty State (No connected accounts to generate passport)
  if (stateMode === 'empty' || !data) {
    return (
      <View
        style={[
          styles.screenContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <PassportHeader />
        <View style={styles.centerContainer}>
          <EmptyState
            icon="shield"
            title="No Financial Passport Available"
            description="Connect your financial institutions with active consent to generate your portable financial standing and trust profile."
            actionLabel="Connect an Institution"
            onActionPress={() => router.push('/(tabs)/consent')}
          />
        </View>
        {renderStateSwitcher(stateMode, setStateMode, theme)}
      </View>
    );
  }

  // 4. Loaded State
  return (
    <View
      style={[
        styles.screenContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {/* Top Header with Privacy Mode Toggle & Notifications */}
      <PassportHeader />

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
        {/* 1. Identity / Credential Header Card */}
        <PassportIdentityCard identity={data.identity} />

        {/* 2. Primary Share Passport Action */}
        <PassportActionsRow onSharePress={openShareFlow} />

        {/* 3. Active Share Banner (if a share is active) */}
        {activeShare && (
          <PassportActiveShareCard
            share={activeShare}
            onViewQr={() => openQrView(activeShare)}
            onRevokePress={() => openRevokeFlow(activeShare)}
          />
        )}

        {/* 4. Financial Confidence Score Card */}
        <PassportConfidenceCard confidence={data.confidence} />

        {/* 5. Consolidated Financial Standing & Cashflow Card */}
        <PassportFinancialPositionCard position={data.financialPosition} />

        {/* 6. Behavioural Intelligence Pillars */}
        <PassportBehaviorMetrics metrics={data.behaviorMetrics} />

        {/* 7. Consented Data Sources Summary */}
        <PassportInstitutionsCard summary={data.institutionsSummary} />

        {/* 8. Recent Passport Shares Audit History */}
        {shareHistory && shareHistory.length > 0 && (
          <PassportShareHistory
            shares={shareHistory}
            onSelectShare={(share) => openQrView(share)}
          />
        )}

        {/* 9. Freshness Timestamp & Non-Bureau Disclosure Footnote */}
        <PassportFreshnessFooter freshness={data.freshness} />

        {/* 10. Developer QA State Switcher Dock */}
        {renderStateSwitcher(stateMode, setStateMode, theme)}
      </ScrollView>

      {/* Share Flow Multi-Step BottomSheet */}
      <PassportShareSheet
        visible={isShareSheetVisible}
        onClose={closeShareFlow}
        identity={data.identity}
        isCreating={isCreatingShare}
        onCreateShare={handleCreateShare}
        onShowQr={(share) => openQrView(share)}
      />

      {/* Demo Passport QR Modal */}
      <PassportShareQrModal
        visible={isQrSheetVisible}
        onClose={closeQrView}
        share={selectedShareForQr || activeShare}
      />

      {/* Revoke Share Confirmation BottomSheet */}
      <PassportRevokeSheet
        visible={isRevokeSheetVisible}
        onClose={closeRevokeFlow}
        share={selectedShareForRevoke}
        onConfirmRevoke={handleConfirmRevoke}
        isRevoking={isRevoking}
      />
    </View>
  );
}

/**
 * Developer QA State Switcher Dock
 */
function renderStateSwitcher(
  currentMode: PassportStateMode,
  setMode: (mode: PassportStateMode) => void,
  theme: any
) {
  const modes: PassportStateMode[] = ['loaded', 'loading', 'empty', 'error'];

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
        Passport Screen QA State Preview
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
  switcherContainer: {
    marginTop: 12,
    marginBottom: 16,
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


export default DEMO_MODE ? PassportScreen : withFeatureGate(PassportLive, {
  capability: 'customer_passport',
  wired: true,
  title: 'Financial Passport',
  description: "Viewing and sharing your Financial Passport isn't available from TAMVA yet.",
});
