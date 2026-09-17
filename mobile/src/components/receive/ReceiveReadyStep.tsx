/**
 * TAMVA ReceiveReadyStep Component (Step 7)
 *
 * Final state representing that receiving credentials are ready to be shared:
 * - Clear confirmation that details have been prepared
 * - Explicit clarification that no funds have moved yet
 * - Primary CTA: "Share Again" (re-opens share sheet)
 * - Secondary Action: "Done" (dismisses modal and returns to Home)
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { ReceivingAccount, ReceiveRequestDraft } from '../../types/receive';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';

export interface ReceiveReadyStepProps {
  account: ReceivingAccount;
  draft: ReceiveRequestDraft;
  onShareAgain: () => void;
  onDone: () => void;
}

export const ReceiveReadyStep: React.FC<ReceiveReadyStepProps> = ({
  account,
  draft,
  onShareAgain,
  onDone,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  useEffect(() => {
    haptics.success();
  }, []);

  const isMoMo = account.method === 'mobile_money';
  const now = new Date();
  const formattedTime = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const formattedDate = `${now.getDate()} Sep 2026, ${formattedTime}`;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 32) + 24,
            paddingBottom: Math.max(insets.bottom, 24) + 120,
          },
        ]}
      >
        {/* Ready Icon */}
        <View
          style={[
            styles.readyCircle,
            {
              backgroundColor: theme.colors.primaryLight,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <Icon name="check" size={32} color={theme.colors.primary} />
        </View>

        {/* Heading */}
        <Text
          style={[
            theme.typography.heading,
            { color: theme.colors.textPrimary, marginTop: 24, textAlign: 'center' },
          ]}
        >
          Ready to receive
        </Text>

        <Text
          style={[
            theme.typography.bodyMedium,
            {
              color: theme.colors.textSecondary,
              textAlign: 'center',
              marginTop: 8,
              lineHeight: 22,
              maxWidth: 300,
            },
          ]}
        >
          Your receiving details are ready to share with the sender.
        </Text>

        {/* Structured Credentials Card */}
        <Card variant="outlined" style={styles.card}>
          <View style={styles.accountRow}>
            <BrandLogo
              name={account.institutionName}
              containerSize={36}
              shape="rounded"
              fallbackIcon={account.icon || 'credit-card'}
              fallbackBg={theme.colors.backgroundAlt}
              fallbackIconColor={theme.colors.textPrimary}
            />
            <View style={styles.accountText}>
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
                  { color: theme.colors.textTertiary },
                ]}
              >
                {account.accountType}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>
              Account Holder
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

          <View style={styles.metaRow}>
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

          {draft.amount && draft.amount > 0 ? (
            <View style={styles.metaRow}>
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
          ) : null}

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: theme.colors.textSecondary }]}>
              Generated
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary },
              ]}
            >
              {formattedDate}
            </Text>
          </View>
        </Card>

        {/* Clear Institutional Clarification */}
        <View
          style={[
            styles.clarificationBox,
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
            No money has been transferred yet. When the sender transfers funds, the transaction can be reflected in your connected account timeline.
          </Text>
        </View>
      </ScrollView>

      {/* FIXED BOTTOM ACTIONS */}
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
          label="Share Again"
          variant="primary"
          size="lg"
          fullWidth={true}
          leftIcon="share"
          onPress={onShareAgain}
          accessibilityHint="Re-opens the share sheet to send account details"
        />

        <View style={styles.secondaryButtonWrapper}>
          <Button
            label="Done"
            variant="tertiary"
            size="md"
            fullWidth={true}
            onPress={onDone}
            accessibilityHint="Dismisses the receive flow and returns to home screen"
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
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  readyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    padding: 16,
    marginTop: 24,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountText: {
    marginLeft: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  clarificationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    width: '100%',
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
