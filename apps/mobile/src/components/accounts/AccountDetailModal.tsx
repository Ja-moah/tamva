/**
 * TAMVA AccountDetailModal Component
 *
 * Polished bottom sheet for inspecting connected financial institutions:
 * - State-consistent UI for CONNECTED, SYNCING, ACTION_REQUIRED, and DISCONNECTED
 * - Status banner with clear explanatory text and actionable guidance
 * - Balance display (masked by PrivacyContext; historical styling when disconnected)
 * - Consented data permissions breakdown (ACTIVE, EXPIRED, or REVOKED tags)
 * - Connection metadata (connection date, last sync, institution type, duration)
 * - Context-aware action matrix:
 *     - Connected: Sync Now, Manage Consent, Disconnect
 *     - Syncing: Syncing in progress (disabled), Manage Consent, Disconnect
 *     - Action Required: Review Connection, Manage Consent, Disconnect
 *     - Disconnected: Reconnect Institution
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { useToast } from '../ui/Toast';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';
import { MoneyDisplay } from '../financial/MoneyDisplay';
import { AccountStatusBadge } from './AccountStatusBadge';
import {
  ConnectedAccount,
  ConsentedScope,
  isConsentExpired,
} from '../../types/accounts';
import {
  CONSENTED_SCOPE_DETAILS,
  CONSENT_DURATION_OPTIONS,
} from '../../demo/data/mockConnectedAccountsData';
import { FeatherIconName } from '../../constants/icons';

export interface AccountDetailModalProps {
  account: ConnectedAccount | null;
  visible: boolean;
  onClose: () => void;
  onSync?: (accountId: string) => void;
  onManagePermissions?: (accountId: string) => void;
  onDisconnect?: (accountId: string) => void;
  onReconnect?: (accountId: string) => void;
  onReviewConnection?: (accountId: string) => void;
}

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  account,
  visible,
  onClose,
  onSync,
  onManagePermissions,
  onDisconnect,
  onReconnect,
  onReviewConnection,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const { showToast } = useToast();
  const [isSyncingLocal, setIsSyncingLocal] = useState(false);

  if (!account) return null;

  const isDisconnected = account.status === 'disconnected';
  const isSyncing = account.status === 'syncing' || isSyncingLocal;
  const isActionRequired = account.status === 'action_required';
  const isExpired = isConsentExpired(account);

  const handleSyncPress = () => {
    if (isSyncing || isDisconnected || isActionRequired) return;
    haptics.lightImpact();
    setIsSyncingLocal(true);
    onSync?.(account.id);

    showToast({
      type: 'info',
      title: 'Synchronizing Account',
      message: `Fetching latest transactions and balance from ${account.institutionName}`,
      duration: 2500,
    });

    setTimeout(() => {
      setIsSyncingLocal(false);
    }, 1500);
  };

  const handlePermissionsPress = () => {
    haptics.selection();
    onManagePermissions?.(account.id);
  };

  const handleDisconnectPress = () => {
    haptics.warning();
    onDisconnect?.(account.id);
  };

  const handleReconnectPress = () => {
    haptics.lightImpact();
    onReconnect?.(account.id);
  };

  const handleReviewPress = () => {
    haptics.lightImpact();
    onReviewConnection?.(account.id);
  };

  // Institution icon resolution
  const getIconConfig = (): { name: FeatherIconName; bg: string; color: string } => {
    switch (account.institutionType) {
      case 'mobile_money':
        return {
          name: 'smartphone',
          bg: theme.colors.primaryLight,
          color: theme.colors.primary,
        };
      case 'investment':
        return {
          name: 'trending-up',
          bg: theme.colors.successLight,
          color: theme.colors.successText,
        };
      case 'bank':
      default:
        return {
          name: account.icon ?? 'credit-card',
          bg: theme.colors.surfaceElevated,
          color: theme.colors.textPrimary,
        };
    }
  };

  const iconConfig = getIconConfig();

  const durationOption = CONSENT_DURATION_OPTIONS.find(
    (d) => d.id === account.consent?.duration
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Institution Details"
      maxHeight="86%"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Institution Header */}
        <View style={styles.heroSection}>
          <BrandLogo
            name={account.institutionName}
            containerSize={56}
            isDisconnected={account.status === 'disconnected'}
            fallbackIcon={iconConfig.name}
            fallbackIconColor={iconConfig.color}
            fallbackBg={iconConfig.bg}
          />

          <Text
            style={[
              theme.typography.subheading,
              { color: theme.colors.textPrimary, textAlign: 'center', marginTop: 12 },
            ]}
            numberOfLines={1}
          >
            {account.institutionName}
          </Text>

          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 2 },
            ]}
            numberOfLines={1}
          >
            {account.accountType} • {account.maskedIdentifier}
          </Text>

          <View style={styles.badgeWrapper}>
            <AccountStatusBadge status={account.status} size="md" />
          </View>
        </View>

        {/* Action Required Notice */}
        {isActionRequired && (
          <View
            style={[
              styles.noticeCard,
              {
                backgroundColor: theme.colors.warningLight,
                borderColor: theme.colors.warningMedium,
              },
            ]}
          >
            <View style={styles.noticeHeader}>
              <Icon name="alert-triangle" size={16} color={theme.colors.warning} />
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.warningText, marginLeft: 8 },
                ]}
              >
                {isExpired ? 'Consent Expired' : 'Action Required'}
              </Text>
            </View>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginTop: 4, lineHeight: 18 },
              ]}
            >
              {account.statusMessage ||
                'Your authorization has expired. Review and re-authenticate your connection to resume data synchronization.'}
            </Text>
          </View>
        )}

        {/* Disconnected Notice */}
        {isDisconnected && (
          <View
            style={[
              styles.noticeCard,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.noticeHeader}>
              <Icon name="slash" size={16} color={theme.colors.textSecondary} />
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.textPrimary, marginLeft: 8 },
                ]}
              >
                Access Discontinued
              </Text>
            </View>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginTop: 4, lineHeight: 18 },
              ]}
            >
              Consent for this institution has been revoked. TAMVA no longer queries or synchronizes this account.
            </Text>
          </View>
        )}

        {/* Available / Historical Balance Box */}
        {account.balance !== undefined && (
          <View
            style={[
              styles.balanceCard,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.balanceHeaderRow}>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
                ]}
              >
                {isDisconnected ? 'Historical Balance (At Disconnection)' : 'Available Balance'}
              </Text>
              {isDisconnected && (
                <View
                  style={[
                    styles.inactiveTag,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                >
                  <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, fontSize: 10 }]}>
                    INACTIVE
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.balanceValueRow}>
              <MoneyDisplay
                amount={account.balance}
                currency={account.currency}
                size="lg"
              />
            </View>
          </View>
        )}

        {/* Consented Data Scopes Section */}
        <View style={styles.sectionContainer}>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 8,
              },
            ]}
          >
            Consented Data Scopes
          </Text>

          <View
            style={[
              styles.scopesCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {account.consentedScopes.map((scopeKey: ConsentedScope, index: number) => {
              const scopeDetail = CONSENTED_SCOPE_DETAILS[scopeKey];
              if (!scopeDetail) return null;

              const isLast = index === account.consentedScopes.length - 1;

              // Compute scope tag status
              let tagLabel = 'ACTIVE';
              let tagBg = theme.colors.successLight;
              let tagTextColor = theme.colors.successText;

              if (isDisconnected) {
                tagLabel = 'REVOKED';
                tagBg = theme.colors.surfaceElevated;
                tagTextColor = theme.colors.textTertiary;
              } else if (isExpired) {
                tagLabel = 'EXPIRED';
                tagBg = theme.colors.warningLight;
                tagTextColor = theme.colors.warningText;
              }

              return (
                <View
                  key={scopeKey}
                  style={[
                    styles.scopeItem,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.scopeIconContainer,
                      {
                        backgroundColor: isDisconnected
                          ? theme.colors.surfaceElevated
                          : theme.colors.primaryLight,
                      },
                    ]}
                  >
                    <Icon
                      name={scopeDetail.icon}
                      size={15}
                      color={isDisconnected ? theme.colors.textTertiary : theme.colors.primary}
                    />
                  </View>
                  <View style={styles.scopeTextColumn}>
                    <View style={styles.scopeTitleRow}>
                      <Text
                        style={[
                          theme.typography.captionMedium,
                          { color: isDisconnected ? theme.colors.textSecondary : theme.colors.textPrimary },
                        ]}
                      >
                        {scopeDetail.title}
                      </Text>
                      <View style={[styles.activeTag, { backgroundColor: tagBg }]}>
                        <Text
                          style={[
                            theme.typography.caption,
                            {
                              color: tagTextColor,
                              fontSize: 10,
                              fontWeight: '600',
                            },
                          ]}
                        >
                          {tagLabel}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.textSecondary, marginTop: 2 },
                      ]}
                    >
                      {scopeDetail.shortDescription}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Institution Metadata Table */}
        <View style={styles.sectionContainer}>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 8,
              },
            ]}
          >
            Connection Details
          </Text>

          <View
            style={[
              styles.metaCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={[styles.metaRow, { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                Connected Since
              </Text>
              <Text style={[theme.typography.captionMedium, { color: theme.colors.textPrimary }]}>
                {account.connectedSince}
              </Text>
            </View>

            <View style={[styles.metaRow, { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                Last Synchronization
              </Text>
              <Text style={[theme.typography.captionMedium, { color: theme.colors.textPrimary }]}>
                {account.lastSyncedAt}
              </Text>
            </View>

            <View style={[styles.metaRow, { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                Institution Category
              </Text>
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.textPrimary, textTransform: 'capitalize' },
                ]}
              >
                {account.institutionType.replace('_', ' ')}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                Access Duration
              </Text>
              <Text style={[theme.typography.captionMedium, { color: theme.colors.textPrimary }]}>
                {isDisconnected ? 'Revoked' : durationOption?.label ?? '90 Days'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons Matrix (Section 14) */}
        <View style={styles.actionsSection}>
          {/* CASE A: DISCONNECTED -> RECONNECT ONLY */}
          {isDisconnected ? (
            <Button
              label="Reconnect Institution"
              onPress={handleReconnectPress}
              variant="primary"
              leftIcon="link"
              fullWidth
              style={styles.actionButton}
            />
          ) : (
            /* CASE B: ACTIVE (CONNECTED, SYNCING, ACTION_REQUIRED) */
            <>
              {isActionRequired ? (
                <Button
                  label="Review Connection"
                  onPress={handleReviewPress}
                  variant="primary"
                  leftIcon="check-circle"
                  fullWidth
                  style={styles.actionButton}
                />
              ) : (
                <Button
                  label={isSyncing ? 'Syncing in progress...' : 'Sync Now'}
                  onPress={handleSyncPress}
                  loading={isSyncing}
                  disabled={isSyncing}
                  variant="secondary"
                  leftIcon="refresh-cw"
                  fullWidth
                  style={styles.actionButton}
                />
              )}

              <Button
                label="Manage Consent Scopes"
                onPress={handlePermissionsPress}
                variant="secondary"
                leftIcon="shield"
                fullWidth
                style={styles.actionButton}
              />

              <Button
                label="Disconnect Institution"
                onPress={handleDisconnectPress}
                variant="destructive"
                leftIcon="slash"
                fullWidth
                style={styles.actionButton}
              />
            </>
          )}
        </View>
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrapper: {
    marginTop: 10,
  },
  noticeCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inactiveTag: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  balanceValueRow: {
    marginTop: 6,
    alignItems: 'center',
  },
  sectionContainer: {
    marginTop: 20,
  },
  scopesCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  scopeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  scopeIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  scopeTextColumn: {
    flex: 1,
  },
  scopeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  actionsSection: {
    marginTop: 24,
    gap: 10,
  },
  actionButton: {
    marginBottom: 0,
  },
});
