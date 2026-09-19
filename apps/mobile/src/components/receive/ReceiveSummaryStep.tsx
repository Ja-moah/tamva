/**
 * TAMVA ReceiveSummaryStep Component (Step 6)
 *
 * Pre-share confirmation summary:
 * - Clear verification of destination account
 * - Optional amount and note representation
 * - Preview of the concise text payload to be shared
 * - Primary CTA: "Share Details" (triggers native share sheet)
 * - Secondary Action: "Edit Details"
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { ReceivingAccount, ReceiveRequestDraft } from '../../types/receive';
import { formatShareDetails } from '../../demo/data/mockReceiveData';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';

export interface ReceiveSummaryStepProps {
  account: ReceivingAccount;
  draft: ReceiveRequestDraft;
  onShareDetails: () => void;
  onEditDetails: () => void;
  onBack: () => void;
}

export const ReceiveSummaryStep: React.FC<ReceiveSummaryStepProps> = ({
  account,
  draft,
  onShareDetails,
  onEditDetails,
  onBack,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const isMoMo = account.method === 'mobile_money';
  const shareText = formatShareDetails(draft);

  const handleShare = () => {
    haptics.selection();
    onShareDetails();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. SCREEN HEADER */}
      <ScreenHeader
        title="Review details"
        subtitle="Confirm details before sharing"
        showBack={true}
        onBackPress={onBack}
        borderBottom={true}
      />

      {/* 2. SCROLLABLE CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 120 },
        ]}
      >
        {/* Receiving Summary Card */}
        <Card variant="outlined" style={styles.summaryCard}>
          <Text
            style={[
              theme.typography.captionMedium,
              { color: theme.colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' },
            ]}
          >
            Receiving Account
          </Text>

          {/* Account Details Row */}
          <View style={styles.accountRow}>
            <BrandLogo
              name={account.institutionName}
              containerSize={42}
              shape="rounded"
              fallbackIcon={account.icon || 'credit-card'}
              fallbackBg={theme.colors.backgroundAlt}
              fallbackIconColor={theme.colors.textPrimary}
            />
            <View style={styles.accountInfo}>
              <Text
                style={[
                  theme.typography.bodyMedium,
                  { color: theme.colors.textPrimary, fontWeight: '700' },
                ]}
              >
                {account.institutionName}
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textTertiary, marginTop: 2 },
                ]}
              >
                {account.accountType} • {account.maskedIdentifier}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          {/* Beneficiary Name */}
          <View style={styles.detailRow}>
            <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>
              Account Name
            </Text>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textPrimary, fontWeight: '600' },
              ]}
            >
              {account.accountHolderName}
            </Text>
          </View>

          {/* Number */}
          <View style={styles.detailRow}>
            <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>
              {isMoMo ? 'Mobile Number' : 'Account Number'}
            </Text>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textPrimary, fontFamily: 'monospace' },
              ]}
            >
              {account.fullMaskedAccount}
            </Text>
          </View>

          {/* Optional Amount */}
          {draft.amount && draft.amount > 0 ? (
            <>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.border },
                ]}
              />
              <View style={styles.detailRow}>
                <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>
                  Requested Amount
                </Text>
                <Text
                  style={[
                    theme.typography.bodyMedium,
                    { color: theme.colors.textPrimary, fontWeight: '700' },
                  ]}
                >
                  GH₵{draft.amount.toFixed(2)}
                </Text>
              </View>

              {Boolean(draft.note) && (
                <View style={styles.detailRow}>
                  <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>
                    Purpose Note
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
              )}
            </>
          ) : null}
        </Card>

        {/* Message Preview */}
        <View style={styles.previewSection}>
          <Text
            style={[
              theme.typography.captionMedium,
              { color: theme.colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
            ]}
          >
            Message to be Shared
          </Text>

          <View
            style={[
              styles.previewBox,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.bodySm,
                { color: theme.colors.textPrimary, fontFamily: 'monospace', lineHeight: 22 },
              ]}
            >
              {shareText}
            </Text>
          </View>
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
          label="Share Details"
          variant="primary"
          size="lg"
          fullWidth={true}
          leftIcon="share"
          onPress={handleShare}
          accessibilityHint="Opens system share sheet to send account details"
        />

        <View style={styles.secondaryButtonWrapper}>
          <Button
            label="Edit Details"
            variant="tertiary"
            size="md"
            fullWidth={true}
            onPress={onEditDetails}
            accessibilityHint="Returns to edit receiving details"
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
  summaryCard: {
    padding: 18,
    marginBottom: 20,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  accountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginVertical: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  previewSection: {
    marginBottom: 20,
  },
  previewBox: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
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
