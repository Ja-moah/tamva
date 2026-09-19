/**
 * TAMVA ConsentSuccessSheet Component
 *
 * Clean connection success bottom sheet:
 * - Green check-circle hero avatar
 * - Clear, honest confirmation copy acknowledging simulated connection
 * - Institution connection summary (institution, account status, scopes, duration)
 * - Primary action "Done" and secondary action "View Account"
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';
import { AccountStatusBadge } from './AccountStatusBadge';
import { MoneyDisplay } from '../financial/MoneyDisplay';
import { ConnectedAccount } from '../../types/accounts';
import {
  CONSENTED_SCOPE_DETAILS,
  CONSENT_DURATION_OPTIONS,
} from '../../demo/data/mockConnectedAccountsData';
import { useHaptics } from '../../hooks/useHaptics';

export interface ConsentSuccessSheetProps {
  account: ConnectedAccount | null;
  visible: boolean;
  onClose: () => void;
  onViewAccount: (account: ConnectedAccount) => void;
}

export const ConsentSuccessSheet: React.FC<ConsentSuccessSheetProps> = ({
  account,
  visible,
  onClose,
  onViewAccount,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  if (!account) return null;

  const handleDone = () => {
    haptics.lightImpact();
    onClose();
  };

  const handleViewAccount = () => {
    haptics.lightImpact();
    onViewAccount(account);
  };

  const durationOption = CONSENT_DURATION_OPTIONS.find(
    (d) => d.id === account.consent?.duration
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Connection Established"
      maxHeight="82%"
    >
      <View style={styles.container}>
        {/* Success Icon Avatar */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.successCircle,
              {
                backgroundColor: theme.colors.successLight,
                borderColor: theme.colors.successMedium,
              },
            ]}
          >
            <Icon name="check-circle" size={32} color={theme.colors.success} />
          </View>

          <Text
            style={[
              theme.typography.subheading,
              { color: theme.colors.textPrimary, marginTop: 14, textAlign: 'center' },
            ]}
          >
            Account Connected
          </Text>

          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center', maxWidth: 280 },
            ]}
          >
            Simulated sandbox connection established. TAMVA has synchronized initial read-only data.
          </Text>
        </View>

        {/* Connection Details Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <View style={styles.row}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              Institution
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <BrandLogo
                name={account.institutionName}
                containerSize={20}
                size={14}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {account.institutionName}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.row}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              Account
            </Text>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textPrimary },
              ]}
            >
              {account.accountType} ({account.maskedIdentifier})
            </Text>
          </View>

          {account.balance !== undefined && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.row}>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  Synchronized Balance
                </Text>
                <MoneyDisplay
                  amount={account.balance}
                  currency={account.currency}
                  size="sm"
                />
              </View>
            </>
          )}

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.row}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              Status
            </Text>
            <AccountStatusBadge status={account.status} size="sm" />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.row}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              Access Duration
            </Text>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textPrimary },
              ]}
            >
              {durationOption?.label ?? '90 Days'}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.row}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              Active Scopes
            </Text>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textPrimary },
              ]}
            >
              {account.consentedScopes.length} of 4 Granted
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            label="Done"
            onPress={handleDone}
            variant="primary"
            fullWidth
          />
          <View style={{ height: 8 }} />
          <Button
            label="View Account Details"
            onPress={handleViewAccount}
            variant="secondary"
            leftIcon="eye"
            fullWidth
          />
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  successCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderWidth: 1,
    padding: 14,
    marginVertical: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  actionsContainer: {
    marginTop: 4,
  },
});
