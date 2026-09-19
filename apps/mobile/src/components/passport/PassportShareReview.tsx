/**
 * TAMVA PassportShareReview Component
 *
 * Step 4 of the Share Financial Passport flow.
 * Pre-authorization staged review displaying all parameters before generating
 * the demo share record.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  PassportSharePurposeId,
  PassportShareScopeId,
  PassportShareDurationId,
} from '../../types/passport';
import {
  PASSPORT_SHARE_PURPOSES,
  PASSPORT_SHARE_SCOPES,
  PASSPORT_SHARE_DURATIONS,
} from '../../demo/data/mockPassportData';

export interface PassportShareReviewProps {
  purposeId: PassportSharePurposeId;
  customNote: string;
  selectedScopes: PassportShareScopeId[];
  durationId: PassportShareDurationId;
  holderName: string;
  passportId: string;
  isCreating: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

export const PassportShareReview: React.FC<PassportShareReviewProps> = ({
  purposeId,
  customNote,
  selectedScopes,
  durationId,
  holderName,
  passportId,
  isCreating,
  onBack,
  onConfirm,
}) => {
  const { theme } = useTheme();

  const purposeItem = PASSPORT_SHARE_PURPOSES.find((p) => p.id === purposeId);
  const durationItem = PASSPORT_SHARE_DURATIONS.find((d) => d.id === durationId);

  const selectedScopeObjects = PASSPORT_SHARE_SCOPES.filter((s) =>
    selectedScopes.includes(s.id)
  );

  return (
    <View style={styles.container}>
      <Text
        style={[
          theme.typography.caption,
          { color: theme.colors.textSecondary, marginBottom: 14, lineHeight: 18 },
        ]}
      >
        Please review the share details below. Only the information listed will
        be authorized for presentation.
      </Text>

      {/* Review Summary Card */}
      <View
        style={[
          styles.reviewCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {/* Purpose Row */}
        <View style={styles.sectionRow}>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textTertiary,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                fontSize: 10,
              },
            ]}
          >
            SHARE PURPOSE
          </Text>
          <Text
            style={[
              theme.typography.bodyMedium,
              {
                color: theme.colors.textPrimary,
                fontWeight: '600',
                marginTop: 2,
              },
            ]}
          >
            {purposeItem?.label}
          </Text>
          {customNote ? (
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginTop: 2 },
              ]}
            >
              &quot;{customNote}&quot;
            </Text>
          ) : null}
        </View>

        <View
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        {/* Profile Holder Row */}
        <View style={styles.sectionRow}>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textTertiary,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                fontSize: 10,
              },
            ]}
          >
            CREDENTIAL HOLDER
          </Text>
          <View style={styles.holderRow}>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textPrimary, fontWeight: '600' },
              ]}
            >
              {holderName}
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, marginLeft: 8 },
              ]}
            >
              {passportId}
            </Text>
          </View>
        </View>

        <View
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        {/* Duration Row */}
        <View style={styles.sectionRow}>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textTertiary,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                fontSize: 10,
              },
            ]}
          >
            ACCESS DURATION
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Icon
              name="clock"
              size={13}
              color={theme.colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textPrimary, fontWeight: '600' },
              ]}
            >
              {durationItem?.label}
            </Text>
          </View>
        </View>

        <View
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        {/* Scopes Included List */}
        <View style={styles.sectionRow}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <Text
              style={[
                theme.typography.captionMedium,
                {
                  color: theme.colors.textTertiary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                  fontSize: 10,
                },
              ]}
            >
              INFORMATION INCLUDED
            </Text>
            <Badge
              label={`${selectedScopeObjects.length} Categories`}
              tone="information"
              size="sm"
            />
          </View>

          <View style={styles.scopesPillsContainer}>
            {selectedScopeObjects.map((scope) => (
              <View
                key={scope.id}
                style={[
                  styles.scopePill,
                  {
                    backgroundColor: theme.colors.backgroundAlt,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Icon
                  name={scope.icon}
                  size={12}
                  color={theme.colors.primary}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    theme.typography.captionMedium,
                    { color: theme.colors.textPrimary, fontSize: 11 },
                  ]}
                >
                  {scope.title}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Reassurance Banner */}
      <View
        style={[
          styles.reassuranceBanner,
          {
            backgroundColor: theme.colors.backgroundAlt,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Icon
          name="shield"
          size={14}
          color={theme.colors.primary}
          style={{ marginRight: 8, marginTop: 2 }}
        />
        <Text
          style={[
            theme.typography.caption,
            {
              color: theme.colors.textSecondary,
              flex: 1,
              fontSize: 11,
              lineHeight: 16,
            },
          ]}
        >
          You are authorizing a local presentation of your consented financial
          standing. You can revoke access at any time from your Passport screen.
        </Text>
      </View>

      {/* Primary & Back Actions */}
      <View style={styles.buttonRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Button
            label="Back"
            onPress={onBack}
            variant="secondary"
            size="lg"
            disabled={isCreating}
            fullWidth
          />
        </View>
        <View style={{ flex: 2 }}>
          <Button
            label={isCreating ? 'Creating Share...' : 'Create Share'}
            onPress={onConfirm}
            variant="primary"
            size="lg"
            loading={isCreating}
            disabled={isCreating}
            rightIcon="check"
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
  reviewCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  sectionRow: {
    paddingVertical: 6,
  },
  holderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  scopesPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  scopePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  reassuranceBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
});
