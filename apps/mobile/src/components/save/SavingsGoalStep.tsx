/**
 * TAMVA SavingsGoalStep Component (Step 1)
 *
 * Initial step for the Save Money experience:
 * - Displays recent net cash flow context card (GH₵3,750)
 * - Clear goal templates (Emergency Fund, School Fees, New Laptop, Travel)
 * - Custom Goal creation trigger
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { SavingsGoalTemplate } from '../../types/save';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { MoneyDisplay } from '../financial/MoneyDisplay';
import {
  MOCK_RECENT_NET_CASH_FLOW,
  MOCK_CASH_FLOW_LABEL,
  MOCK_CASH_FLOW_DESCRIPTION,
} from '../../demo/data/mockSaveData';

export interface SavingsGoalStepProps {
  templates: SavingsGoalTemplate[];
  onSelectTemplate: (template: SavingsGoalTemplate) => void;
  onOpenCustomGoal: () => void;
  onBack: () => void;
}

export const SavingsGoalStep: React.FC<SavingsGoalStepProps> = ({
  templates,
  onSelectTemplate,
  onOpenCustomGoal,
  onBack,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const handleTemplatePress = (template: SavingsGoalTemplate) => {
    haptics.selection();
    onSelectTemplate(template);
  };

  const handleCustomPress = () => {
    haptics.selection();
    onOpenCustomGoal();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. SCREEN HEADER */}
      <ScreenHeader
        title="Save Money"
        subtitle="Set aside money with a plan that fits your financial goals."
        showBack={true}
        onBackPress={onBack}
        borderBottom={true}
      />

      {/* 2. SCROLLABLE CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 24 },
        ]}
      >
        {/* Financial Context Card */}
        <View
          style={[
            styles.contextCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.contextHeader}>
            <View
              style={[
                styles.contextIconContainer,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Icon name="trending-up" size={16} color={theme.colors.primary} />
            </View>
            <Text
              style={[
                theme.typography.caption,
                styles.contextLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              {MOCK_CASH_FLOW_LABEL}
            </Text>
          </View>

          <View style={styles.amountRow}>
            <MoneyDisplay
              amount={MOCK_RECENT_NET_CASH_FLOW}
              currency="GHS"
              size="lg"
            />
          </View>

          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary, marginTop: 4 },
            ]}
          >
            {MOCK_CASH_FLOW_DESCRIPTION}
          </Text>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              theme.typography.subheading,
              { color: theme.colors.textPrimary },
            ]}
          >
            Choose a savings goal
          </Text>
          <Text
            style={[
              theme.typography.bodySm,
              { color: theme.colors.textSecondary, marginTop: 2 },
            ]}
          >
            Select a starter template or create your own custom goal.
          </Text>
        </View>

        {/* Goal Template Cards */}
        <View style={styles.templatesList}>
          {templates.map((template) => (
            <Card
              key={template.id}
              variant="standard"
              onPress={() => handleTemplatePress(template)}
              style={styles.templateCard}
              accessibilityLabel={`${template.name}, target GH₵${template.defaultTarget}`}
            >
              <View style={styles.templateContent}>
                <View
                  style={[
                    styles.goalIconContainer,
                    { backgroundColor: theme.colors.primaryLight },
                  ]}
                >
                  <Icon
                    name={template.icon}
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>

                <View style={styles.templateDetails}>
                  <Text
                    style={[
                      theme.typography.bodyMedium,
                      { color: theme.colors.textPrimary, fontWeight: '600' },
                    ]}
                  >
                    {template.name}
                  </Text>
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.textSecondary, marginTop: 2 },
                    ]}
                  >
                    {template.description}
                  </Text>
                </View>

                <View style={styles.targetBadge}>
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.primary, fontWeight: '700' },
                    ]}
                  >
                    GH₵{template.defaultTarget.toLocaleString('en-US')}
                  </Text>
                  <Icon
                    name="chevron-right"
                    size={16}
                    color={theme.colors.textTertiary}
                    style={{ marginLeft: 4 }}
                  />
                </View>
              </View>
            </Card>
          ))}

          {/* Custom Goal Card */}
          <Card
            variant="standard"
            onPress={handleCustomPress}
            style={styles.customGoalCard}
            accessibilityLabel="Create a custom savings goal"
          >
            <View style={styles.templateContent}>
              <View
                style={[
                  styles.goalIconContainer,
                  { backgroundColor: theme.colors.surfaceElevated },
                ]}
              >
                <Icon
                  name="plus-circle"
                  size={22}
                  color={theme.colors.primary}
                />
              </View>

              <View style={styles.templateDetails}>
                <Text
                  style={[
                    theme.typography.bodyMedium,
                    { color: theme.colors.textPrimary, fontWeight: '600' },
                  ]}
                >
                  Custom Goal
                </Text>
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textSecondary, marginTop: 2 },
                  ]}
                >
                  Create your own savings target
                </Text>
              </View>

              <Icon
                name="chevron-right"
                size={16}
                color={theme.colors.textTertiary}
              />
            </View>
          </Card>
        </View>
      </ScrollView>
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
  contextCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  contextIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  contextLabel: {
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  amountRow: {
    marginVertical: 2,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  templatesList: {
    gap: 12,
  },
  templateCard: {
    padding: 14,
    borderRadius: 12,
  },
  customGoalCard: {
    padding: 14,
    borderRadius: 12,
  },
  templateContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  templateDetails: {
    flex: 1,
    paddingRight: 8,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
