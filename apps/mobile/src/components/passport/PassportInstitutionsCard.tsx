/**
 * TAMVA PassportInstitutionsCard Component
 *
 * Summary card showing consented data sources contributing to the Financial Passport.
 * Provides direct navigation access to the Connected Accounts & Consent management screen.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';
import { PassportInstitutionsSummary } from '../../types/passport';

export interface PassportInstitutionsCardProps {
  summary: PassportInstitutionsSummary;
}

export const PassportInstitutionsCard: React.FC<
  PassportInstitutionsCardProps
> = ({ summary }) => {
  const { theme } = useTheme();
  const router = useRouter();

  const handleNavigateToAccounts = () => {
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
            {summary.totalConnected} Connected
          </Text>
        </View>

        <Text
          style={[
            theme.typography.bodyMedium,
            { color: theme.colors.textPrimary, marginTop: 8, fontWeight: '600' },
          ]}
        >
          Consented Institution Feeds
        </Text>

        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginTop: 2, lineHeight: 18 },
          ]}
        >
          All trust standing and behavioural indicators are powered by consented data
          from these financial institutions:
        </Text>

        {/* Source Pills / Grid */}
        <View style={styles.sourcesContainer}>
          {summary.sources.map((source) => (
            <View
              key={source.id}
              style={[
                styles.sourceItem,
                {
                  backgroundColor: theme.colors.backgroundAlt,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <BrandLogo
                name={source.name}
                containerSize={26}
                shape="rounded"
                fallbackIcon={source.icon}
                style={styles.sourceIconBox}
              />
              <View style={styles.sourceTextWrapper}>
                <Text
                  style={[
                    theme.typography.captionMedium,
                    {
                      color: theme.colors.textPrimary,
                      fontSize: 12,
                      fontWeight: '600',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {source.name}
                </Text>
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textTertiary, fontSize: 10 },
                  ]}
                  numberOfLines={1}
                >
                  {source.accountType}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA to Connected Accounts Tab */}
        <View style={styles.buttonWrapper}>
          <Button
            label="View Connected Accounts"
            onPress={handleNavigateToAccounts}
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
  sourcesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    marginBottom: 14,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 130,
  },
  sourceIconBox: {
    marginRight: 8,
  },
  sourceTextWrapper: {
    flex: 1,
    minWidth: 0,
  },
  buttonWrapper: {
    width: '100%',
  },
});
