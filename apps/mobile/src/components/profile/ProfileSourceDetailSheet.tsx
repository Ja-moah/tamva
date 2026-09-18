/**
 * TAMVA ProfileSourceDetailSheet Component
 *
 * Detailed inspection sheet for a contributing financial data source.
 * Displays institution metadata, account type, connection status,
 * role in profile signals, and direct access to manage consent.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';
import { ProfileSource } from '../../types/profile';

export interface ProfileSourceDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  source: ProfileSource | null;
  onNavigateToConsent: () => void;
}

export const ProfileSourceDetailSheet: React.FC<
  ProfileSourceDetailSheetProps
> = ({ visible, onClose, source, onNavigateToConsent }) => {
  const { theme } = useTheme();

  if (!source) return null;

  const isSyncing = source.status === 'syncing';
  const isDisconnected = source.status === 'disconnected';
  const statusLabel = isSyncing ? 'Syncing' : isDisconnected ? 'Disconnected' : 'Connected';
  const statusTone: 'warning' | 'neutral' | 'success' = isSyncing
    ? 'warning'
    : isDisconnected
    ? 'neutral'
    : 'success';
  const contributionText =
    source.contribution || (isDisconnected ? 'Historical records only' : 'Consented activity');
  const updatedText = source.lastUpdated
    ? `Last synced: ${source.lastUpdated}`
    : 'Sync time unavailable';

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={source.institutionName}
      subtitle={source.accountType}
      maxHeight="80%"
    >
      <View style={styles.container}>
        {/* Source Summary Card */}
        <View
          style={[
            styles.sourceCard,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <BrandLogo
              name={source.institutionName}
              containerSize={36}
              shape="rounded"
              isDisconnected={isDisconnected}
              fallbackIcon={source.icon}
              style={styles.iconCircle}
            />

            <View style={{ flex: 1, marginRight: 8 }}>
              <Text
                style={[
                  theme.typography.bodyMedium,
                  { color: theme.colors.textPrimary, fontWeight: '600', fontSize: 15 },
                ]}
              >
                {source.institutionName}
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: 1 },
                ]}
              >
                {source.accountType}
              </Text>
            </View>

            <Badge
              label={statusLabel}
              tone={statusTone}
              size="sm"
            />
          </View>
        </View>

        {/* Contribution Details */}
        <View
          style={[
            styles.detailsCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textTertiary,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
              },
            ]}
          >
            CONTRIBUTION TO PROFILE
          </Text>
          <Text
            style={[
              theme.typography.bodyMedium,
              { color: theme.colors.textPrimary, fontWeight: '500', marginTop: 3 },
            ]}
          >
            {contributionText}
          </Text>

          <View
            style={[styles.divider, { backgroundColor: theme.colors.border }]}
          />

          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textTertiary,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
              },
            ]}
          >
            DATA FRESHNESS
          </Text>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginTop: 2 },
            ]}
          >
            {updatedText}
          </Text>
        </View>

        {/* Consented Data Disclaimer */}
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
            name="shield"
            size={13}
            color={theme.colors.primary}
            style={{ marginRight: 8, marginTop: 1 }}
          />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 16, flex: 1 },
            ]}
          >
            {isDisconnected
              ? 'This institution is disconnected. Historical records remain included in your profile analysis until consent is revoked or data retention expires.'
              : 'Connected sources contribute data with your explicit consent. You remain in control and can manage or revoke access at any time from Connected Accounts.'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonStack}>
          <Button
            label={isDisconnected ? 'Reconnect in Connected Accounts' : 'Manage in Connected Accounts'}
            onPress={() => {
              onClose();
              onNavigateToConsent();
            }}
            variant="secondary"
            size="md"
            rightIcon="arrow-right"
            fullWidth
          />
          <View style={{ height: 8 }} />
          <Button
            label="Done"
            onPress={onClose}
            variant="primary"
            size="md"
            fullWidth
          />
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 24,
  },
  sourceCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    marginRight: 10,
  },
  detailsCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginVertical: 10,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  buttonStack: {
    width: '100%',
  },
});
