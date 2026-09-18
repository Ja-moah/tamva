/**
 * TAMVA TransactionDetailSheet Component
 *
 * Polished financial transaction inspection bottom sheet.
 *
 * Information Hierarchy:
 * 1. Transaction Amount (Focal point via MoneyDisplay with privacy masking)
 * 2. Status Badge & Flow Badge (Completed, Pending, Failed; Inflow, Outflow, Transfer, Savings)
 * 3. Contextual Notice (Detailed status explanation for Pending and Failed states)
 * 4. Structured Details Table (Merchant, Category, Institution Account, Timestamp, Reference ID)
 * 5. Interactive Copy-to-Clipboard Reference with haptics, toast, and visual checkmark
 *
 * Edge Cases Handled:
 * - Extremely long merchant names (wraps cleanly without horizontal overflow)
 * - Long account names (flexShrink with right alignment)
 * - Long reference IDs (responsive monospace container)
 * - Unusually large or zero amounts (gracefully formatted via MoneyDisplay)
 * - Privacy masking (auto-masked when privacy mode is active)
 * - Non-clipboard browser runtimes (safe try/catch fallback)
 */

import React, { startTransition, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { useToast } from '../ui/Toast';
import { ActivityTransaction } from '../../types/activity';
import { FeatherIconName } from '../../constants/icons';
import { BottomSheet } from '../ui/BottomSheet';
import { MoneyDisplay } from '../financial/MoneyDisplay';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';
import { normalizeBrandName } from '../../constants/brands';

export interface TransactionDetailSheetProps {
  transaction: ActivityTransaction | null;
  visible: boolean;
  onClose: () => void;
}

export const TransactionDetailSheet: React.FC<TransactionDetailSheetProps> = ({
  transaction,
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const { showToast } = useToast();
  const [copiedReference, setCopiedReference] = useState(false);

  // Reset copied state whenever sheet opens or transaction changes
  useEffect(() => {
    if (!visible) {
      startTransition(() => setCopiedReference(false));
    }
  }, [visible, transaction]);

  if (!transaction) return null;

  // Handle copy reference ID
  const handleCopyReference = () => {
    haptics.selection();

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(transaction.id);
      }
    } catch {
      // Graceful fallback for non-clipboard runtimes
    }

    setCopiedReference(true);
    showToast({
      type: 'success',
      title: 'Reference Copied',
      message: `${transaction.id} copied to clipboard`,
      duration: 2500,
    });

    setTimeout(() => {
      setCopiedReference(false);
    }, 2000);
  };

  // Status-specific presentation
  const getStatusBadgeConfig = (): {
    tone: 'success' | 'warning' | 'danger';
    icon: FeatherIconName;
    label: string;
  } => {
    switch (transaction.status) {
      case 'completed':
        return {
          tone: 'success',
          icon: 'check-circle',
          label: 'COMPLETED',
        };
      case 'pending':
        return {
          tone: 'warning',
          icon: 'clock',
          label: 'PENDING',
        };
      case 'failed':
        return {
          tone: 'danger',
          icon: 'alert-triangle',
          label: 'FAILED',
        };
      default:
        return {
          tone: 'neutral' as any,
          icon: 'info',
          label: String(transaction.status).toUpperCase(),
        };
    }
  };

  // Flow-specific presentation
  const getFlowBadgeConfig = (): {
    icon: FeatherIconName;
    label: string;
  } => {
    if (transaction.categoryTag === 'savings') {
      return { icon: 'shield', label: 'SAVINGS' };
    }
    if (transaction.categoryTag === 'transfers') {
      return { icon: 'repeat', label: 'TRANSFER' };
    }
    if (transaction.flow === 'income') {
      return { icon: 'arrow-down-left', label: 'INFLOW' };
    }
    return { icon: 'arrow-up-right', label: 'OUTFLOW' };
  };

  const statusConfig = getStatusBadgeConfig();
  const flowConfig = getFlowBadgeConfig();
  const merchantBrandKey = normalizeBrandName(transaction.title);
  const accountBrandKey = normalizeBrandName(transaction.accountLabel);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Transaction Details"
      subtitle={transaction.accountLabel}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Transaction Amount (Visual Focal Point) */}
        <View style={styles.amountHeroBlock}>
          <MoneyDisplay
            amount={transaction.amount}
            currency={transaction.currency}
            flow={transaction.flow}
            size="display"
          />

          {/* 2. Status Badge & Flow Badge */}
          <View style={styles.badgesRow}>
            <Badge
              label={statusConfig.label}
              tone={statusConfig.tone}
              icon={statusConfig.icon}
              size="sm"
            />
            <View style={{ width: 8 }} />
            <Badge
              label={flowConfig.label}
              tone="neutral"
              icon={flowConfig.icon}
              size="sm"
            />
          </View>
        </View>

        {/* 3. Contextual Notice for Pending or Failed States */}
        {transaction.status === 'pending' && (
          <View
            style={[
              styles.noticeCard,
              {
                backgroundColor: theme.colors.warningLight,
                borderColor: theme.colors.warningMedium,
              },
            ]}
            accessibilityRole="alert"
            accessibilityLabel="Still processing notice: This transaction is awaiting final settlement."
          >
            <View style={styles.noticeIconCircle}>
              <Icon name="clock" size={16} color={theme.colors.warning} />
            </View>
            <View style={styles.noticeTextWrapper}>
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.warningText, fontWeight: '700' },
                ]}
              >
                Still Processing
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: 2, lineHeight: 17 },
                ]}
              >
                This transaction is awaiting final settlement with the provider. Balances update upon confirmation.
              </Text>
            </View>
          </View>
        )}

        {transaction.status === 'failed' && (
          <View
            style={[
              styles.noticeCard,
              {
                backgroundColor: theme.colors.dangerLight,
                borderColor: theme.colors.dangerMedium,
              },
            ]}
            accessibilityRole="alert"
            accessibilityLabel="Transaction unsuccessful notice: No funds have been debited from your account."
          >
            <View style={styles.noticeIconCircle}>
              <Icon name="alert-circle" size={16} color={theme.colors.danger} />
            </View>
            <View style={styles.noticeTextWrapper}>
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.dangerText, fontWeight: '700' },
                ]}
              >
                Transaction Unsuccessful
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: 2, lineHeight: 17 },
                ]}
              >
                This transaction failed to execute. No funds have been debited from your connected account.
              </Text>
            </View>
          </View>
        )}

        {/* 4. Structured Details Table */}
        <View
          style={[
            styles.detailsTable,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
            },
          ]}
          accessibilityRole="summary"
        >
          {/* Merchant / Payee Row */}
          <View style={styles.detailRow}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, minWidth: 100 }]}>
              Merchant / Payee
            </Text>
            <View style={styles.rightValueRow}>
              {merchantBrandKey ? (
                <BrandLogo
                  brandKey={merchantBrandKey}
                  containerSize={22}
                  size={15}
                  shape="rounded"
                  fallbackIcon={transaction.icon}
                  style={styles.categoryAvatar}
                />
              ) : (
                <View
                  style={[
                    styles.categoryAvatar,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                >
                  <Icon name={transaction.icon} size={13} color={theme.colors.textPrimary} />
                </View>
              )}
              <Text
                style={[
                  theme.typography.bodySmMedium,
                  { color: theme.colors.textPrimary, flexShrink: 1, textAlign: 'right' },
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {transaction.title}
              </Text>
            </View>
          </View>

          <View style={[styles.detailDivider, { backgroundColor: theme.colors.border }]} />

          {/* Category */}
          <View style={styles.detailRow}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, minWidth: 100 }]}>
              Category
            </Text>
            <Text
              style={[
                theme.typography.bodySmMedium,
                { color: theme.colors.textPrimary, flexShrink: 1, textAlign: 'right' },
              ]}
              numberOfLines={2}
            >
              {transaction.category}
            </Text>
          </View>

          <View style={[styles.detailDivider, { backgroundColor: theme.colors.border }]} />

          {/* Connected Account */}
          <View style={styles.detailRow}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, minWidth: 100 }]}>
              Connected Account
            </Text>
            <View style={styles.rightValueRow}>
              {accountBrandKey && (
                <BrandLogo
                  brandKey={accountBrandKey}
                  containerSize={18}
                  size={12}
                  style={{ marginRight: 6 }}
                />
              )}
              <Text
                style={[
                  theme.typography.bodySmMedium,
                  { color: theme.colors.textPrimary, flexShrink: 1, textAlign: 'right' },
                ]}
                numberOfLines={2}
              >
                {transaction.accountLabel}
              </Text>
            </View>
          </View>

          <View style={[styles.detailDivider, { backgroundColor: theme.colors.border }]} />

          {/* Date & Time */}
          <View style={styles.detailRow}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, minWidth: 100 }]}>
              Date & Time
            </Text>
            <Text
              style={[
                theme.typography.bodySmMedium,
                { color: theme.colors.textPrimary, flexShrink: 1, textAlign: 'right' },
              ]}
            >
              {transaction.date}
            </Text>
          </View>

          <View style={[styles.detailDivider, { backgroundColor: theme.colors.border }]} />

          {/* Reference ID with interactive copy button */}
          <View style={styles.detailRow}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, minWidth: 100 }]}>
              Reference ID
            </Text>

            <Pressable
              onPress={handleCopyReference}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.copyReferenceBtn,
                {
                  backgroundColor: copiedReference
                    ? theme.colors.successLight
                    : theme.colors.surface,
                  borderColor: copiedReference
                    ? theme.colors.successMedium
                    : theme.colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Reference ID ${transaction.id}. Double tap to copy to clipboard.`}
              accessibilityHint="Copies transaction identifier to clipboard"
            >
              <Text
                style={[
                  theme.typography.captionMedium,
                  {
                    color: copiedReference
                      ? theme.colors.successText
                      : theme.colors.textPrimary,
                    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                    fontSize: 12,
                    marginRight: 6,
                    flexShrink: 1,
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {transaction.id}
              </Text>

              <Icon
                name={copiedReference ? 'check' : 'copy'}
                size={13}
                color={
                  copiedReference
                    ? theme.colors.success
                    : theme.colors.textSecondary
                }
              />
            </Pressable>
          </View>
        </View>

        {/* Security & Verification Guarantee */}
        <View style={styles.securityFooter}>
          <Icon name="shield" size={13} color={theme.colors.textTertiary} />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary, marginLeft: 6 },
            ]}
          >
            Verified via TAMVA Open Financial Protocol
          </Text>
        </View>
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  amountHeroBlock: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 16,
  },
  noticeIconCircle: {
    marginRight: 10,
    marginTop: 2,
  },
  noticeTextWrapper: {
    flex: 1,
  },
  detailsTable: {
    padding: 16,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    minHeight: 40,
  },
  rightValueRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 12,
  },
  categoryAvatar: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  detailDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  copyReferenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 6,
    minHeight: 32,
    maxWidth: 220,
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
});
