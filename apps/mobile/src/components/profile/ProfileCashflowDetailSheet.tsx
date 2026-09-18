/**
 * TAMVA ProfileCashflowDetailSheet Component
 *
 * Detailed BottomSheet presenting the customer's cashflow dynamics.
 * Displays income, outflow, net cashflow, and savings rate using
 * MoneyDisplay to guarantee global privacy masking compliance.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { MoneyDisplay } from '../financial/MoneyDisplay';
import { ProfileCashflow } from '../../types/profile';

export interface ProfileCashflowDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  cashflow?: ProfileCashflow | null;
}

export const ProfileCashflowDetailSheet: React.FC<
  ProfileCashflowDetailSheetProps
> = ({ visible, onClose, cashflow }) => {
  const { theme } = useTheme();

  if (!cashflow) return null;

  const isNetAvailable = typeof cashflow.netCashflow === 'number';
  const isIncomeAvailable = typeof cashflow.monthlyIncome === 'number';
  const isOutflowAvailable = typeof cashflow.monthlyOutflow === 'number';
  const isSavingsAvailable = typeof cashflow.savingsRatePercent === 'number';

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Cashflow Overview"
      subtitle="Recorded monthly dynamics"
      maxHeight="85%"
    >
      <View style={styles.container}>
        {/* Net Cashflow Hero Display */}
        <View
          style={[
            styles.heroBox,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.captionMedium,
              { color: theme.colors.textTertiary, fontSize: 11 },
            ]}
          >
            NET MONTHLY SURPLUS
          </Text>
          <View style={{ marginTop: 4, marginBottom: 2 }}>
            {isNetAvailable ? (
              <MoneyDisplay
                amount={cashflow.netCashflow!}
                currency={cashflow.currency}
                size="lg"
                flow="income"
                showSign
              />
            ) : (
              <Text
                style={[
                  theme.typography.bodyMedium,
                  { color: theme.colors.textSecondary, fontSize: 18, fontWeight: '600' },
                ]}
              >
                Calculating...
              </Text>
            )}
          </View>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, fontSize: 11, marginTop: 4 },
            ]}
          >
            Average surplus retained across verified accounts
          </Text>
        </View>

        {/* Breakdown Items List */}
        <View
          style={[
            styles.breakdownCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Income Row */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: theme.colors.successLight },
                ]}
              >
                <Icon
                  name="arrow-down-left"
                  size={14}
                  color={theme.colors.success}
                />
              </View>
              <View>
                <Text
                  style={[
                    theme.typography.bodyMedium,
                    { color: theme.colors.textPrimary, fontWeight: '600' },
                  ]}
                >
                  Recorded Inflow
                </Text>
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textTertiary, fontSize: 11 },
                  ]}
                >
                  Monthly average deposits
                </Text>
              </View>
            </View>
            {isIncomeAvailable ? (
              <MoneyDisplay
                amount={cashflow.monthlyIncome!}
                currency={cashflow.currency}
                size="md"
                flow="income"
                showSign
              />
            ) : (
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.textTertiary, fontSize: 13 },
                ]}
              >
                —
              </Text>
            )}
          </View>

          <View
            style={[styles.divider, { backgroundColor: theme.colors.border }]}
          />

          {/* Outflow Row */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: theme.colors.backgroundAlt },
                ]}
              >
                <Icon
                  name="arrow-up-right"
                  size={14}
                  color={theme.colors.textSecondary}
                />
              </View>
              <View>
                <Text
                  style={[
                    theme.typography.bodyMedium,
                    { color: theme.colors.textPrimary, fontWeight: '600' },
                  ]}
                >
                  Recorded Outflow
                </Text>
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textTertiary, fontSize: 11 },
                  ]}
                >
                  Monthly expenses & transfers
                </Text>
              </View>
            </View>
            {isOutflowAvailable ? (
              <MoneyDisplay
                amount={cashflow.monthlyOutflow!}
                currency={cashflow.currency}
                size="md"
                flow="neutral"
                showSign={false}
              />
            ) : (
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.textTertiary, fontSize: 13 },
                ]}
              >
                —
              </Text>
            )}
          </View>

          <View
            style={[styles.divider, { backgroundColor: theme.colors.border }]}
          />

          {/* Savings Rate Row */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: theme.colors.primaryLight },
                ]}
              >
                <Icon
                  name="pie-chart"
                  size={14}
                  color={theme.colors.primary}
                />
              </View>
              <View>
                <Text
                  style={[
                    theme.typography.bodyMedium,
                    { color: theme.colors.textPrimary, fontWeight: '600' },
                  ]}
                >
                  Savings Rate
                </Text>
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textTertiary, fontSize: 11 },
                  ]}
                >
                  Share of inflow retained
                </Text>
              </View>
            </View>
            <Text
              style={[
                theme.typography.bodyMedium,
                {
                  color: theme.colors.textPrimary,
                  fontWeight: '700',
                  fontSize: 15,
                },
              ]}
            >
              {isSavingsAvailable ? `${cashflow.savingsRatePercent}%` : '—'}
            </Text>
          </View>
        </View>

        {/* Narrative & Calculation Explanation */}
        <Text
          style={[
            theme.typography.bodyMedium,
            { color: theme.colors.textPrimary, fontWeight: '600', marginTop: 14 },
          ]}
        >
          Calculation Methodology
        </Text>
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginTop: 4, lineHeight: 18 },
          ]}
        >
          Net cashflow represents the difference between recorded inflows and outflows across your consented financial institutions during the profile period.
        </Text>

        {cashflow.supportingNote && (
          <View
            style={[
              styles.noticeBox,
              {
                backgroundColor: theme.colors.backgroundAlt,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Icon
              name="info"
              size={13}
              color={theme.colors.textTertiary}
              style={{ marginRight: 8, marginTop: 1 }}
            />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 16, flex: 1 },
              ]}
            >
              {cashflow.supportingNote}
            </Text>
          </View>
        )}

        {/* Dismiss Button */}
        <Button
          label="Done"
          onPress={onClose}
          variant="primary"
          size="md"
          fullWidth
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 24,
  },
  heroBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    marginBottom: 14,
  },
  breakdownCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
    marginBottom: 16,
  },
});
