/**
 * TAMVA Financial Profile Screen (Phase 6B)
 *
 * Deep customer financial-intelligence view & interaction layer:
 * - Profile Header (Title, subtitle, privacy masking toggle, notifications)
 * - Hero Financial Confidence Score Card (with interactive Score Info Sheet)
 * - Cohesive Behavioural Dimensions Container (with individual Dimension Detail Sheets)
 * - Cashflow Dynamics Card (with interactive Cashflow Overview Sheet)
 * - Curated Behavioural Insights & Observations (with Insight Detail Sheets)
 * - Consented Profile Data Sources (with Source Detail Sheets & Provenance pipeline)
 * - Freshness Timestamp & Regulatory Footnote
 * - Zero-CLS Layout-Preserving Skeleton Loader
 * - Interactive Developer QA State Switcher (Loaded, Loading, Empty, Error)
 */

import { withFeatureGate } from '../../src/components/ui/withFeatureGate';
import { DEMO_MODE } from '../../src/config/env';
import { ProfileLive } from '../../src/components/live/ProfileLive';
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
import { useFinancialProfile } from '../../src/hooks/useFinancialProfile';
import { useHaptics } from '../../src/hooks/useHaptics';
import {
  ProfileStateMode,
  ProfileDimension,
  ProfileInsight,
  ProfileSource,
} from '../../src/types/profile';
import {
  ProfileHeader,
  ProfileScoreCard,
  ProfileDimensions,
  ProfileCashflowCard,
  ProfileInsights,
  ProfileSourcesCard,
  ProfileFreshnessFooter,
  ProfileSkeleton,
  ProfileScoreInfoSheet,
  ProfileDimensionDetailSheet,
  ProfileCashflowDetailSheet,
  ProfileInsightDetailSheet,
  ProfileSourceDetailSheet,
  ProfileDataMethodSheet,
} from '../../src/components/profile';
import {
  EmptyState,
  ErrorState,
  Chip,
  Card,
  Badge,
  Icon,
} from '../../src/components/ui';

function ProfileScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const haptics = useHaptics();

  const {
    data,
    stateMode,
    setStateMode,
    isRefreshing,
    handleRefresh,
  } = useFinancialProfile();

  // Interaction sheet visibility states
  const [isScoreInfoVisible, setIsScoreInfoVisible] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState<ProfileDimension | null>(null);
  const [isCashflowInfoVisible, setIsCashflowInfoVisible] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<ProfileInsight | null>(null);
  const [selectedSource, setSelectedSource] = useState<ProfileSource | null>(null);
  const [isDataMethodVisible, setIsDataMethodVisible] = useState(false);

  // Helper to ensure single active sheet overlay
  const closeAllSheets = () => {
    setIsScoreInfoVisible(false);
    setSelectedDimension(null);
    setIsCashflowInfoVisible(false);
    setSelectedInsight(null);
    setSelectedSource(null);
    setIsDataMethodVisible(false);
  };

  // Interaction triggers with haptic feedback
  const handleScorePress = () => {
    haptics.selection();
    closeAllSheets();
    setIsScoreInfoVisible(true);
  };

  const handleDimensionPress = (dimension: ProfileDimension) => {
    haptics.selection();
    closeAllSheets();
    setSelectedDimension(dimension);
  };

  const handleCashflowPress = () => {
    haptics.selection();
    closeAllSheets();
    setIsCashflowInfoVisible(true);
  };

  const handleInsightPress = (insight: ProfileInsight) => {
    haptics.selection();
    closeAllSheets();
    setSelectedInsight(insight);
  };

  const handleSourcePress = (source: ProfileSource) => {
    haptics.selection();
    closeAllSheets();
    setSelectedSource(source);
  };

  const handleOpenDataMethod = () => {
    haptics.selection();
    closeAllSheets();
    setIsDataMethodVisible(true);
  };

  const handleNavigateToConsent = () => {
    router.push('/(tabs)/consent');
  };

  const handleNavigateToRisk = () => {
    router.push('/(tabs)/risk');
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
        <ProfileSkeleton />
        {renderStateSwitcher(stateMode, setStateMode, theme)}
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
        <ProfileHeader />
        <View style={styles.centerContainer}>
          <ErrorState
            title="We couldn't load your financial profile"
            message="We were unable to aggregate your consented financial data. Please check your connection and try again."
            errorCode="PROF-AGG-503"
            retryLabel="Try again"
            onRetry={() => setStateMode('loaded')}
          />
        </View>
        {renderStateSwitcher(stateMode, setStateMode, theme)}
      </View>
    );
  }

  // 3. Empty State (No connected accounts to build profile)
  if (stateMode === 'empty' || !data) {
    return (
      <View
        style={[
          styles.screenContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ProfileHeader />
        <View style={styles.centerContainer}>
          <EmptyState
            icon="user"
            title="No Financial Profile Available"
            description="Connect your financial institutions with active consent to build your behavioural intelligence profile and cashflow standing. A new profile requires consented transaction history to evaluate patterns."
            actionLabel="Connect an account"
            onActionPress={handleNavigateToConsent}
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
      <ProfileHeader />

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
        {/* 1. Hero Financial Confidence Score Card (Interactive) */}
        <ProfileScoreCard
          score={data.score}
          onPress={handleScorePress}
        />

        {/* 2. Cohesive Behavioural Dimensions Container (Interactive Rows) */}
        <ProfileDimensions
          dimensions={data.dimensions}
          onSelectDimension={handleDimensionPress}
        />

        {/* 3. Risk & Decision Assessment Entry Point */}
        <Card
          variant="elevated"
          padding="none"
          onPress={handleNavigateToRisk}
          style={styles.riskCard}
          accessibilityLabel="Risk and Decision Assessment: Low Risk. Understand how your financial profile contributes to your current assessment. Tap to view detailed risk assessment."
        >
          <View style={styles.riskCardContent}>
            {/* Header: Eyebrow on left, Status Badge on right */}
            <View style={styles.riskCardHeader}>
              <View style={styles.riskEyebrowGroup}>
                <Icon
                  name="shield"
                  size={13}
                  color={theme.colors.primary}
                  style={styles.riskEyebrowIcon}
                />
                <Text
                  style={[
                    theme.typography.captionMedium,
                    {
                      color: theme.colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      fontSize: 11,
                    },
                  ]}
                >
                  DECISION INTELLIGENCE
                </Text>
              </View>

              <Badge
                label="Low Risk"
                tone="success"
                size="sm"
                showDot
              />
            </View>

            {/* Title & Subtitle */}
            <Text
              style={[
                styles.riskTitle,
                theme.typography.bodySmMedium,
                { color: theme.colors.textPrimary },
              ]}
            >
              Risk & Decision Assessment
            </Text>
            <Text
              style={[
                styles.riskSubtitle,
                theme.typography.caption,
                { color: theme.colors.textSecondary },
              ]}
            >
              Understand how your financial profile contributes to your current assessment
            </Text>

            {/* Subtle Divider */}
            <View
              style={[
                styles.riskDivider,
                { backgroundColor: theme.colors.border },
              ]}
            />

            {/* Action Affordance */}
            <View style={styles.riskActionRow}>
              <Text
                style={[
                  styles.riskActionText,
                  theme.typography.captionMedium,
                  { color: theme.colors.primary },
                ]}
              >
                View Risk Assessment
              </Text>
              <Icon
                name="arrow-right"
                size={13}
                color={theme.colors.primary}
                style={styles.riskActionIcon}
              />
            </View>
          </View>
        </Card>

        {/* 4. Cashflow Dynamics Card (Interactive & Privacy-masked via MoneyDisplay) */}
        <ProfileCashflowCard
          cashflow={data.cashflow}
          onPress={handleCashflowPress}
        />

        {/* 5. Curated Behavioural Insights (Interactive Cards) */}
        <ProfileInsights
          insights={data.insights}
          onSelectInsight={handleInsightPress}
        />

        {/* 6. Consented Contributing Sources Card (Interactive Rows & Provenance) */}
        <ProfileSourcesCard
          sources={data.sources}
          onSelectSource={handleSourcePress}
          onOpenDataMethod={handleOpenDataMethod}
        />

        {/* 7. Freshness Timestamp & Regulatory Footnote */}
        <ProfileFreshnessFooter freshness={data.freshness} />

        {/* 8. Developer QA State Switcher Dock */}
        {renderStateSwitcher(stateMode, setStateMode, theme)}
      </ScrollView>

      {/* Detail BottomSheets (Phase 6B) */}
      <ProfileScoreInfoSheet
        visible={isScoreInfoVisible}
        onClose={() => setIsScoreInfoVisible(false)}
        score={data.score}
      />

      <ProfileDimensionDetailSheet
        visible={!!selectedDimension}
        onClose={() => setSelectedDimension(null)}
        dimension={selectedDimension}
      />

      <ProfileCashflowDetailSheet
        visible={isCashflowInfoVisible}
        onClose={() => setIsCashflowInfoVisible(false)}
        cashflow={data.cashflow}
      />

      <ProfileInsightDetailSheet
        visible={!!selectedInsight}
        onClose={() => setSelectedInsight(null)}
        insight={selectedInsight}
      />

      <ProfileSourceDetailSheet
        visible={!!selectedSource}
        onClose={() => setSelectedSource(null)}
        source={selectedSource}
        onNavigateToConsent={handleNavigateToConsent}
      />

      <ProfileDataMethodSheet
        visible={isDataMethodVisible}
        onClose={() => setIsDataMethodVisible(false)}
        onNavigateToConsent={handleNavigateToConsent}
      />
    </View>
  );
}

/**
 * Developer QA State Switcher Dock
 */
function renderStateSwitcher(
  currentMode: ProfileStateMode,
  setMode: (mode: ProfileStateMode) => void,
  theme: any
) {
  const modes: ProfileStateMode[] = ['loaded', 'loading', 'empty', 'error'];

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
        Profile Screen QA State Preview
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
  riskCard: {
    borderRadius: 16,
    marginBottom: 16,
  },
  riskCardContent: {
    padding: 16,
  },
  riskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskEyebrowGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskEyebrowIcon: {
    marginRight: 6,
  },
  riskTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    marginTop: 10,
  },
  riskSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  riskDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginVertical: 12,
  },
  riskActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskActionText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  riskActionIcon: {
    marginLeft: 6,
  },
});


export default DEMO_MODE ? ProfileScreen : withFeatureGate(ProfileLive, {
  capability: 'customer_financial_profile',
  wired: true,
  title: 'Financial Profile',
  description: "Your financial profile isn't available from TAMVA yet.",
});
