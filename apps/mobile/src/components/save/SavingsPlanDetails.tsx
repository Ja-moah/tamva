/**
 * TAMVA SavingsPlanDetails Component (Step 7)
 *
 * Dedicated screen for inspecting an active savings plan:
 * - Real-time progress bar (e.g. 0% or updated by demo contributions)
 * - Full metadata table (Frequency, Estimate, Funding account, Target date, Created date, Status)
 * - Clearly marked secondary Demo Contribution trigger for development/QA
 * - Clean close navigation returning to Home
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { SavingsPlan } from '../../types/save';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { MoneyDisplay } from '../financial/MoneyDisplay';
import {
  calculateEstimatedContribution,
  formatTargetDate,
} from '../../demo/data/mockSaveData';

export interface SavingsPlanDetailsProps {
  plan: SavingsPlan;
  onOpenDemoContribution: () => void;
  onDone: () => void;
  onBack: () => void;
}

export const SavingsPlanDetails: React.FC<SavingsPlanDetailsProps> = ({
  plan,
  onOpenDemoContribution,
  onDone,
  onBack,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const progressFraction = Math.min(1, plan.savedAmount / Math.max(1, plan.targetAmount));
  const progressPercent = (progressFraction * 100).toFixed(1);

  const estimate = useMemo(
    () =>
      calculateEstimatedContribution(
        plan.targetAmount,
        plan.frequency,
        plan.targetDate
      ),
    [plan.targetAmount, plan.frequency, plan.targetDate]
  );

  const handleDemoPress = () => {
    haptics.selection();
    onOpenDemoContribution();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. SCREEN HEADER */}
      <ScreenHeader
        title="Savings Plan"
        subtitle={plan.goalName}
        showBack={true}
        onBackPress={onBack}
        borderBottom={true}
      />

      {/* 2. SCROLLABLE CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 80 },
        ]}
      >
        {/* Goal Hero Banner */}
        <View
          style={[
            styles.heroBanner,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.goalIconCircle,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Icon name={plan.goalIcon} size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.heroTitles}>
              <Text
                style={[
                  theme.typography.subheading,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {plan.goalName}
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: 2 },
                ]}
              >
                {plan.goalDescription}
              </Text>
            </View>
            <Badge
              label={plan.status.toUpperCase()}
              tone={plan.status === 'completed' ? 'success' : 'information'}
              size="sm"
            />
          </View>

          {/* Progress Bar & Amounts */}
          <View style={styles.progressContainer}>
            <View style={styles.amountDisplayRow}>
              <View>
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Saved Amount
                </Text>
                <MoneyDisplay
                  amount={plan.savedAmount}
                  currency={plan.currency}
                  size="md"
                />
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textTertiary },
                  ]}
                >
                  Target Target
                </Text>
                <MoneyDisplay
                  amount={plan.targetAmount}
                  currency={plan.currency}
                  size="md"
                />
              </View>
            </View>

            {/* Visual Progress Bar */}
            <View
              style={[
                styles.progressBarBg,
                { backgroundColor: theme.colors.surfaceElevated },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, Math.max(0, parseFloat(progressPercent)))}%`,
                    backgroundColor:
                      plan.status === 'completed'
                        ? theme.colors.success
                        : theme.colors.primary,
                  },
                ]}
              />
            </View>

            <View style={styles.progressFooter}>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.primary, fontWeight: '700' },
                ]}
              >
                {progressPercent}% completed
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textTertiary },
                ]}
              >
                Remaining: GH₵
                {Math.max(0, plan.targetAmount - plan.savedAmount).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Plan Metadata Card */}
        <View
          style={[
            styles.metadataCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.bodyMedium,
              { color: theme.colors.textPrimary, fontWeight: '700', marginBottom: 12 },
            ]}
          >
            Plan Overview
          </Text>

          {/* Contribution Frequency */}
          <View style={styles.metaRow}>
            <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary }]}>
              Frequency
            </Text>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textPrimary, fontWeight: '600' },
              ]}
            >
              {estimate.frequencyLabel}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          {/* Estimated Contribution */}
          <View style={styles.metaRow}>
            <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary }]}>
              {estimate.label}
            </Text>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textPrimary, fontWeight: '600' },
              ]}
            >
              {estimate.displayText}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          {/* Funding Account */}
          <View style={styles.metaRow}>
            <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary }]}>
              Funding Account
            </Text>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textPrimary, fontWeight: '600' },
              ]}
            >
              {plan.fundingAccount.institutionName} •{' '}
              {plan.fundingAccount.maskedIdentifier}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          {/* Target Date */}
          <View style={styles.metaRow}>
            <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary }]}>
              Target Date
            </Text>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textPrimary, fontWeight: '600' },
              ]}
            >
              {formatTargetDate(plan.targetDate)}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          {/* Created Date */}
          <View style={styles.metaRow}>
            <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary }]}>
              Created
            </Text>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textPrimary, fontWeight: '500' },
              ]}
            >
              {new Date(plan.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Development / Demo Contribution Card */}
        <View
          style={[
            styles.demoCard,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.demoHeader}>
            <View
              style={[
                styles.demoIconCircle,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Icon name="zap" size={16} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  theme.typography.caption,
                  {
                    color: theme.colors.primary,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: 0.3,
                  },
                ]}
              >
                Development / QA Simulation
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: 2 },
                ]}
              >
                Test future progress updates in local memory.
              </Text>
            </View>
          </View>

          <Button
            label="Demo Contribution (+GH₵500)"
            variant="secondary"
            onPress={handleDemoPress}
            size="sm"
            style={{ marginTop: 12 }}
          />

          <Text
            style={[
              theme.typography.caption,
              {
                color: theme.colors.textTertiary,
                fontSize: 11,
                marginTop: 8,
                textAlign: 'center',
              },
            ]}
          >
            Demo only — no real money was moved.
          </Text>
        </View>
      </ScrollView>

      {/* 3. FIXED BOTTOM DONE BUTTON */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <Button
          label="Done"
          variant="primary"
          onPress={onDone}
          fullWidth={true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroBanner: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  heroTitles: {
    flex: 1,
  },
  progressContainer: {
    marginTop: 4,
  },
  amountDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  metadataCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  divider: {
    height: 1,
  },
  demoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  demoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
