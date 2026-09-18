/**
 * TAMVA ReviewTransferStep Component (Screen 4)
 *
 * Pre-authorization transaction review screen.
 * Ensures the customer cannot accidentally send money to an unintended recipient.
 *
 * NOTE: Fee is represented as configurable estimated transaction fee,
 * avoiding any unauthorized claims of guaranteed zero-fee pricing.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { TransferDraft } from '../../types/transfer';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';
import { MoneyDisplay } from '../financial/MoneyDisplay';

export interface ReviewTransferStepProps {
  draft: TransferDraft;
  onConfirm: () => void;
  onEdit: () => void;
  onBack: () => void;
}

export const ReviewTransferStep: React.FC<ReviewTransferStepProps> = ({
  draft,
  onConfirm,
  onEdit,
  onBack,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  if (!draft.sourceAccount || !draft.recipient) return null;

  const totalAmount = draft.amount + draft.estimatedFee;

  const handleConfirm = () => {
    haptics.selection();
    onConfirm();
  };

  const handleEdit = () => {
    haptics.selection();
    onEdit();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. SCREEN HEADER */}
      <ScreenHeader
        title="Review transfer"
        subtitle="Verify transfer details"
        showBack={true}
        onBackPress={onBack}
        borderBottom={true}
      />

      {/* 2. SCROLLABLE REVIEW CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 120 },
        ]}
      >
        {/* Top Focal Amount Card */}
        <Card variant="elevated" style={styles.topCard}>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary, textTransform: 'uppercase' },
            ]}
          >
            Transfer Amount
          </Text>

          <View style={styles.amountRow}>
            <MoneyDisplay
              amount={draft.amount}
              currency={draft.currency}
              size="lg"
            />
          </View>

          <View style={styles.recipientPill}>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textSecondary },
              ]}
            >
              Sending to{' '}
            </Text>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textPrimary, fontWeight: '700' },
              ]}
            >
              {draft.recipient.name}
            </Text>
          </View>
        </Card>

        {/* Structured Transfer Breakdown Card */}
        <Card variant="outlined" style={styles.breakdownCard}>
          {/* FROM */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
              FROM
            </Text>
            <View style={styles.detailValueColumn}>
              <View style={styles.entityRow}>
                <BrandLogo
                  name={draft.sourceAccount.institutionName}
                  containerSize={24}
                  shape="circle"
                  fallbackIcon="credit-card"
                  fallbackBg={theme.colors.backgroundAlt}
                />
                <Text
                  style={[
                    theme.typography.bodyMedium,
                    { color: theme.colors.textPrimary, fontWeight: '600', marginLeft: 8 },
                  ]}
                >
                  {draft.sourceAccount.institutionName}
                </Text>
              </View>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textTertiary, marginTop: 2 },
                ]}
              >
                {draft.sourceAccount.accountType} • {draft.sourceAccount.maskedIdentifier}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.rowDivider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          {/* TO */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
              TO
            </Text>
            <View style={styles.detailValueColumn}>
              <View style={styles.entityRow}>
                <BrandLogo
                  name={draft.recipient.institutionName}
                  containerSize={24}
                  shape="circle"
                  fallbackIcon="user"
                  fallbackBg={theme.colors.backgroundAlt}
                />
                <Text
                  style={[
                    theme.typography.bodyMedium,
                    { color: theme.colors.textPrimary, fontWeight: '600', marginLeft: 8 },
                  ]}
                >
                  {draft.recipient.name}
                </Text>
              </View>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textTertiary, marginTop: 2 },
                ]}
              >
                {draft.recipient.networkOrBank} • {draft.recipient.maskedAccount}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.rowDivider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          {/* TRANSFER AMOUNT */}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
              AMOUNT
            </Text>
            <MoneyDisplay
              amount={draft.amount}
              currency={draft.currency}
              size="sm"
            />
          </View>

          <View
            style={[
              styles.rowDivider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          {/* ESTIMATED FEE */}
          <View style={styles.detailRow}>
            <View>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                FEE
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textTertiary, fontSize: 10 },
                ]}
              >
                Estimated
              </Text>
            </View>
            <MoneyDisplay
              amount={draft.estimatedFee}
              currency={draft.currency}
              size="sm"
            />
          </View>

          <View
            style={[
              styles.rowDivider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          {/* TOTAL PAYABLE */}
          <View style={styles.detailRow}>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textPrimary, fontWeight: '700' },
              ]}
            >
              TOTAL
            </Text>
            <MoneyDisplay
              amount={totalAmount}
              currency={draft.currency}
              size="md"
            />
          </View>

          {/* REFERENCE NOTE */}
          {Boolean(draft.note) && (
            <>
              <View
                style={[
                  styles.rowDivider,
                  { backgroundColor: theme.colors.border },
                ]}
              />
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  REFERENCE
                </Text>
                <Text
                  style={[
                    theme.typography.bodyMedium,
                    { color: theme.colors.textPrimary, fontWeight: '500' },
                  ]}
                >
                  {draft.note}
                </Text>
              </View>
            </>
          )}
        </Card>

        {/* Unobtrusive Transparency Note */}
        <View
          style={[
            styles.transparencyCard,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon name="info" size={16} color={theme.colors.textTertiary} />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginLeft: 8, flex: 1 },
            ]}
          >
            Review the details before confirming your transfer. Transfers are initiated using your consented financial connection.
          </Text>
        </View>
      </ScrollView>

      {/* 3. FIXED BOTTOM ACTIONS */}
      <View
        style={[
          styles.bottomActions,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <Button
          label="Confirm transfer"
          variant="primary"
          size="lg"
          fullWidth={true}
          onPress={handleConfirm}
          accessibilityHint="Advances to PIN confirmation"
        />

        <View style={styles.secondaryButtonWrapper}>
          <Button
            label="Edit"
            variant="tertiary"
            size="md"
            fullWidth={true}
            onPress={handleEdit}
            accessibilityHint="Returns to edit transfer amount"
          />
        </View>
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
  topCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  amountRow: {
    marginTop: 6,
    marginBottom: 10,
  },
  recipientPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownCard: {
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: 0.5,
  },
  detailValueColumn: {
    alignItems: 'flex-end',
  },
  entityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  transparencyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  secondaryButtonWrapper: {
    marginTop: 8,
  },
});
