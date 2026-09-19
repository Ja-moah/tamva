/**
 * TAMVA Risk & Decision Intelligence Screen (Phase 8A)
 *
 * Provides customer-facing awareness into their financial risk assessment:
 * - Risk Header (Back navigation, title, intelligence subtitle, notifications)
 * - Hero Risk Level Card (LOW RISK, 3-tier segmented scale, standing, explanation, attribution)
 * - Key Factors Card (Income Consistency, Stability, Savings Discipline with 52.1% highlight, Resilience)
 * - Assessment Summary Card (Why this assessment?)
 * - Compact Data Coverage Card (4 institutions, 12 months window, latest consented data)
 * - Freshness Footer (Freshness timestamp & subtle non-guarantee footnote)
 * - Zero-CLS Layout-Preserving Skeleton Loader
 * - Developer-only QA State Switcher (__DEV__ only)
 */

import { withFeatureGate } from '../../src/components/ui/withFeatureGate';
import { DEMO_MODE } from '../../src/config/env';
import { ConfidenceLive } from '../../src/components/live/ConfidenceLive';
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
import { useRiskOverview } from '../../src/hooks/useRiskOverview';
import {
  RiskStateMode,
  RiskFactor,
  RiskDecisionContext,
} from '../../src/types/risk';
import {
  RiskHeader,
  RiskLevelCard,
  RiskFactorsCard,
  RiskSummaryCard,
  RiskCoverageCard,
  RiskFreshnessFooter,
  RiskSkeleton,
  RiskFactorDetailSheet,
  RiskDecisionCard,
  RiskDecisionContextSheet,
  RiskDecisionDetailSheet,
} from '../../src/components/risk';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { Chip } from '../../src/components/ui/Chip';

function RiskScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [selectedFactor, setSelectedFactor] = useState<RiskFactor | null>(null);
  const [decisionContext, setDecisionContext] =
    useState<RiskDecisionContext>('financial_planning');
  const [isContextSheetVisible, setIsContextSheetVisible] =
    useState<boolean>(false);
  const [isDecisionDetailVisible, setIsDecisionDetailVisible] =
    useState<boolean>(false);

  const {
    data,
    stateMode,
    setStateMode,
    isRefreshing,
    handleRefresh,
  } = useRiskOverview();

  const handleNavigateToConsent = () => {
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
        <RiskSkeleton />
        {__DEV__ && renderStateSwitcher(stateMode, setStateMode, theme)}
      </View>
    );
  }

  // 2. Error State (Section 12)
  if (stateMode === 'error') {
    return (
      <View
        style={[
          styles.screenContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <RiskHeader />
        <View style={styles.centerContainer}>
          <ErrorState
            title="Something went wrong"
            message="We couldn't load your risk assessment right now."
            retryLabel="Try again"
            onRetry={() => setStateMode('loaded')}
          />
        </View>
        {__DEV__ && renderStateSwitcher(stateMode, setStateMode, theme)}
      </View>
    );
  }

  // 3. Empty State (Section 10)
  if (stateMode === 'empty' || !data) {
    return (
      <View
        style={[
          styles.screenContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <RiskHeader />
        <View style={styles.centerContainer}>
          <EmptyState
            icon="shield"
            title="Risk assessment not available"
            description="TAMVA needs consented financial data to assess your current financial risk signals."
            actionLabel="Review connected accounts"
            onActionPress={handleNavigateToConsent}
          />
        </View>
        {__DEV__ && renderStateSwitcher(stateMode, setStateMode, theme)}
      </View>
    );
  }

  // 4. Loaded / Limited / Unavailable State
  return (
    <View
      style={[
        styles.screenContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {/* Top Navigation Header */}
      <RiskHeader />

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
        {/* 1. Hero Risk Level Card (Segmented Scale, Standing & Attribution) */}
        <RiskLevelCard
          level={data.level}
          levelLabel={data.levelLabel}
          standingLabel={data.standingLabel}
          explanation={data.explanation}
          attribution={data.attribution}
          isLimited={data.isLimited}
          isUnavailable={data.isUnavailable}
        />

        {/* 2. Key Factors Card (Interactive Factor Rows) */}
        <RiskFactorsCard
          factors={data.factors}
          onSelectFactor={setSelectedFactor}
        />

        {/* 3. Why this assessment? Summary Card */}
        <RiskSummaryCard
          summary={data.summary}
          indicators={data.summaryIndicators}
          isLimited={data.isLimited}
          isUnavailable={data.isUnavailable}
        />

        {/* 4. Decision Intelligence Card (Phase 8C & 8D) */}
        <RiskDecisionCard
          context={decisionContext}
          onSelectContextPress={() => setIsContextSheetVisible(true)}
          onOpenDetails={() => setIsDecisionDetailVisible(true)}
          isAvailable={data.decisionInsight?.isAvailable !== false}
          isLimited={data.isLimited}
          outcomeLabel={data.decisionInsight?.outcomeLabel}
          outcomeTone={data.decisionInsight?.outcomeTone}
          keySignals={data.decisionInsight?.keySignals}
        />

        {/* 5. Compact Data Coverage Card */}
        <RiskCoverageCard coverage={data.coverage} />

        {/* 6. Freshness & Regulatory Footnote */}
        <RiskFreshnessFooter
          lastUpdated={data.coverage.lastUpdated}
          disclosure={data.disclosure}
          isLimited={data.isLimited}
          isUnavailable={data.isUnavailable}
        />

        {/* 7. Developer-only QA State Switcher Dock */}
        {__DEV__ && renderStateSwitcher(stateMode, setStateMode, theme)}
      </ScrollView>

      {/* Interactive Risk Factor Detail BottomSheet (Phase 8B) */}
      <RiskFactorDetailSheet
        visible={!!selectedFactor}
        onClose={() => setSelectedFactor(null)}
        factor={selectedFactor}
      />

      {/* Decision Context Selection BottomSheet (Phase 8C) */}
      <RiskDecisionContextSheet
        visible={isContextSheetVisible}
        onClose={() => setIsContextSheetVisible(false)}
        selectedContext={decisionContext}
        onSelectContext={setDecisionContext}
      />

      {/* Decision Intelligence Detail BottomSheet (Phase 8C & 8D) */}
      <RiskDecisionDetailSheet
        visible={isDecisionDetailVisible}
        onClose={() => setIsDecisionDetailVisible(false)}
        level={data.level}
        levelLabel={data.levelLabel}
        standingLabel={data.standingLabel}
        factors={data.factors}
        isLimited={data.isLimited}
        isUnavailable={data.isUnavailable}
        financialPositions={data.decisionInsight?.financialPositions}
        institutionsCount={data.coverage.institutionsCount}
        assessmentWindow={data.coverage.assessmentWindow}
      />
    </View>
  );
}

/**
 * Developer-only QA State Switcher Dock (Phase 8D)
 */
function renderStateSwitcher(
  currentMode: RiskStateMode,
  setMode: (mode: RiskStateMode) => void,
  theme: any
) {
  const modes: { key: RiskStateMode; label: string }[] = [
    { key: 'loaded', label: 'Loaded' },
    { key: 'loading', label: 'Loading' },
    { key: 'limited', label: 'Limited Data' },
    { key: 'empty', label: 'Empty' },
    { key: 'unavailable', label: 'Unavailable' },
    { key: 'error', label: 'Error' },
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
        Risk Screen QA State Preview (Dev Only)
      </Text>
      <View style={styles.switcherRow}>
        {modes.map((mode) => {
          const isSelected = currentMode === mode.key;
          return (
            <Chip
              key={mode.key}
              label={mode.label}
              selected={isSelected}
              onPress={() => setMode(mode.key)}
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


export default DEMO_MODE ? RiskScreen : withFeatureGate(ConfidenceLive, {
  capability: 'customer_financial_confidence',
  wired: true,
  title: 'Financial Confidence',
  description: "Your Financial Confidence isn't available from TAMVA yet.",
});
