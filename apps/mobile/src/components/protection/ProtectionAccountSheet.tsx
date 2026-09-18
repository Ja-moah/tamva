/**
 * TAMVA ProtectionAccountSheet Component
 *
 * Detailed inspection bottom sheet for an individual connected account
 * within the Financial Protection context:
 * - Institution name & account type
 * - Masked identifier (never full credentials)
 * - Dynamic connection & protection statuses
 * - Specific status reason banner when attention/disconnected
 * - Last checked freshness
 * - Approved consent scopes
 * - Calm action to manage permissions in Consent
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';
import { ProtectionAccountDetail } from '../../types/protection';
import { ConsentedScope } from '../../types/accounts';

export interface ProtectionAccountSheetProps {
  visible: boolean;
  onClose: () => void;
  account: ProtectionAccountDetail | null;
  onNavigateToConsent?: () => void;
}

const SCOPE_META: Record<
  ConsentedScope,
  { label: string; description: string; icon: any }
> = {
  account_identity: {
    label: 'Identity',
    description: 'Confirms account ownership and institution link',
    icon: 'user-check',
  },
  balances: {
    label: 'Balances',
    description: 'Enables consolidated financial overview',
    icon: 'credit-card',
  },
  transaction_history: {
    label: 'Transaction history',
    description: 'Powers cashflow patterns and activity monitoring',
    icon: 'activity',
  },
  income_verification: {
    label: 'Income verification',
    description: 'Analyzes recurring regularity and stability signals',
    icon: 'trending-up',
  },
};

export const ProtectionAccountSheet: React.FC<ProtectionAccountSheetProps> = ({
  visible,
  onClose,
  account,
  onNavigateToConsent,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  if (!account) return null;

  const iconName =
    account.institutionType === 'mobile_money'
      ? 'smartphone'
      : account.accountName.includes('Vault')
      ? 'shield'
      : 'credit-card';

  const connectionLabel =
    account.connectionStatus === 'connected'
      ? 'Connected'
      : account.connectionStatus === 'attention'
      ? 'Attention'
      : 'Disconnected';
  const connectionTone: 'success' | 'warning' | 'danger' =
    account.connectionStatus === 'connected'
      ? 'success'
      : account.connectionStatus === 'attention'
      ? 'warning'
      : 'danger';

  const protectionLabel =
    account.protectionStatus === 'healthy'
      ? 'Healthy'
      : account.protectionStatus === 'attention'
      ? 'Attention'
      : 'Not available';
  const protectionTone: 'success' | 'warning' | 'neutral' =
    account.protectionStatus === 'healthy'
      ? 'success'
      : account.protectionStatus === 'attention'
      ? 'warning'
      : 'neutral';

  const handleManageConsent = () => {
    haptics.selection();
    onClose();
    if (onNavigateToConsent) {
      onNavigateToConsent();
    }
  };

  const actionButtonText = account.actionRequired
    ? `${account.actionRequired} →`
    : 'Manage in Consent Settings →';

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={account.institutionName}
      subtitle={`${account.accountName} • ${account.maskedIdentifier}`}
      maxHeight="85%"
    >
      <View style={styles.container}>
        {/* 1. Account Summary Card */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <BrandLogo
              name={account.institutionName}
              containerSize={40}
              shape="rounded"
              isDisconnected={account.connectionStatus === 'disconnected'}
              fallbackIcon={iconName}
              fallbackIconColor={
                account.connectionStatus === 'attention'
                  ? theme.colors.warning
                  : theme.colors.primary
              }
            />

            <View style={styles.headerTextCol}>
              <Text
                style={[
                  theme.typography.subheading,
                  { color: theme.colors.textPrimary, fontSize: 16 },
                ]}
              >
                {account.institutionName}
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: 1 },
                ]}
              >
                {account.accountName} • {account.maskedIdentifier}
              </Text>
            </View>

            <Badge
              label={connectionLabel}
              tone={connectionTone}
              size="sm"
              showDot
            />
          </View>
        </View>

        {/* 2. Status Reason Banner (if attention/disconnected) */}
        {account.statusReason && (
          <View
            style={[
              styles.reasonBox,
              {
                backgroundColor:
                  account.connectionStatus === 'attention'
                    ? theme.colors.warningLight
                    : theme.colors.backgroundAlt,
                borderColor:
                  account.connectionStatus === 'attention'
                    ? theme.colors.warningMedium
                    : theme.colors.border,
              },
            ]}
          >
            <View style={styles.reasonHeaderRow}>
              <Icon
                name={
                  account.connectionStatus === 'attention'
                    ? 'alert-circle'
                    : 'info'
                }
                size={14}
                color={
                  account.connectionStatus === 'attention'
                    ? theme.colors.warning
                    : theme.colors.textSecondary
                }
              />
              <Text
                style={[
                  theme.typography.captionMedium,
                  {
                    color:
                      account.connectionStatus === 'attention'
                        ? theme.colors.warningText
                        : theme.colors.textSecondary,
                  },
                ]}
              >
                Status note
              </Text>
            </View>
            <Text
              style={[
                theme.typography.bodySm,
                {
                  color: theme.colors.textPrimary,
                  marginTop: 4,
                  lineHeight: 18,
                },
              ]}
            >
              {account.statusReason}
            </Text>
          </View>
        )}

        {/* 3. Status Attributes */}
        <View
          style={[
            styles.attributesCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.attributeRow}>
            <Text
              style={[
                theme.typography.bodySm,
                { color: theme.colors.textSecondary },
              ]}
            >
              Connection status
            </Text>
            <Badge
              label={connectionLabel}
              tone={connectionTone}
              size="sm"
              showDot
            />
          </View>

          <View
            style={[
              styles.attributeRow,
              {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.bodySm,
                { color: theme.colors.textSecondary },
              ]}
            >
              Protection standing
            </Text>
            <Badge
              label={protectionLabel}
              tone={protectionTone}
              size="sm"
              showDot
            />
          </View>

          <View
            style={[
              styles.attributeRow,
              {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.bodySm,
                { color: theme.colors.textSecondary },
              ]}
            >
              Last checked
            </Text>
            <Text
              style={[
                theme.typography.bodySmMedium,
                { color: theme.colors.textPrimary },
              ]}
            >
              {account.lastChecked}
            </Text>
          </View>
        </View>

        {/* 4. Consent Scopes */}
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
            Approved consent scopes
          </Text>

          <View
            style={[
              styles.scopesBox,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {account.consentScopes.map((scopeKey, index) => {
              const meta = SCOPE_META[scopeKey];
              const isLast = index === account.consentScopes.length - 1;

              if (!meta) return null;

              return (
                <View
                  key={scopeKey}
                  style={[
                    styles.scopeItemRow,
                    !isLast && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.scopeIconCircle,
                      { backgroundColor: theme.colors.backgroundAlt },
                    ]}
                  >
                    <Icon
                      name={meta.icon}
                      size={13}
                      color={theme.colors.primary}
                    />
                  </View>

                  <View style={styles.scopeTextCol}>
                    <Text
                      style={[
                        theme.typography.bodyMedium,
                        {
                          color: theme.colors.textPrimary,
                          fontSize: 13,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      {meta.label}
                    </Text>
                    <Text
                      style={[
                        theme.typography.caption,
                        {
                          color: theme.colors.textSecondary,
                          lineHeight: 16,
                          marginTop: 1,
                        },
                      ]}
                    >
                      {meta.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 5. Privacy & Consent Control Footnote */}
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
            TAMVA only accesses data within your consented scopes. Permissions can be modified or revoked at any time.
          </Text>
        </View>

        {/* 6. Direct Manage Action */}
        <Pressable
          onPress={handleManageConsent}
          style={({ pressed }) => [
            styles.manageAction,
            {
              backgroundColor: pressed
                ? theme.colors.backgroundAlt
                : 'transparent',
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={actionButtonText}
        >
          <Text
            style={[
              theme.typography.buttonSm,
              {
                color:
                  account.connectionStatus === 'attention'
                    ? theme.colors.warning
                    : theme.colors.primary,
                fontSize: 13,
              },
            ]}
          >
            {actionButtonText}
          </Text>
        </Pressable>

        {/* 7. Done Button */}
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
  summaryCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  reasonBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  reasonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attributesCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  sectionBlock: {
    marginBottom: 14,
  },
  scopesBox: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  scopeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  scopeIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeTextCol: {
    flex: 1,
    minWidth: 0,
  },
  disclosureSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  disclosureIcon: {
    marginTop: 1,
  },
  manageAction: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  buttonContainer: {
    marginTop: 4,
  },
});
