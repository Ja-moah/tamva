/**
 * TAMVA PassportShareScopes Component
 *
 * Step 2 of the Share Financial Passport flow.
 * Lets the user granularly select which data scopes to include.
 * Identity & Standing Status is required; all other scopes are optional.
 */

import React from 'react';
import { View, Text, Switch, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PassportShareScopeId } from '../../types/passport';
import { PASSPORT_SHARE_SCOPES } from '../../demo/data/mockPassportData';

export interface PassportShareScopesProps {
  selectedScopes: PassportShareScopeId[];
  onToggleScope: (scopeId: PassportShareScopeId) => void;
  onBack: () => void;
  onContinue: () => void;
}

export const PassportShareScopes: React.FC<PassportShareScopesProps> = ({
  selectedScopes,
  onToggleScope,
  onBack,
  onContinue,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const handleToggle = (scopeId: PassportShareScopeId, isRequired: boolean) => {
    if (isRequired) {
      haptics.warning();
      return;
    }
    haptics.selection();
    onToggleScope(scopeId);
  };

  return (
    <View style={styles.container}>
      <Text
        style={[
          theme.typography.caption,
          { color: theme.colors.textSecondary, marginBottom: 14, lineHeight: 18 },
        ]}
      >
        Only the information you select will be included in this Passport share.
        You can customize or remove any optional categories.
      </Text>

      {/* Scopes List */}
      <View style={styles.list}>
        {PASSPORT_SHARE_SCOPES.map((scope) => {
          const isSelected = selectedScopes.includes(scope.id);

          return (
            <Pressable
              key={scope.id}
              onPress={() => handleToggle(scope.id, scope.isRequired)}
              style={({ pressed }) => [
                styles.scopeCard,
                {
                  backgroundColor: scope.isRequired
                    ? theme.colors.backgroundAlt
                    : theme.colors.surface,
                  borderColor: isSelected
                    ? theme.colors.primaryMedium
                    : theme.colors.border,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{
                checked: isSelected,
                disabled: scope.isRequired,
              }}
              accessibilityLabel={`${scope.title}: ${
                scope.isRequired ? 'Required' : 'Optional'
              }, currently ${isSelected ? 'included' : 'excluded'}`}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconTitleRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primaryLight
                          : theme.colors.backgroundAlt,
                      },
                    ]}
                  >
                    <Icon
                      name={scope.icon}
                      size={15}
                      color={
                        isSelected
                          ? theme.colors.primary
                          : theme.colors.textSecondary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      theme.typography.bodyMedium,
                      {
                        color: theme.colors.textPrimary,
                        fontWeight: '600',
                        fontSize: 14,
                      },
                    ]}
                  >
                    {scope.title}
                  </Text>
                </View>

                {scope.isRequired ? (
                  <View style={styles.lockedBadge}>
                    <Icon
                      name="lock"
                      size={11}
                      color={theme.colors.textTertiary}
                      style={{ marginRight: 4 }}
                    />
                    <Badge label="Required" tone="neutral" size="sm" />
                  </View>
                ) : (
                  <Switch
                    value={isSelected}
                    onValueChange={() => handleToggle(scope.id, false)}
                    trackColor={{
                      false: theme.colors.borderStrong,
                      true: theme.colors.primary,
                    }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor={theme.colors.borderStrong}
                  />
                )}
              </View>

              <Text
                style={[
                  theme.typography.caption,
                  {
                    color: theme.colors.textSecondary,
                    marginTop: 6,
                    lineHeight: 16,
                  },
                ]}
              >
                {scope.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Selected Scopes Counter */}
      <View
        style={[
          styles.summaryBar,
          {
            backgroundColor: theme.colors.backgroundAlt,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Icon
          name="check-circle"
          size={14}
          color={theme.colors.primary}
          style={{ marginRight: 6 }}
        />
        <Text
          style={[
            theme.typography.captionMedium,
            { color: theme.colors.textPrimary, fontSize: 12 },
          ]}
        >
          {selectedScopes.length} of {PASSPORT_SHARE_SCOPES.length} information
          categories selected
        </Text>
      </View>

      {/* Minimal Scope Transparency Banner */}
      {selectedScopes.length === 1 && (
        <View
          style={[
            styles.minimalScopeNotice,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon
            name="info"
            size={13}
            color={theme.colors.textSecondary}
            style={{ marginRight: 6, marginTop: 1 }}
          />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, flex: 1, fontSize: 11, lineHeight: 16 },
            ]}
          >
            Minimal Profile: Only identity and credential validity will be included. Financial balances, confidence score, and cashflow details will be excluded from this share.
          </Text>
        </View>
      )}

      {/* Navigation Buttons */}
      <View style={styles.buttonRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Button
            label="Back"
            onPress={onBack}
            variant="secondary"
            size="lg"
            fullWidth
          />
        </View>
        <View style={{ flex: 2 }}>
          <Button
            label="Choose Duration"
            onPress={onContinue}
            variant="primary"
            size="lg"
            rightIcon="arrow-right"
            fullWidth
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 24,
  },
  list: {
    width: '100%',
    gap: 8,
  },
  scopeCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
    marginBottom: 16,
  },
  minimalScopeNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
});
