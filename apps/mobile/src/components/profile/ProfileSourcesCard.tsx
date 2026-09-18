/**
 * TAMVA ProfileSourcesCard Component
 *
 * Highlights the consented multi-institution data sources contributing
 * to the customer's Financial Profile.
 * Provides direct navigation to the Connected Accounts / Consent screen.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';
import { ProfileSource } from '../../types/profile';

export interface ProfileSourcesCardProps {
  sources: ProfileSource[];
  onSelectSource?: (source: ProfileSource) => void;
  onOpenDataMethod?: () => void;
}

export const ProfileSourcesCard: React.FC<ProfileSourcesCardProps> = ({
  sources,
  onSelectSource,
  onOpenDataMethod,
}) => {
  const { theme } = useTheme();
  const router = useRouter();

  const handleNavigateToConsent = () => {
    router.push('/(tabs)/consent');
  };

  return (
    <Card variant="elevated" padding="none" style={styles.card}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Icon
              name="link-2"
              size={15}
              color={theme.colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                theme.typography.captionMedium,
                {
                  color: theme.colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                  fontSize: 11,
                },
              ]}
            >
              DATA SOURCES
            </Text>
          </View>
          <Text
            style={[
              theme.typography.captionMedium,
              { color: theme.colors.textPrimary, fontSize: 11 },
            ]}
          >
            {sources.length} Connected
          </Text>
        </View>

        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginTop: 6, marginBottom: 12, lineHeight: 18 },
          ]}
        >
          Connected financial institutions and accounts powering your intelligence profile:
        </Text>

        {/* Sources List */}
        {sources.length === 0 ? (
          <View
            style={[
              styles.emptySourcesBox,
              {
                backgroundColor: theme.colors.backgroundAlt,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Icon
              name="link-2"
              size={20}
              color={theme.colors.textTertiary}
              style={{ marginBottom: 6 }}
            />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, textAlign: 'center' },
              ]}
            >
              No active sources found. Connect an institution in Connected Accounts to populate your profile.
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.sourcesList,
              {
                backgroundColor: theme.colors.backgroundAlt,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {sources.map((source, index) => {
              const isLast = index === sources.length - 1;
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
                ? `Updated ${source.lastUpdated}`
                : 'Recent records';

              return (
                <View key={source.id}>
                  <Pressable
                    onPress={onSelectSource ? () => onSelectSource(source) : undefined}
                    disabled={!onSelectSource}
                    style={({ pressed }) => [
                      styles.sourceItem,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                    accessibilityRole={onSelectSource ? 'button' : undefined}
                    accessibilityLabel={`${source.institutionName}, ${source.accountType}, ${statusLabel}`}
                    accessibilityHint={onSelectSource ? 'Tap to view source contribution details' : undefined}
                  >
                    <BrandLogo
                      name={source.institutionName}
                      containerSize={32}
                      shape="rounded"
                      isDisconnected={isDisconnected}
                      fallbackIcon={source.icon}
                      style={styles.iconCircle}
                    />

                    <View style={styles.sourceDetails}>
                      <View style={styles.sourceTitleRow}>
                        <Text
                          style={[
                            theme.typography.bodyMedium,
                            {
                              color: theme.colors.textPrimary,
                              fontWeight: '600',
                              fontSize: 13,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {source.institutionName}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Badge
                            label={statusLabel}
                            tone={statusTone}
                            size="sm"
                          />
                          {onSelectSource && (
                            <Icon
                              name="chevron-right"
                              size={14}
                              color={theme.colors.textTertiary}
                              style={{ marginLeft: 6 }}
                            />
                          )}
                        </View>
                      </View>

                      <Text
                        style={[
                          theme.typography.caption,
                          { color: theme.colors.textSecondary, marginTop: 2, fontSize: 11 },
                        ]}
                        numberOfLines={1}
                      >
                        {source.accountType} • {contributionText}
                      </Text>

                      <Text
                        style={[
                          theme.typography.caption,
                          { color: theme.colors.textTertiary, marginTop: 2, fontSize: 10 },
                        ]}
                      >
                        {updatedText}
                      </Text>
                    </View>
                  </Pressable>

                  {!isLast && (
                    <View
                      style={[
                        styles.rowDivider,
                        { backgroundColor: theme.colors.border },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Data Provenance Link */}
        {onOpenDataMethod && (
          <Pressable
            onPress={onOpenDataMethod}
            style={({ pressed }) => [
              styles.methodLinkBtn,
              {
                backgroundColor: theme.colors.backgroundAlt,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="How your profile is built"
            accessibilityHint="Tap to learn about data provenance and normalization methodology"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Icon
                name="info"
                size={14}
                color={theme.colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.textPrimary, fontSize: 12 },
                ]}
              >
                How your profile is built
              </Text>
            </View>
            <Icon
              name="chevron-right"
              size={14}
              color={theme.colors.textTertiary}
            />
          </Pressable>
        )}

        {/* Notice & CTA to Consent Screen */}
        <View style={styles.actionWrapper}>
          <Button
            label="View Connected Accounts"
            onPress={handleNavigateToConsent}
            variant="secondary"
            size="md"
            rightIcon="arrow-right"
            fullWidth
          />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptySourcesBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  sourcesList: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 14,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconCircle: {
    marginRight: 10,
  },
  sourceDetails: {
    flex: 1,
    minWidth: 0,
  },
  sourceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  methodLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  actionWrapper: {
    width: '100%',
  },
});
