/**
 * TAMVA SavingsCreatedStep Component (Step 6)
 *
 * Plan created confirmation screen:
 * - "Your savings plan is ready"
 * - "Your plan has been created and is ready for future contributions."
 * - Displays 0% progress and 0 saved amount
 * - Explicitly does NOT say "Money saved successfully"
 * - Primary CTA: "View Savings Plan"
 * - Secondary CTA: "Done"
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { SavingsPlan } from '../../types/save';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

export interface SavingsCreatedStepProps {
  plan: SavingsPlan;
  onViewPlan: () => void;
  onDone: () => void;
}

export const SavingsCreatedStep: React.FC<SavingsCreatedStepProps> = ({
  plan,
  onViewPlan,
  onDone,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const handleView = () => {
    haptics.selection();
    onViewPlan();
  };

  const handleDone = () => {
    haptics.selection();
    onDone();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24) + 20,
            paddingBottom: Math.max(insets.bottom, 24) + 120,
          },
        ]}
      >
        {/* Success Icon */}
        <View style={styles.iconWrapper}>
          <View
            style={[
              styles.successCircle,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            <Icon name="check-circle" size={48} color={theme.colors.primary} />
          </View>
        </View>

        {/* Headings */}
        <Text
          style={[
            theme.typography.headingLg,
            styles.title,
            { color: theme.colors.textPrimary },
          ]}
        >
          Your savings plan is ready
        </Text>
        <Text
          style={[
            theme.typography.bodyMedium,
            styles.subtitle,
            { color: theme.colors.textSecondary },
          ]}
        >
          Your plan has been created and is ready for future contributions.
        </Text>

        {/* Plan Overview Card */}
        <View
          style={[
            styles.planCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.goalIconBox,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Icon name={plan.goalIcon} size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text
                style={[
                  theme.typography.bodyMedium,
                  { color: theme.colors.textPrimary, fontWeight: '700' },
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
                Target: GH₵{plan.targetAmount.toLocaleString('en-US')}
              </Text>
            </View>
          </View>

          {/* Progress Visualization */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Saved: GH₵0.00
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.primary, fontWeight: '700' },
                ]}
              >
                0% complete
              </Text>
            </View>

            <View
              style={[
                styles.progressBarBackground,
                { backgroundColor: theme.colors.surfaceElevated },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  { width: '0%', backgroundColor: theme.colors.primary },
                ]}
              />
            </View>
          </View>

          {/* Funding Account Details */}
          <View
            style={[
              styles.fundingAccountRow,
              { borderTopColor: theme.colors.border },
            ]}
          >
            <View>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textTertiary },
                ]}
              >
                Funding account
              </Text>
              <Text
                style={[
                  theme.typography.bodyMedium,
                  { color: theme.colors.textPrimary, fontWeight: '600', marginTop: 2 },
                ]}
              >
                {plan.fundingAccount.institutionName} •{' '}
                {plan.fundingAccount.maskedIdentifier}
              </Text>
            </View>
            <Icon
              name={plan.fundingAccount.icon || 'credit-card'}
              size={20}
              color={theme.colors.textSecondary}
            />
          </View>
        </View>

        {/* Explicit Informational Reminder */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon name="info" size={16} color={theme.colors.primary} />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, flex: 1, marginLeft: 8 },
            ]}
          >
            No money has been moved from your account. You can track progress or
            make demo contributions anytime.
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
          label="View Savings Plan"
          variant="primary"
          onPress={handleView}
          fullWidth={true}
        />
        <Button
          label="Done"
          variant="tertiary"
          onPress={handleDone}
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
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: 20,
  },
  successCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  planCard: {
    width: '100%',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  fundingAccountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    width: '100%',
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
