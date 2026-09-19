/**
 * TAMVA RiskDecisionDetailSheet Component
 *
 * Compact, analytical BottomSheet presenting full Decision Intelligence context (Phase 8C).
 * Displays:
 * - Current Assessment (Low Risk, Strong financial profile)
 * - Key Supporting Signals (the 4 behavioral dimensions)
 * - Current Financial Position (balance, inflow, outflow, net cashflow, savings rate)
 * - Data Context (4 institutions, 12-month window, consented data notice)
 * - Strict non-guarantee disclosure
 * - 48px+ Done button
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { RiskFactor, RiskLevel, RiskFinancialPositionItem } from '../../types/risk';
import { DECISION_INTELLIGENCE_DISCLOSURE } from '../../demo/data/mockRiskData';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';

export interface RiskDecisionDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  level: RiskLevel;
  levelLabel: string;
  standingLabel: string;
  factors: RiskFactor[];
  isLimited?: boolean;
  isUnavailable?: boolean;
  financialPositions?: RiskFinancialPositionItem[];
  institutionsCount?: number;
  assessmentWindow?: string;
}

const DEFAULT_FINANCIAL_POSITIONS: RiskFinancialPositionItem[] = [
  { label: 'Consolidated balance', value: 'GH₵28,450', isAvailable: true },
  { label: 'Monthly inflow', value: 'GH₵7,200', isAvailable: true },
  { label: 'Monthly outflow', value: 'GH₵3,450', isAvailable: true },
  { label: 'Net monthly cashflow', value: 'GH₵3,750', isAvailable: true },
  { label: 'Savings rate', value: '52.1%', isAvailable: true },
];

export const RiskDecisionDetailSheet: React.FC<RiskDecisionDetailSheetProps> = ({
  visible,
  onClose,
  level,
  levelLabel,
  standingLabel,
  factors,
  isLimited = false,
  isUnavailable = false,
  financialPositions,
  institutionsCount = 4,
  assessmentWindow = '12 months',
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const handleDonePress = () => {
    haptics.selection();
    onClose();
  };

  const displayedPositions = financialPositions || DEFAULT_FINANCIAL_POSITIONS;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Decision Intelligence"
      subtitle="Financial context for review"
      maxHeight="88%"
    >
      <View style={styles.container}>
        {/* Explanation text */}
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.textSecondary, lineHeight: 21, marginBottom: 16 },
          ]}
        >
          Decision Intelligence uses the financial signals currently available to TAMVA to provide context around your financial position.
        </Text>

        {/* 1. Current Assessment Section */}
        <View style={styles.section}>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textTertiary,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                fontSize: 11,
                marginBottom: 8,
              },
            ]}
          >
            Current Assessment
          </Text>
          <View
            style={[
              styles.assessmentBox,
              {
                backgroundColor: theme.colors.backgroundAlt,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <View style={styles.assessmentLeft}>
              <Icon
                name="shield"
                size={18}
                color={
                  isLimited || isUnavailable
                    ? theme.colors.textTertiary
                    : theme.colors.success
                }
                style={styles.shieldIcon}
              />
              <Text
                style={[
                  theme.typography.subheading,
                  { color: theme.colors.textPrimary, fontWeight: '700', fontSize: 15 },
                ]}
              >
                {standingLabel}
              </Text>
            </View>
            <Badge
              label={levelLabel}
              tone={
                isLimited || isUnavailable
                  ? 'neutral'
                  : level === 'low'
                  ? 'success'
                  : level === 'moderate'
                  ? 'warning'
                  : 'danger'
              }
              size="sm"
              showDot
            />
          </View>
        </View>

        {/* 2. Key Supporting Signals Section */}
        <View style={styles.section}>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textTertiary,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                fontSize: 11,
                marginBottom: 8,
              },
            ]}
          >
            Key Supporting Signals
          </Text>
          <View
            style={[
              styles.tableContainer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            {factors.map((factor, idx) => {
              const isLast = idx === factors.length - 1;
              return (
                <View
                  key={factor.id}
                  style={[
                    styles.tableRow,
                    !isLast && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.factorLabelCol}>
                    <Icon
                      name={factor.icon}
                      size={14}
                      color={theme.colors.primary}
                      style={styles.factorIcon}
                    />
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.textPrimary, fontWeight: '600' },
                      ]}
                    >
                      {factor.title}
                    </Text>
                  </View>
                  <Badge
                    label={factor.statusLabel}
                    tone={factor.badgeTone}
                    size="sm"
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* 3. Current Financial Position Section */}
        <View style={styles.section}>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textTertiary,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                fontSize: 11,
                marginBottom: 8,
              },
            ]}
          >
            Current Financial Position
          </Text>
          <View
            style={[
              styles.tableContainer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            {displayedPositions.map((item, idx) => {
              const isLast = idx === displayedPositions.length - 1;
              const isAvailable =
                item.isAvailable !== false && item.value !== 'Not available';

              return (
                <View
                  key={item.label}
                  style={[
                    styles.tableRow,
                    !isLast && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.textSecondary, flex: 1 },
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      theme.typography.label,
                      {
                        color: isAvailable
                          ? theme.colors.textPrimary
                          : theme.colors.textTertiary,
                        fontWeight: '700',
                        fontStyle: isAvailable ? 'normal' : 'italic',
                      },
                    ]}
                  >
                    {item.value}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 4. Data Context */}
        <View
          style={[
            styles.contextBox,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <View style={styles.contextMetricsRow}>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textPrimary, fontWeight: '600' },
              ]}
            >
              {institutionsCount === 1
                ? '1 connected account'
                : `${institutionsCount} connected institutions`}
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary },
              ]}
            >
              •
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textPrimary, fontWeight: '600' },
              ]}
            >
              {assessmentWindow.includes('window')
                ? assessmentWindow
                : `${assessmentWindow} data window`}
            </Text>
          </View>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, fontSize: 11, marginTop: 4 },
            ]}
          >
            Based on the latest consented financial data available to TAMVA.
          </Text>
        </View>

        {/* 5. Conservative Trust Disclosure */}
        <View style={styles.disclosureRow}>
          <Icon
            name="info"
            size={13}
            color={theme.colors.textTertiary}
            style={styles.disclosureIcon}
          />
          <Text
            style={[
              theme.typography.caption,
              {
                color: theme.colors.textTertiary,
                fontSize: 11,
                lineHeight: 16,
                flex: 1,
              },
            ]}
          >
            {DECISION_INTELLIGENCE_DISCLOSURE}
          </Text>
        </View>

        {/* 6. Action: 48px+ Done Button */}
        <Button
          label="Done"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleDonePress}
          style={styles.doneButton}
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  section: {
    marginBottom: 16,
  },
  assessmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  assessmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  shieldIcon: {
    marginTop: 1,
  },
  tableContainer: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  factorLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  factorIcon: {
    marginTop: 1,
  },
  contextBox: {
    padding: 12,
    marginBottom: 14,
  },
  contextMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disclosureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 4,
    marginBottom: 18,
  },
  disclosureIcon: {
    marginTop: 2,
  },
  doneButton: {
    minHeight: 48,
  },
});
