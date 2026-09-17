/**
 * TAMVA ProtectionSignalSheet Component
 *
 * Detailed inspection bottom sheet for the 4 Financial Protection signals:
 * - Consent health
 * - Account connections
 * - Activity monitoring
 * - Account access
 *
 * Explains what the signal means, supporting metrics, contributing accounts,
 * freshness, and actions if attention is required.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import {
  ProtectionSignal,
  ProtectionAccountDetail,
} from '../../types/protection';

export interface ProtectionSignalSheetProps {
  visible: boolean;
  onClose: () => void;
  signal: ProtectionSignal | null;
  accounts?: ProtectionAccountDetail[];
  onSelectAccount?: (account: ProtectionAccountDetail) => void;
  onNavigateToConsent?: () => void;
}

export const ProtectionSignalSheet: React.FC<ProtectionSignalSheetProps> = ({
  visible,
  onClose,
  signal,
  accounts = [],
  onSelectAccount,
  onNavigateToConsent,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  if (!signal) return null;

  const statusTone: 'success' | 'warning' | 'neutral' =
    signal.status === 'healthy'
      ? 'success'
      : signal.status === 'attention'
      ? 'warning'
      : 'neutral';

  const statusLabel =
    signal.status === 'healthy'
      ? 'Healthy'
      : signal.status === 'attention'
      ? 'Attention'
      : 'Not available';

  // Filter relevant accounts if specified
  const relevantAccounts = signal.relevantAccountIds
    ? accounts.filter((acc) => signal.relevantAccountIds?.includes(acc.id))
    : [];

  const handleAccountPress = (acc: ProtectionAccountDetail) => {
    haptics.selection();
    if (onSelectAccount) {
      onSelectAccount(acc);
    }
  };

  const handleActionPress = () => {
    haptics.selection();
    if (onNavigateToConsent) {
      onNavigateToConsent();
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={signal.title}
      subtitle="Protection signal details"
      maxHeight="85%"
    >
      <View style={styles.container}>
        {/* 1. Status Row */}
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.statusLeft}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Icon
                name={signal.icon}
                size={18}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.statusTextCol}>
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Current standing
              </Text>
              <Text
                style={[
                  theme.typography.subheading,
                  { color: theme.colors.textPrimary, fontSize: 16, marginTop: 1 },
                ]}
              >
                {signal.title}
              </Text>
            </View>
          </View>

          <Badge
            label={statusLabel}
            tone={statusTone}
            size="md"
            showDot
          />
        </View>

        {/* 2. Short Explanation */}
        <View style={styles.sectionBlock}>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textPrimary, lineHeight: 22 },
            ]}
          >
            {signal.description}
          </Text>
        </View>

        {/* 3. "What this means" Callout */}
        {signal.whatThisMeans && (
          <View
            style={[
              styles.calloutBox,
              {
                backgroundColor: theme.colors.backgroundAlt,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.captionMedium,
                {
                  color: theme.colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontSize: 11,
                  marginBottom: 4,
                },
              ]}
            >
              What this means
            </Text>
            <Text
              style={[
                theme.typography.bodySm,
                { color: theme.colors.textPrimary, lineHeight: 20 },
              ]}
            >
              {signal.whatThisMeans}
            </Text>
          </View>
        )}

        {/* 4. Supporting Details Grid/List */}
        {signal.supportingDetails && signal.supportingDetails.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text
              style={[
                theme.typography.subheading,
                {
                  color: theme.colors.textPrimary,
                  fontSize: 15,
                  marginBottom: 8,
                },
              ]}
            >
              Supporting details
            </Text>

            <View
              style={[
                styles.detailsBox,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {signal.supportingDetails.map((detail, index) => {
                const isLast = index === signal.supportingDetails!.length - 1;
                return (
                  <View
                    key={detail.label}
                    style={[
                      styles.detailRow,
                      !isLast && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        theme.typography.bodySm,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {detail.label}
                    </Text>
                    <Text
                      style={[
                        theme.typography.bodySmMedium,
                        { color: theme.colors.textPrimary },
                      ]}
                    >
                      {detail.value}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 5. Relevant Connected Accounts List */}
        {relevantAccounts.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text
              style={[
                theme.typography.subheading,
                {
                  color: theme.colors.textPrimary,
                  fontSize: 15,
                  marginBottom: 8,
                },
              ]}
            >
              Contributing accounts
            </Text>

            <View
              style={[
                styles.accountsBox,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              {relevantAccounts.map((acc, index) => {
                const isLast = index === relevantAccounts.length - 1;
                const iconName =
                  acc.institutionType === 'mobile_money'
                    ? 'smartphone'
                    : acc.accountName.includes('Vault')
                    ? 'shield'
                    : 'credit-card';

                    const accountBadgeLabel =
                      acc.connectionStatus === 'connected'
                        ? 'Connected'
                        : acc.connectionStatus === 'attention'
                        ? 'Attention'
                        : 'Disconnected';
                    const accountBadgeTone: 'success' | 'warning' | 'danger' =
                      acc.connectionStatus === 'connected'
                        ? 'success'
                        : acc.connectionStatus === 'attention'
                        ? 'warning'
                        : 'danger';

                    return (
                      <Pressable
                        key={acc.id}
                        onPress={() => handleAccountPress(acc)}
                        style={({ pressed }) => [
                          styles.accountPressableRow,
                          !isLast && {
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: theme.colors.border,
                          },
                          {
                            backgroundColor: pressed
                              ? theme.colors.backgroundAlt
                              : 'transparent',
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`View ${acc.institutionName} details, ${accountBadgeLabel}`}
                      >
                        <View
                          style={[
                            styles.accountIconCircle,
                            { backgroundColor: theme.colors.backgroundAlt },
                          ]}
                        >
                          <Icon
                            name={iconName}
                            size={14}
                            color={theme.colors.textPrimary}
                          />
                        </View>

                        <View style={styles.accountInfoCol}>
                          <Text
                            style={[
                              theme.typography.bodyMedium,
                              {
                                color: theme.colors.textPrimary,
                                fontSize: 14,
                                fontWeight: '600',
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {acc.institutionName}
                          </Text>
                          <Text
                            style={[
                              theme.typography.caption,
                              { color: theme.colors.textSecondary, marginTop: 1 },
                            ]}
                            numberOfLines={1}
                          >
                            {acc.accountName} • {acc.maskedIdentifier}
                          </Text>
                        </View>

                        <Badge
                          label={accountBadgeLabel}
                          tone={accountBadgeTone}
                          size="sm"
                          showDot
                        />

                        <Icon
                          name="chevron-right"
                          size={14}
                          color={theme.colors.textTertiary}
                          style={{ marginLeft: 6 }}
                        />
                      </Pressable>
                    );
                  })}
            </View>
          </View>
        )}

        {/* 6. Informational Note / Conservative Disclosure */}
        <View style={styles.disclosureSection}>
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
            {signal.infoNote ||
              'Protection signals reflect the latest consented account data available to TAMVA.'}
          </Text>
        </View>

        {/* 7. Action Button if attention/review needed */}
        {signal.actionLabel && onNavigateToConsent && (
          <View style={styles.actionContainer}>
            <Button
              label={signal.actionLabel}
              onPress={handleActionPress}
              variant="tertiary"
              size="sm"
            />
          </View>
        )}

        {/* 8. Done Button */}
        <View style={styles.buttonContainer}>
          <Button
            label="Done"
            onPress={onClose}
            variant="secondary"
            size="md"
          />
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextCol: {
    flex: 1,
    minWidth: 0,
  },
  sectionBlock: {
    marginBottom: 14,
  },
  calloutBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  detailsBox: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  accountsBox: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accountPressableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  accountIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  accountInfoCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  disclosureSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  disclosureIcon: {
    marginTop: 1,
  },
  actionContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonContainer: {
    marginTop: 4,
  },
});
