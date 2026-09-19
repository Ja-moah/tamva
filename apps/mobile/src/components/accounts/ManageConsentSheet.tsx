/**
 * TAMVA ManageConsentSheet Component
 *
 * BottomSheet for managing granted consent scopes on an existing connection:
 * - Displays active granted scopes
 * - Allows toggling optional scopes (Account Identity remains locked and required)
 * - Minimal scope notification when only Account Identity is retained
 * - Allows updating the access duration
 * - Explicit confirmation CTA: "Save consent changes"
 * - Discarding changes without saving leaves the account unmodified
 */

import React, { startTransition, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';
import { ConsentScopeRow } from './ConsentScopeRow';
import { ConsentDurationSelector } from './ConsentDurationSelector';
import {
  ConnectedAccount,
  ConsentedScope,
  ConsentDuration,
} from '../../types/accounts';
import {
  CONSENTED_SCOPE_DETAILS,
  DEFAULT_CONSENT_PURPOSE,
} from '../../demo/data/mockConnectedAccountsData';
import { useHaptics } from '../../hooks/useHaptics';

export interface ManageConsentSheetProps {
  account: ConnectedAccount | null;
  visible: boolean;
  onClose: () => void;
  onSaveConsent: (
    accountId: string,
    newScopes: ConsentedScope[],
    newDuration: ConsentDuration
  ) => void;
}

const ALL_SCOPES: ConsentedScope[] = [
  'account_identity',
  'balances',
  'transaction_history',
  'income_verification',
];

export const ManageConsentSheet: React.FC<ManageConsentSheetProps> = ({
  account,
  visible,
  onClose,
  onSaveConsent,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const [activeScopes, setActiveScopes] = useState<ConsentedScope[]>([]);
  const [activeDuration, setActiveDuration] = useState<ConsentDuration>('90_days');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state whenever account changes or modal opens
  useEffect(() => {
    if (visible && account) {
      startTransition(() => {
        setActiveScopes(account.consentedScopes ?? ['account_identity']);
        setActiveDuration(account.consent?.duration ?? '90_days');
      });
    }
  }, [visible, account]);

  if (!account) return null;

  const handleToggleScope = (scopeId: string, enabled: boolean) => {
    const scope = scopeId as ConsentedScope;
    if (scope === 'account_identity') return; // Required

    setActiveScopes((prev) => {
      if (enabled) {
        return prev.includes(scope) ? prev : [...prev, scope];
      } else {
        return prev.filter((s) => s !== scope);
      }
    });
  };

  const isMinimalScope =
    activeScopes.length === 1 && activeScopes[0] === 'account_identity';

  const handleSave = () => {
    haptics.lightImpact();
    setIsSaving(true);

    onSaveConsent(account.id, activeScopes, activeDuration);

    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 400);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Manage Consent Scopes"
      subtitle={`Permissions for ${account.institutionName}`}
      maxHeight="88%"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Institution Info Card */}
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              flexDirection: 'row',
              alignItems: 'center',
            },
          ]}
        >
          <BrandLogo
            name={account.institutionName}
            containerSize={40}
            fallbackIcon={account.institutionType === 'mobile_money' ? 'smartphone' : 'credit-card'}
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textPrimary, fontWeight: '600' },
              ]}
              numberOfLines={1}
            >
              {account.institutionName}
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginTop: 2 },
              ]}
              numberOfLines={1}
            >
              {account.accountType} ({account.maskedIdentifier})
            </Text>
          </View>
        </View>

        {/* Purpose Reassurance Banner */}
        <View
          style={[
            styles.purposeCard,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <View style={styles.purposeTitleRow}>
            <Icon name="shield" size={15} color={theme.colors.primary} />
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textPrimary, marginLeft: 8 },
              ]}
            >
              Consent Control
            </Text>
          </View>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginTop: 4, lineHeight: 18 },
            ]}
          >
            {DEFAULT_CONSENT_PURPOSE}
          </Text>
        </View>

        {/* Scopes Section */}
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              },
            ]}
          >
            Data Access Scopes
          </Text>
        </View>

        {ALL_SCOPES.map((scopeKey) => {
          const detail = CONSENTED_SCOPE_DETAILS[scopeKey];
          if (!detail) return null;

          return (
            <ConsentScopeRow
              key={scopeKey}
              scope={detail}
              isSelected={activeScopes.includes(scopeKey)}
              onToggle={handleToggleScope}
              disabled={isSaving}
            />
          );
        })}

        {/* Minimal Scope Warning Notice */}
        {isMinimalScope && (
          <View
            style={[
              styles.minimalNotice,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Icon name="info" size={14} color={theme.colors.textSecondary} />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginLeft: 8, flex: 1, lineHeight: 17 },
              ]}
            >
              Minimal Scope: Only Account Identity is granted. Balances, transaction timeline, and income analytics will remain disabled.
            </Text>
          </View>
        )}

        {/* Access Duration Section */}
        <View style={styles.sectionHeaderRow}>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              },
            ]}
          >
            Access Duration
          </Text>
        </View>

        <ConsentDurationSelector
          selectedDuration={activeDuration}
          onSelectDuration={setActiveDuration}
        />

        {/* Confirmation Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            label="Save consent changes"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            variant="primary"
            leftIcon="check"
            fullWidth
          />
          <View style={{ height: 8 }} />
          <Button
            label="Cancel"
            onPress={onClose}
            disabled={isSaving}
            variant="tertiary"
            fullWidth
          />
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
  headerCard: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  purposeCard: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  purposeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderRow: {
    marginTop: 8,
    marginBottom: 10,
  },
  minimalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  actionsContainer: {
    marginTop: 20,
  },
});
