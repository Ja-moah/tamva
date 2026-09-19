/**
 * TAMVA SavingsReviewStep Component (Step 5)
 *
 * Pre-confirmation summary and review:
 * - Full plan configuration breakdown table
 * - Explicit notice: "This creates a savings plan in TAMVA. No money has been moved yet."
 * - Primary CTA: "Create Savings Plan"
 * - Secondary CTA: "Edit Plan"
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { SavingsPlanDraft } from '../../types/save';
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

export interface SavingsReviewStepProps {
  draft: SavingsPlanDraft;
  onCreatePlan: () => void;
  onEditPlan: () => void;
  onBack: () => void;
}

export const SavingsReviewStep: React.FC<SavingsReviewStepProps> = ({
  draft,
  onCreatePlan,
  onEditPlan,
  onBack,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const estimate = useMemo(
    () =>
      calculateEstimatedContribution(
        draft.targetAmount,
        draft.frequency,
        draft.targetDate
      ),
    [draft.targetAmount, draft.frequency, draft.targetDate]
  );

  const handleCreate = () => {
    haptics.success();
    onCreatePlan();
  };

  const handleEdit = () => {
    haptics.selection();
    onEditPlan();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. SCREEN HEADER */}
      <ScreenHeader
        title="Review Plan"
        subtitle="Review your savings plan"
        showBack={true}
        onBackPress={onBack}
        borderBottom={true}
      />

      {/* 2. SCROLLABLE CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 120 },
        ]}
      >
        {/* Goal Hero Header */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.heroIconCircle,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            <Icon name={draft.goalIcon} size={28} color={theme.colors.primary} />
          </View>
          <Text
            style={[
              theme.typography.heading,
              { color: theme.colors.textPrimary, marginTop: 12 },
            ]}
          >
            {draft.goalName}
          </Text>
          <Text
            style={[
              theme.typography.bodySm,
              { color: theme.colors.textSecondary, marginTop: 2 },
            ]}
          >
            {draft.goalDescription}
          </Text>
        </View>

        {/* Summary Breakdown Card */}
        <View
          style={[
            styles.breakdownCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Target Amount */}
          <View style={styles.row}>
            <Text
              style={[
                theme.typography.bodySm,
                { color: theme.colors.textSecondary },
              ]}
            >
              Target Amount
            </Text>
            <MoneyDisplay
              amount={draft.targetAmount}
              currency={draft.currency}
              size="md"
            />
          </View>

          <View
            style={[styles.rowDivider, { backgroundColor: theme.colors.border }]}
          />

          {/* Contribution */}
          <View style={styles.row}>
            <Text
              style={[
                theme.typography.bodySm,
                { color: theme.colors.textSecondary },
              ]}
            >
              Contribution
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

          <View
            style={[styles.rowDivider, { backgroundColor: theme.colors.border }]}
          />

          {/* Funding Account */}
          <View style={styles.row}>
            <Text
              style={[
                theme.typography.bodySm,
                { color: theme.colors.textSecondary },
              ]}
            >
              Funding Account
            </Text>
            <View style={styles.fundingAccountTextCol}>
              <Text
                style={[
                  theme.typography.bodyMedium,
                  {
                    color: theme.colors.textPrimary,
                    fontWeight: '600',
                    textAlign: 'right',
                  },
                ]}
              >
                {draft.fundingAccount?.institutionName || 'None selected'}
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, textAlign: 'right' },
                ]}
              >
                {draft.fundingAccount
                  ? `${draft.fundingAccount.accountType} ${draft.fundingAccount.maskedIdentifier}`
                  : ''}
              </Text>
            </View>
          </View>

          <View
            style={[styles.rowDivider, { backgroundColor: theme.colors.border }]}
          />

          {/* Target Date */}
          <View style={styles.row}>
            <Text
              style={[
                theme.typography.bodySm,
                { color: theme.colors.textSecondary },
              ]}
            >
              Target Date
            </Text>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textPrimary, fontWeight: '600' },
              ]}
            >
              {formatTargetDate(draft.targetDate)}
            </Text>
          </View>

          <View
            style={[styles.rowDivider, { backgroundColor: theme.colors.border }]}
          />

          {/* Status */}
          <View style={styles.row}>
            <Text
              style={[
                theme.typography.bodySm,
                { color: theme.colors.textSecondary },
              ]}
            >
              Plan Status
            </Text>
            <Badge label="Ready to create" tone="information" size="sm" />
          </View>
        </View>

        {/* Informational Transparency Alert */}
        <View
          style={[
            styles.alertBox,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon name="info" size={18} color={theme.colors.primary} />
          <Text
            style={[
              theme.typography.bodySm,
              { color: theme.colors.textSecondary, flex: 1, marginLeft: 10 },
            ]}
          >
            This creates a savings plan in TAMVA. No money has been moved yet.
          </Text>
        </View>
      </ScrollView>

      {/* 3. FIXED BOTTOM ACTIONS */}
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
          label="Create Savings Plan"
          variant="primary"
          onPress={handleCreate}
          fullWidth={true}
        />
        <Button
          label="Edit Plan"
          variant="tertiary"
          onPress={handleEdit}
          fullWidth={true}
          style={{ marginTop: 6 }}
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
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  heroIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakdownCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  fundingAccountTextCol: {
    alignItems: 'flex-end',
  },
  rowDivider: {
    height: 1,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
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
