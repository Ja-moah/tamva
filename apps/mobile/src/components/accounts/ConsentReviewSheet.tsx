/**
 * TAMVA ConsentReviewSheet Component
 *
 * Transparent, multi-step consent authorization sheet:
 * - Displays institution identity & factual purpose of access
 * - Granular scope selection (Account Identity required; others optional)
 * - Minimal scope warning banner when only required scope is selected
 * - Access duration configuration (30 days, 90 days default, 1 year, until revoked)
 * - Dynamic, accurate pre-confirmation consent summary updating immediately
 * - Explicit confirmation CTA: "Give TAMVA access"
 * - Simulated local processing state with tactile haptics
 */

import React, { startTransition, useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ConsentScopeRow } from './ConsentScopeRow';
import { ConsentDurationSelector } from './ConsentDurationSelector';
import {
  InstitutionCatalogItem,
  ConsentedScope,
  ConsentDuration,
} from '../../types/accounts';
import {
  CONSENTED_SCOPE_DETAILS,
  DEFAULT_CONSENT_PURPOSE,
  CONSENT_DURATION_OPTIONS,
} from '../../demo/data/mockConnectedAccountsData';
import { useHaptics } from '../../hooks/useHaptics';

export interface ConsentReviewSheetProps {
  institution: InstitutionCatalogItem | null;
  visible: boolean;
  onClose: () => void;
  onConfirmConsent: (
    institution: InstitutionCatalogItem,
    grantedScopes: ConsentedScope[],
    duration: ConsentDuration
  ) => void;
  isConnecting?: boolean;
}

const ALL_SCOPES: ConsentedScope[] = [
  'account_identity',
  'balances',
  'transaction_history',
  'income_verification',
];

export const ConsentReviewSheet: React.FC<ConsentReviewSheetProps> = ({
  institution,
  visible,
  onClose,
  onConfirmConsent,
  isConnecting = false,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  // Selected scopes state (identity is required; others start enabled)
  const [selectedScopes, setSelectedScopes] = useState<ConsentedScope[]>(ALL_SCOPES);
  const [selectedDuration, setSelectedDuration] = useState<ConsentDuration>('90_days');

  // Reset state when opening for a new institution
  useEffect(() => {
    if (visible && institution) {
      startTransition(() => {
        setSelectedScopes(institution.supportedScopes ?? ALL_SCOPES);
        setSelectedDuration('90_days');
      });
    }
  }, [visible, institution]);

  if (!institution) return null;

  const handleToggleScope = (scopeId: string, enabled: boolean) => {
    const scope = scopeId as ConsentedScope;
    if (scope === 'account_identity') return; // Required, cannot be toggled

    setSelectedScopes((prev) => {
      if (enabled) {
        return prev.includes(scope) ? prev : [...prev, scope];
      } else {
        return prev.filter((s) => s !== scope);
      }
    });
  };

  const handleConfirm = () => {
    haptics.lightImpact();
    onConfirmConsent(institution, selectedScopes, selectedDuration);
  };

  // Check if only the required scope is enabled
  const isMinimalScope =
    selectedScopes.length === 1 && selectedScopes[0] === 'account_identity';

  // Human-readable scope labels for the summary
  const grantedScopeTitles = isMinimalScope
    ? 'Account Identity only (Minimal Profile)'
    : selectedScopes
        .map((s) => CONSENTED_SCOPE_DETAILS[s]?.title ?? s)
        .join(', ');

  const currentDurationOption = CONSENT_DURATION_OPTIONS.find(
    (d) => d.id === selectedDuration
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Data Access & Consent"
      subtitle={`Authorize TAMVA to access ${institution.name}`}
      maxHeight="88%"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Institution Header Card */}
        <View
          style={[
            styles.institutionHeader,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <View
            style={[
              styles.avatarContainer,
              {
                backgroundColor:
                  institution.type === 'mobile_money'
                    ? theme.colors.primaryLight
                    : theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Icon
              name={institution.icon}
              size={20}
              color={
                institution.type === 'mobile_money'
                  ? theme.colors.primary
                  : theme.colors.textPrimary
              }
            />
          </View>
          <View style={styles.institutionHeaderText}>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textPrimary, fontWeight: '600' },
              ]}
              numberOfLines={1}
            >
              {institution.name}
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginTop: 1 },
              ]}
              numberOfLines={1}
            >
              {institution.categoryLabel} • {institution.defaultAccountType}
            </Text>
          </View>
        </View>

        {/* Purpose Banner */}
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
              Why TAMVA needs this data
            </Text>
          </View>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginTop: 6, lineHeight: 18 },
            ]}
          >
            {DEFAULT_CONSENT_PURPOSE}
          </Text>
        </View>

        {/* Section 1: Requested Scopes */}
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
            Requested Permissions
          </Text>
        </View>

        {ALL_SCOPES.map((scopeKey) => {
          const detail = CONSENTED_SCOPE_DETAILS[scopeKey];
          if (!detail) return null;

          return (
            <ConsentScopeRow
              key={scopeKey}
              scope={detail}
              isSelected={selectedScopes.includes(scopeKey)}
              onToggle={handleToggleScope}
              disabled={isConnecting}
            />
          );
        })}

        {/* Minimal Scope Warning Notice (Edge Case 6) */}
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

        {/* Section 2: Access Duration */}
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
          selectedDuration={selectedDuration}
          onSelectDuration={setSelectedDuration}
        />

        {/* Section 3: Consent Summary */}
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
            Consent Summary
          </Text>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <View style={styles.summaryRow}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              Institution
            </Text>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textPrimary },
              ]}
            >
              {institution.name}
            </Text>
          </View>

          <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.summaryRow}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              Data Shared
            </Text>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textPrimary, flex: 1, textAlign: 'right', marginLeft: 12 },
              ]}
              numberOfLines={2}
            >
              {grantedScopeTitles}
            </Text>
          </View>

          <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.summaryRow}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              Purpose
            </Text>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textPrimary },
              ]}
            >
              Financial profile & intelligence
            </Text>
          </View>

          <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.summaryRow}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
              Access Duration
            </Text>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textPrimary },
              ]}
            >
              {currentDurationOption?.label ?? '90 Days'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            label={isConnecting ? 'Connecting simulated provider...' : 'Give TAMVA access'}
            onPress={handleConfirm}
            loading={isConnecting}
            disabled={isConnecting}
            variant="primary"
            leftIcon="check-circle"
            fullWidth
          />
          <View style={{ height: 8 }} />
          <Button
            label="Cancel"
            onPress={onClose}
            disabled={isConnecting}
            variant="tertiary"
            fullWidth
          />
        </View>

        {/* Trust Disclaimer */}
        <View style={styles.trustDisclaimer}>
          <Icon name="lock" size={12} color={theme.colors.textTertiary} />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary, marginLeft: 6 },
            ]}
          >
            Read-only synchronization • Revocable anytime
          </Text>
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
  institutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  institutionHeaderText: {
    flex: 1,
  },
  purposeCard: {
    padding: 14,
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
  summaryCard: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryDivider: {
    height: 1,
    marginVertical: 10,
  },
  actionsContainer: {
    marginTop: 4,
  },
  trustDisclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
});
