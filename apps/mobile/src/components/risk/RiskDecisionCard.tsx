/**
 * TAMVA RiskDecisionCard Component
 *
 * Decision Intelligence section on Risk Overview (Phase 8C):
 * Introduces how consented financial signals may support a financial review
 * across customizable decision contexts (Financial Planning, Loan, Rental, Financial Service, Other).
 * Strict conservative framing: analytical synthesis only, never an automated approval or credit decision.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { RiskDecisionContext , RiskDecisionKeySignals } from '../../types/risk';
import {
  DECISION_CONTEXT_OPTIONS,
  DECISION_CONTEXT_EXPLANATIONS,
} from '../../demo/data/mockRiskData';
import { Badge, BadgeTone } from '../ui/Badge';
import { Icon } from '../ui/Icon';

export interface RiskDecisionCardProps {
  context: RiskDecisionContext;
  onSelectContextPress: () => void;
  onOpenDetails: () => void;
  isAvailable?: boolean;
  isLimited?: boolean;
  outcomeLabel?: string;
  outcomeTone?: BadgeTone;
  keySignals?: RiskDecisionKeySignals;
  explanation?: string;
}

export const RiskDecisionCard: React.FC<RiskDecisionCardProps> = ({
  context,
  onSelectContextPress,
  onOpenDetails,
  isAvailable = true,
  isLimited = false,
  outcomeLabel,
  outcomeTone,
  keySignals,
  explanation,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const activeOption =
    DECISION_CONTEXT_OPTIONS.find((opt) => opt.id === context) ||
    DECISION_CONTEXT_OPTIONS[0];

  const defaultExplanationText =
    DECISION_CONTEXT_EXPLANATIONS[context] ||
    DECISION_CONTEXT_EXPLANATIONS.financial_planning;

  const currentExplanation = isLimited
    ? explanation || 'Some financial signals are unavailable, so TAMVA cannot provide a complete decision context from the current data.'
    : explanation || defaultExplanationText;

  const resolvedOutcomeLabel =
    outcomeLabel || (isLimited ? 'Limited signals' : 'Strong profile');
  const resolvedOutcomeTone: BadgeTone =
    outcomeTone || (isLimited ? 'neutral' : 'success');

  const resolvedKeySignals: RiskDecisionKeySignals = keySignals || {
    riskLevel: isLimited ? 'Assessment limited' : 'Low Risk',
    netCashflow: isLimited ? 'Not available' : 'GH₵3,750',
    savingsRate: isLimited ? 'Not available' : '52.1%',
    dataSources: isLimited ? '1 connected account' : '4 institutions',
  };

  const handleContextPress = () => {
    haptics.selection();
    onSelectContextPress();
  };

  const handleDetailsPress = () => {
    haptics.selection();
    onOpenDetails();
  };

  // Graceful Unavailable State (Section 11 & 14)
  if (!isAvailable) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
        accessible
        accessibilityRole="summary"
        accessibilityLabel="Decision intelligence is temporarily unavailable."
      >
        <View style={styles.headerRow}>
          <Text
            style={[
              theme.typography.subheading,
              { color: theme.colors.textPrimary, fontWeight: '700' },
            ]}
          >
            Decision Intelligence
          </Text>
          <Badge label="Unavailable" tone="neutral" size="sm" />
        </View>
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.textSecondary, marginTop: 8, lineHeight: 22 },
          ]}
        >
          Decision intelligence is temporarily unavailable. We couldn&apos;t calculate your current risk assessment from the available financial data.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
        },
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Decision Intelligence. ${resolvedOutcomeLabel}. Context: ${activeOption.label}.`}
    >
      {/* 1. Header: Kicker and Outcome Badge */}
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text
            style={[
              theme.typography.subheading,
              { color: theme.colors.textPrimary, fontWeight: '700' },
            ]}
          >
            Decision Intelligence
          </Text>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginTop: 2 },
            ]}
          >
            See how your current financial signals may support a financial review
          </Text>
        </View>
        <Badge
          label={resolvedOutcomeLabel}
          tone={resolvedOutcomeTone}
          size="sm"
          showDot
        />
      </View>

      {/* 2. Interactive Context Selector Pill */}
      <Pressable
        onPress={handleContextPress}
        style={({ pressed }) => [
          styles.contextPill,
          {
            backgroundColor: pressed
              ? theme.colors.border
              : theme.colors.backgroundAlt,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Decision context: ${activeOption.label}. Tap to change context.`}
      >
        <View style={styles.contextPillContent}>
          <Icon
            name={activeOption.icon}
            size={14}
            color={theme.colors.primary}
            style={styles.contextIcon}
          />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginRight: 4 },
            ]}
          >
            Context:
          </Text>
          <Text
            style={[
              theme.typography.label,
              { color: theme.colors.textPrimary, fontWeight: '700', fontSize: 12 },
            ]}
          >
            {activeOption.label}
          </Text>
        </View>
        <View style={styles.changeActionRow}>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.primary, fontWeight: '600', fontSize: 11 },
            ]}
          >
            Change
          </Text>
          <Icon
            name="chevron-down"
            size={14}
            color={theme.colors.primary}
          />
        </View>
      </Pressable>

      {/* 3. Contextual Explanatory Copy */}
      <Text
        style={[
          theme.typography.body,
          {
            color: theme.colors.textSecondary,
            lineHeight: 22,
            marginBottom: 16,
          },
        ]}
      >
        {currentExplanation}
      </Text>

      {/* 4. Compact Key Signals 2x2 Grid */}
      <View
        style={[
          styles.signalsGrid,
          {
            backgroundColor: theme.colors.backgroundAlt,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        {/* Signal 1: Risk Level */}
        <View style={styles.signalCell}>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary, fontSize: 11 },
            ]}
          >
            Risk level
          </Text>
          <Text
            style={[
              theme.typography.label,
              {
                color:
                  resolvedKeySignals.riskLevel === 'Not available' || isLimited
                    ? theme.colors.textSecondary
                    : theme.colors.textPrimary,
                fontWeight: '700',
                marginTop: 2,
              },
            ]}
          >
            {resolvedKeySignals.riskLevel}
          </Text>
        </View>

        {/* Signal 2: Net Cashflow */}
        <View style={styles.signalCell}>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary, fontSize: 11 },
            ]}
          >
            Net cashflow
          </Text>
          <Text
            style={[
              theme.typography.label,
              {
                color:
                  resolvedKeySignals.netCashflow === 'Not available'
                    ? theme.colors.textTertiary
                    : theme.colors.textPrimary,
                fontWeight: '700',
                marginTop: 2,
                fontStyle:
                  resolvedKeySignals.netCashflow === 'Not available'
                    ? 'italic'
                    : 'normal',
              },
            ]}
          >
            {resolvedKeySignals.netCashflow}
          </Text>
        </View>

        {/* Signal 3: Savings Rate */}
        <View style={styles.signalCell}>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary, fontSize: 11 },
            ]}
          >
            Savings rate
          </Text>
          <Text
            style={[
              theme.typography.label,
              {
                color:
                  resolvedKeySignals.savingsRate === 'Not available'
                    ? theme.colors.textTertiary
                    : theme.colors.textPrimary,
                fontWeight: '700',
                marginTop: 2,
                fontStyle:
                  resolvedKeySignals.savingsRate === 'Not available'
                    ? 'italic'
                    : 'normal',
              },
            ]}
          >
            {resolvedKeySignals.savingsRate}
          </Text>
        </View>

        {/* Signal 4: Data Sources */}
        <View style={styles.signalCell}>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary, fontSize: 11 },
            ]}
          >
            Data sources
          </Text>
          <Text
            style={[
              theme.typography.label,
              {
                color:
                  resolvedKeySignals.dataSources === 'Not available'
                    ? theme.colors.textTertiary
                    : theme.colors.textPrimary,
                fontWeight: '700',
                marginTop: 2,
              },
            ]}
          >
            {resolvedKeySignals.dataSources}
          </Text>
        </View>
      </View>

      {/* 5. Footer Action: View Details */}
      <Pressable
        onPress={handleDetailsPress}
        style={({ pressed }) => [
          styles.actionRow,
          {
            borderTopColor: theme.colors.border,
            backgroundColor: pressed ? theme.colors.backgroundAlt : 'transparent',
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="View decision intelligence details"
      >
        <Text
          style={[
            theme.typography.label,
            { color: theme.colors.primary, fontWeight: '600', fontSize: 13 },
          ]}
        >
          View decision details
        </Text>
        <Icon
          name="chevron-right"
          size={16}
          color={theme.colors.primary}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 8,
  },
  titleColumn: {
    flex: 1,
    minWidth: 0,
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginBottom: 14,
    minHeight: 44,
  },
  contextPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contextIcon: {
    marginRight: 6,
  },
  changeActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  signalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    marginBottom: 14,
  },
  signalCell: {
    width: '50%',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 14,
    paddingBottom: 4,
    minHeight: 48,
  },
});
