/**
 * TAMVA ReceiveDetailsStep Component (Step 3 & 4)
 *
 * Detailed receiving credentials view:
 * - Structured receiving metadata (Account holder, institution, masked account number)
 * - 1-tap copy action with clipboard feedback
 * - Optional amount request affordance
 * - Institutional transparency note
 * - Clear "Continue" CTA advancing to the Summary screen
 *
 * NOTE: QR code is intentionally omitted to avoid user confusion with non-live payment rails.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { useToast } from '../ui/Toast';
import { ReceivingAccount, ReceiveRequestDraft } from '../../types/receive';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';
import { RequestAmountModal } from './RequestAmountModal';

export interface ReceiveDetailsStepProps {
  account: ReceivingAccount;
  draft: ReceiveRequestDraft;
  onUpdateAmount: (amount?: number, note?: string) => void;
  onContinue: () => void;
  onChangeAccount: () => void;
  onBack: () => void;
}

export const ReceiveDetailsStep: React.FC<ReceiveDetailsStepProps> = ({
  account,
  draft,
  onUpdateAmount,
  onContinue,
  onChangeAccount,
  onBack,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { showToast } = useToast();

  const [isAmountModalVisible, setIsAmountModalVisible] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isMoMo = account.method === 'mobile_money';

  const handleCopy = (text: string, label: string) => {
    haptics.selection();

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
      }
    } catch {
      // Graceful fallback for non-clipboard environments
    }

    setCopiedField(label);
    showToast({
      type: 'success',
      title: 'Copied to Clipboard',
      message: `${label} copied`,
      duration: 2000,
    });

    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. SCREEN HEADER */}
      <ScreenHeader
        title="Your receiving details"
        subtitle="Share with the sender"
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
        {/* Receiving Account Card */}
        <Card variant="elevated" style={styles.detailsCard}>
          {/* Institution Header */}
          <View style={styles.cardHeaderRow}>
            <BrandLogo
              name={account.institutionName}
              containerSize={44}
              shape="rounded"
              fallbackIcon={account.icon || 'credit-card'}
              fallbackBg={theme.colors.backgroundAlt}
              fallbackIconColor={theme.colors.textPrimary}
            />
            <View style={styles.institutionInfo}>
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
                {account.accountType}
              </Text>
            </View>
            <Badge
              label={isMoMo ? 'Mobile Money' : 'Bank'}
              tone="neutral"
              size="sm"
            />
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          {/* Account Name */}
          <View style={styles.metaRow}>
            <View style={styles.metaTextContainer}>
              <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>
                ACCOUNT NAME
              </Text>
              <Text
                style={[
                  theme.typography.bodyMedium,
                  { color: theme.colors.textPrimary, fontWeight: '600', marginTop: 2 },
                ]}
              >
                {account.accountHolderName}
              </Text>
            </View>
            <Pressable
              onPress={() => handleCopy(account.accountHolderName, 'Account name')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.copyIconButton}
              accessibilityLabel="Copy account name"
              accessibilityRole="button"
            >
              <Icon
                name={copiedField === 'Account name' ? 'check' : 'copy'}
                size={16}
                color={
                  copiedField === 'Account name'
                    ? theme.colors.primary
                    : theme.colors.textSecondary
                }
              />
            </Pressable>
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          {/* Account / Mobile Number with Prominent Copy */}
          <View style={styles.metaRow}>
            <View style={styles.metaTextContainer}>
              <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>
                {isMoMo ? 'MOBILE MONEY NUMBER' : 'ACCOUNT NUMBER'}
              </Text>
              <Text
                style={[
                  styles.numberText,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {account.fullMaskedAccount}
              </Text>
            </View>

            <Pressable
              onPress={() =>
                handleCopy(
                  account.fullMaskedAccount,
                  isMoMo ? 'Mobile number' : 'Account number'
                )
              }
              style={[
                styles.copyButtonPill,
                {
                  backgroundColor:
                    copiedField === (isMoMo ? 'Mobile number' : 'Account number')
                      ? theme.colors.primaryLight
                      : theme.colors.backgroundAlt,
                  borderColor: theme.colors.border,
                },
              ]}
              accessibilityLabel={`Copy ${isMoMo ? 'Mobile number' : 'Account number'}`}
              accessibilityRole="button"
            >
              <Icon
                name={
                  copiedField === (isMoMo ? 'Mobile number' : 'Account number')
                    ? 'check'
                    : 'copy'
                }
                size={14}
                color={
                  copiedField === (isMoMo ? 'Mobile number' : 'Account number')
                    ? theme.colors.primary
                    : theme.colors.textPrimary
                }
              />
              <Text
                style={[
                  theme.typography.captionMedium,
                  {
                    color:
                      copiedField ===
                      (isMoMo ? 'Mobile number' : 'Account number')
                        ? theme.colors.primary
                        : theme.colors.textPrimary,
                    marginLeft: 6,
                    fontWeight: '600',
                  },
                ]}
              >
                {copiedField === (isMoMo ? 'Mobile number' : 'Account number')
                  ? 'Copied'
                  : 'Copy'}
              </Text>
            </Pressable>
          </View>

          {/* Optional Amount Request Section */}
          {draft.amount && draft.amount > 0 ? (
            <>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.border },
                ]}
              />
              <View style={styles.metaRow}>
                <View style={styles.metaTextContainer}>
                  <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>
                    REQUESTED AMOUNT
                  </Text>
                  <Text
                    style={[
                      theme.typography.bodyMedium,
                      { color: theme.colors.textPrimary, fontWeight: '700', marginTop: 2 },
                    ]}
                  >
                    GH₵{draft.amount.toFixed(2)}
                    {Boolean(draft.note) && ` • ${draft.note}`}
                  </Text>
                </View>

                <Pressable
                  onPress={() => setIsAmountModalVisible(true)}
                  style={styles.editAmountButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text
                    style={[
                      theme.typography.captionMedium,
                      { color: theme.colors.primary, fontWeight: '600' },
                    ]}
                  >
                    Edit
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Pressable
              onPress={() => setIsAmountModalVisible(true)}
              style={[
                styles.addAmountPrompt,
                {
                  backgroundColor: theme.colors.backgroundAlt,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Icon name="plus" size={16} color={theme.colors.primary} />
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.primary, marginLeft: 8, fontWeight: '600' },
                ]}
              >
                Request a specific amount (optional)
              </Text>
            </Pressable>
          )}
        </Card>

        {/* Institutional Transparency Note */}
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
              { color: theme.colors.textSecondary, marginLeft: 8, flex: 1, lineHeight: 18 },
            ]}
          >
            Share these details with the person sending you money. TAMVA can reflect incoming funds when supported by your connected account data.
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
          label="Continue"
          variant="primary"
          size="lg"
          fullWidth={true}
          rightIcon="arrow-right"
          onPress={onContinue}
          accessibilityHint="Advances to summary screen"
        />

        <View style={styles.secondaryButtonWrapper}>
          <Button
            label="Change Account"
            variant="tertiary"
            size="md"
            fullWidth={true}
            onPress={onChangeAccount}
            accessibilityHint="Returns to select a different receiving account"
          />
        </View>
      </View>

      {/* 4. OPTIONAL AMOUNT MODAL */}
      <RequestAmountModal
        visible={isAmountModalVisible}
        initialAmount={draft.amount}
        initialNote={draft.note}
        onSave={(newAmount, newNote) => onUpdateAmount(newAmount, newNote)}
        onClear={() => onUpdateAmount(undefined, undefined)}
        onClose={() => setIsAmountModalVisible(false)}
      />
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
  detailsCard: {
    padding: 18,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  institutionInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginVertical: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaTextContainer: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: 0.5,
  },
  numberText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  copyIconButton: {
    padding: 8,
  },
  copyButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  addAmountPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
  },
  editAmountButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  transparencyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
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
