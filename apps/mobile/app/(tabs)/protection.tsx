/**
 * TAMVA Financial Protection Screen (Phase 7B)
 *
 * Provides customer-facing awareness and monitoring over connected financial data:
 * - Protection Header (Back navigation, title, monitoring status subtitle, notifications)
 * - Hero Protection Status Card (Protected standing, shield glyph, consented data attribution)
 * - Cohesive Protection Overview (Consent health, connections, monitoring, access rows) -> Interactive Detail Sheets
 * - Monitoring Status Card (Active state, monitored count, freshness, alerts)
 * - Connected Accounts Card (Summary metrics, compact interactive account rows, review accounts link)
 * - Recent Protection Activity Card (Protection audit events, timestamps)
 * - Recommendations Section (Compact, understated advisory)
 * - Freshness Footer (Freshness timestamp & conservative non-guarantee footnote)
 * - Zero-CLS Layout-Preserving Skeleton Loader
 * - Interactive Developer QA State Switcher (Loaded, Loading, Empty, Error)
 * - Interactive ProtectionSignalSheet (Consent Health, Connections, Monitoring, Access)
 * - Interactive ProtectionAccountSheet (Account-level trust & consent scopes)
 */

import { withFeatureGate } from '../../src/components/ui/withFeatureGate';
import { DEMO_MODE } from '../../src/config/env';
import { ProtectionLive } from '../../src/components/live/ProtectionLive';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { useFinancialProtection } from '../../src/hooks/useFinancialProtection';
import {
  ProtectionStateMode,
  ProtectionScenario,
  ProtectionSignal,
  ProtectionAccountDetail,
} from '../../src/types/protection';
import {
  ProtectionHeader,
  ProtectionStatusCard,
  ProtectionOverview,
  ProtectionMonitoringCard,
  ProtectionAccountsCard,
  ProtectionActivityCard,
  ProtectionRecommendation,
  ProtectionFreshnessFooter,
  ProtectionSkeleton,
  ProtectionSignalSheet,
  ProtectionAccountSheet,
} from '../../src/components/protection';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { Chip } from '../../src/components/ui/Chip';

function ProtectionScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const {
    data,
    stateMode,
    setStateMode,
    scenario,
    setScenario,
    isRefreshing,
    handleRefresh,
  } = useFinancialProtection();

  // Detail Sheet States
  const [selectedSignal, setSelectedSignal] = useState<ProtectionSignal | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<ProtectionAccountDetail | null>(null);

  const closeAllSheets = () => {
    setSelectedSignal(null);
    setSelectedAccount(null);
  };

  const handleSelectSignal = (signal: ProtectionSignal) => {
    closeAllSheets();
    setSelectedSignal(signal);
  };

  const handleSelectAccount = (account: ProtectionAccountDetail) => {
    closeAllSheets();
    setSelectedAccount(account);
  };

  const handleNavigateToConsent = () => {
    closeAllSheets();
    router.push('/(tabs)/consent');
  };

  // 1. Loading State (Zero CLS Skeleton)
  if (stateMode === 'loading') {
    return (
      <View
        style={[
          styles.screenContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ProtectionSkeleton />
        {renderStateSwitcher(stateMode, setStateMode, scenario, setScenario, theme)}
      </View>
    );
  }

  // 2. Error State
  if (stateMode === 'error') {
    return (
      <View
        style={[
          styles.screenContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ProtectionHeader />
        <View style={styles.centerContainer}>
          <ErrorState
            title="We couldn't load your protection overview"
            message="Please try again."
            retryLabel="Try again"
            onRetry={() => setStateMode('loaded')}
          />
        </View>
        {renderStateSwitcher(stateMode, setStateMode, scenario, setScenario, theme)}
      </View>
    );
  }

  // 3. Empty State (No connected accounts)
  if (stateMode === 'empty' || !data) {
    return (
      <View
        style={[
          styles.screenContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ProtectionHeader />
        <View style={styles.centerContainer}>
          <EmptyState
            icon="shield"
            title="Financial Protection isn't available yet"
            description="Connect a financial account to start building your protection overview."
            actionLabel="Connect an account"
            onActionPress={handleNavigateToConsent}
          />
        </View>
        {renderStateSwitcher(stateMode, setStateMode, scenario, setScenario, theme)}
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
      {/* Top Header */}
      <ProtectionHeader />

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
        {/* 1. Hero Status Card */}
        <ProtectionStatusCard
          status={data.status}
          statusLabel={data.statusLabel}
          statusDescription={data.statusDescription}
        />

        {/* 2. Cohesive Protection Overview (4 interactive rows) */}
        <ProtectionOverview
          signals={data.signals}
          onSelectSignal={handleSelectSignal}
        />

        {/* 3. Monitoring Card */}
        <ProtectionMonitoringCard monitoring={data.monitoring} />

        {/* 4. Connected Accounts Summary Card (with compact account rows) */}
        <ProtectionAccountsCard
          accounts={data.accounts}
          accountsList={data.accountDetails}
          onSelectAccount={handleSelectAccount}
          onReviewAccounts={handleNavigateToConsent}
        />

        {/* 5. Recent Protection Activity */}
        <ProtectionActivityCard activity={data.recentActivity} />

        {/* 6. Compact Understated Recommendations */}
        <ProtectionRecommendation
          recommendations={data.recommendations}
          onActionPress={handleNavigateToConsent}
        />

        {/* 7. Freshness Footnote */}
        <ProtectionFreshnessFooter lastUpdated={data.lastUpdated} />

        {/* 8. Developer QA State Switcher Dock */}
        {renderStateSwitcher(stateMode, setStateMode, scenario, setScenario, theme)}
      </ScrollView>

      {/* Detail Bottom Sheets */}
      <ProtectionSignalSheet
        visible={!!selectedSignal}
        onClose={() => setSelectedSignal(null)}
        signal={selectedSignal}
        accounts={data.accountDetails}
        onSelectAccount={handleSelectAccount}
        onNavigateToConsent={handleNavigateToConsent}
      />

      <ProtectionAccountSheet
        visible={!!selectedAccount}
        onClose={() => setSelectedAccount(null)}
        account={selectedAccount}
        onNavigateToConsent={handleNavigateToConsent}
      />
    </View>
  );
}

/**
 * Developer QA State Switcher Dock
 */
function renderStateSwitcher(
  currentMode: ProtectionStateMode,
  setMode: (mode: ProtectionStateMode) => void,
  currentScenario: ProtectionScenario,
  setScenario: (scenario: ProtectionScenario) => void,
  theme: any
) {
  const modes: ProtectionStateMode[] = ['loaded', 'loading', 'empty', 'error'];
  const scenarios: { key: ProtectionScenario; label: string }[] = [
    { key: 'healthy', label: 'Healthy' },
    { key: 'attention', label: 'Attention' },
    { key: 'disconnected', label: 'Disconnected' },
    { key: 'limited', label: 'Limited Data' },
    { key: 'unavailable', label: 'Unavailable' },
  ];

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
        Protection Screen QA State Preview
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

      {currentMode === 'loaded' && (
        <>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textTertiary,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginTop: 12,
                marginBottom: 6,
              },
            ]}
          >
            Scenario Test (Phase 7C)
          </Text>
          <View style={styles.switcherRow}>
            {scenarios.map((s) => {
              const isSelected = currentScenario === s.key;
              return (
                <Chip
                  key={s.key}
                  label={s.label}
                  selected={isSelected}
                  onPress={() => setScenario(s.key)}
                  style={styles.switcherChip}
                />
              );
            })}
          </View>
        </>
      )}
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


export default DEMO_MODE ? ProtectionScreen : withFeatureGate(ProtectionLive, {
  capability: 'customer_protection',
  wired: true,
  title: 'Protection',
  description: "Protection signals for your accounts and devices aren't available from TAMVA yet.",
});
