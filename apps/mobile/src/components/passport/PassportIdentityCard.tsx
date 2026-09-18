/**
 * TAMVA PassportIdentityCard Component
 *
 * Visual presenter for the customer's financial passport identity.
 * Displays passport ID, profile holder name, verification status,
 * and key credential metadata in a clean institutional card.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { PassportIdentity } from '../../types/passport';

export interface PassportIdentityCardProps {
  identity: PassportIdentity;
}

export const PassportIdentityCard: React.FC<PassportIdentityCardProps> = ({
  identity,
}) => {
  const { theme } = useTheme();

  return (
    <Card
      variant="elevated"
      padding="none"
      style={styles.card}
      accessibilityLabel={`Financial Passport for ${identity.holderName}, ID ${identity.passportId}`}
    >
      {/* Top Banner / Identity Header */}
      <View
        style={[
          styles.headerSection,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            <Icon name="shield" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.idWrapper}>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textSecondary, fontSize: 11 },
              ]}
            >
              PASSPORT ID
            </Text>
            <Text
              style={[
                theme.typography.captionMedium,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                  fontWeight: '600',
                  letterSpacing: 0.5,
                },
              ]}
            >
              {identity.passportId}
            </Text>
          </View>
        </View>

        <Badge
          label={identity.statusLabel}
          tone={identity.status === 'active' ? 'success' : 'neutral'}
          size="sm"
        />
      </View>

      {/* Main Body: Holder Name & Trust Subtitle */}
      <View style={styles.bodySection}>
        <View style={styles.holderRow}>
          <View style={styles.holderDetails}>
            <Text
              style={[
                theme.typography.captionMedium,
                {
                  color: theme.colors.textTertiary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  fontSize: 10,
                },
              ]}
            >
              PROFILE HOLDER
            </Text>
            <Text
              style={[
                theme.typography.heading,
                { color: theme.colors.textPrimary, marginTop: 2 },
              ]}
            >
              {identity.holderName}
            </Text>
          </View>

          <View
            style={[
              styles.avatarFallback,
              {
                backgroundColor: theme.colors.primaryLight,
                borderColor: theme.colors.primaryMedium,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.button,
                { color: theme.colors.primary, fontSize: 13 },
              ]}
            >
              {identity.initials}
            </Text>
          </View>
        </View>

        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginTop: 10, lineHeight: 18 },
          ]}
        >
          Structured portable financial profile derived from multi-institution consented account history.
        </Text>
      </View>

      {/* Footer Metadata Row */}
      <View
        style={[
          styles.footerSection,
          {
            backgroundColor: theme.colors.backgroundAlt,
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.metaItem}>
          <Icon
            name="calendar"
            size={13}
            color={theme.colors.textTertiary}
            style={{ marginRight: 5 }}
          />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, fontSize: 11 },
            ]}
          >
            {identity.memberSince}
          </Text>
        </View>

        <View
          style={[styles.metaDivider, { backgroundColor: theme.colors.border }]}
        />

        <View style={styles.metaItem}>
          <Icon
            name="globe"
            size={13}
            color={theme.colors.textTertiary}
            style={{ marginRight: 5 }}
          />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, fontSize: 11 },
            ]}
          >
            {identity.jurisdiction}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  idWrapper: {
    justifyContent: 'center',
  },
  bodySection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  holderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  holderDetails: {
    flex: 1,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  footerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 12,
  },
});
