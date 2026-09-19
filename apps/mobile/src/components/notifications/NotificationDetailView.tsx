/**
 * TAMVA NotificationDetailView Component
 *
 * Production-ready, presentational detail view for customer notifications:
 * - Back button to return to notification list view without dismissing modal
 * - High-hierarchy header with brand logo / category avatar, badge, and timestamp
 * - Full untruncated notification title and narrative body
 * - "What this means" institutional intelligence explanation card
 * - "Related account / context" metadata card with privacy masking support
 * - Subtle regulatory transparency footnote
 * - Explicit primary CTA driving destination navigation
 * - Accessibility-compliant reading order and touch targets
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { usePrivacy } from '../../context/PrivacyContext';
import { NotificationItem, NotificationCategory } from '../../types/notifications';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Card } from '../ui/Card';
import { Badge, BadgeTone } from '../ui/Badge';
import { BrandLogo } from '../ui/BrandLogo';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

export interface NotificationDetailViewProps {
  notification: NotificationItem;
  onBack: () => void;
  onActionPress: (notification: NotificationItem) => void;
}

export const NotificationDetailView: React.FC<NotificationDetailViewProps> = ({
  notification,
  onBack,
  onActionPress,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isPrivate } = usePrivacy();

  const getCategoryBadgeTone = (category: NotificationCategory): BadgeTone => {
    switch (category) {
      case 'consent':
        return 'warning';
      case 'passport':
        return 'information';
      case 'protection':
        return 'success';
      case 'account_sync':
      case 'other':
      default:
        return 'neutral';
    }
  };

  // Determine if related field is an account or contextual entity
  const isContextual =
    Boolean(notification.relatedAccount) &&
    (notification.relatedAccount!.toLowerCase().includes('recipient') ||
      notification.relatedAccount!.toLowerCase().includes('monitored'));

  const contextLabel = isContextual ? 'RELATED CONTEXT' : 'RELATED ACCOUNT';
  const contextIcon = isContextual ? 'layers' : 'credit-card';

  // Apply privacy masking to account suffix if private mode is enabled
  const displayAccount =
    isPrivate && notification.relatedAccount
      ? notification.relatedAccount.replace(/••\d{4}/, '••••••••')
      : notification.relatedAccount;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. Header with back to list action */}
      <ScreenHeader
        title="Notification Details"
        subtitle={notification.categoryLabel}
        showBack={true}
        onBackPress={onBack}
        borderBottom={true}
      />

      {/* 2. Scrollable detail content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 24 },
        ]}
      >
        {/* Detail Meta Card */}
        <View style={styles.topMetaRow}>
          {notification.institutionName ? (
            <BrandLogo
              name={notification.institutionName}
              containerSize={46}
              shape="rounded"
              fallbackIcon={notification.icon}
              fallbackBg={theme.colors.backgroundAlt}
              fallbackIconColor={theme.colors.textPrimary}
            />
          ) : (
            <View
              style={[
                styles.categoryAvatar,
                {
                  backgroundColor: theme.colors.primaryLight,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Icon
                name={notification.icon}
                size={20}
                color={theme.colors.primary}
              />
            </View>
          )}

          <View style={styles.metaInfoColumn}>
            <View style={styles.badgeRow}>
              <Badge
                label={notification.categoryLabel}
                tone={getCategoryBadgeTone(notification.category)}
                size="sm"
              />
            </View>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, marginTop: 4, fontSize: 12 },
              ]}
            >
              {notification.receivedDate || notification.timestamp}
            </Text>
          </View>
        </View>

        {/* Notification Title */}
        <Text
          style={[
            theme.typography.subheading,
            {
              color: theme.colors.textPrimary,
              fontSize: 20,
              lineHeight: 26,
              fontWeight: '700',
              marginTop: 16,
            },
          ]}
        >
          {notification.title}
        </Text>

        {/* Main Notification Body */}
        <Text
          style={[
            theme.typography.body,
            {
              color: theme.colors.textSecondary,
              fontSize: 14.5,
              lineHeight: 22,
              marginTop: 8,
            },
          ]}
        >
          {notification.body}
        </Text>

        {/* "WHAT THIS MEANS" Card */}
        {Boolean(notification.whatThisMeans) && (
          <Card variant="elevated" padding="none" style={styles.sectionCard}>
            <View style={styles.sectionCardContent}>
              <View style={styles.sectionLabelRow}>
                <Icon
                  name="info"
                  size={14}
                  color={theme.colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    theme.typography.captionMedium,
                    {
                      color: theme.colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      fontSize: 11,
                    },
                  ]}
                >
                  WHAT THIS MEANS
                </Text>
              </View>
              <Text
                style={[
                  theme.typography.bodySm,
                  {
                    color: theme.colors.textPrimary,
                    lineHeight: 21,
                    marginTop: 8,
                    fontSize: 13.5,
                  },
                ]}
              >
                {notification.whatThisMeans}
              </Text>
            </View>
          </Card>
        )}

        {/* "RELATED ACCOUNT / CONTEXT" Card */}
        {Boolean(notification.relatedAccount) && (
          <Card variant="standard" padding="none" style={styles.sectionCard}>
            <View style={styles.sectionCardContent}>
              <View style={styles.sectionLabelRow}>
                <Icon
                  name={contextIcon}
                  size={14}
                  color={theme.colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    theme.typography.captionMedium,
                    {
                      color: theme.colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      fontSize: 11,
                    },
                  ]}
                >
                  {contextLabel}
                </Text>
              </View>
              <Text
                style={[
                  theme.typography.bodySmMedium,
                  {
                    color: theme.colors.textPrimary,
                    fontSize: 14,
                    lineHeight: 20,
                    fontWeight: '600',
                    marginTop: 6,
                  },
                ]}
              >
                {displayAccount}
              </Text>
            </View>
          </Card>
        )}

        {/* Transparency / Non-guarantee Footnote */}
        <Text
          style={[
            theme.typography.caption,
            {
              color: theme.colors.textTertiary,
              textAlign: 'center',
              fontSize: 12,
              lineHeight: 17,
              marginTop: 20,
              marginBottom: 24,
              paddingHorizontal: 8,
            },
          ]}
        >
          Based on the latest consented financial data available to TAMVA.
        </Text>

        {/* Primary CTA (The ONLY navigation affordance) */}
        {Boolean(notification.actionRoute) && (
          <Button
            label={notification.actionLabel || 'Continue'}
            variant="primary"
            size="lg"
            fullWidth={true}
            rightIcon="arrow-right"
            onPress={() => onActionPress(notification)}
            accessibilityHint="Closes notification details and opens the related TAMVA product screen"
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryAvatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaInfoColumn: {
    marginLeft: 14,
    justifyContent: 'center',
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionCard: {
    borderRadius: 16,
    marginTop: 16,
  },
  sectionCardContent: {
    padding: 16,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

