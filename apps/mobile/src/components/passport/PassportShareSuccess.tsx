/**
 * TAMVA PassportShareSuccess Component
 *
 * Step 5 of the Share Financial Passport flow.
 * Confirmation state displaying the newly generated Share ID, summary,
 * and options to either view the Demo QR or return to the Passport screen.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PassportShareRecord } from '../../types/passport';

export interface PassportShareSuccessProps {
  share: PassportShareRecord;
  onShowQr: () => void;
  onDone: () => void;
}

export const PassportShareSuccess: React.FC<PassportShareSuccessProps> = ({
  share,
  onShowQr,
  onDone,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {/* Top Success Icon */}
      <View style={styles.topIconWrapper}>
        <View
          style={[
            styles.successCircle,
            { backgroundColor: theme.colors.successLight },
          ]}
        >
          <Icon name="check" size={28} color={theme.colors.success} />
        </View>
        <Text
          style={[
            theme.typography.heading,
            { color: theme.colors.textPrimary, marginTop: 12 },
          ]}
        >
          Passport Ready to Share
        </Text>
        <Text
          style={[
            theme.typography.caption,
            {
              color: theme.colors.textSecondary,
              textAlign: 'center',
              marginTop: 4,
              lineHeight: 18,
            },
          ]}
        >
          Your financial standing profile is prepared according to your selected
          scopes.
        </Text>
      </View>

      {/* Share Record Details Card */}
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.summaryRow}>
          <Text
            style={[
              theme.typography.captionMedium,
              { color: theme.colors.textTertiary, fontSize: 11 },
            ]}
          >
            SHARE ID
          </Text>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textPrimary,
                fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                fontWeight: '600',
              },
            ]}
          >
            {share.id}
          </Text>
        </View>

        <View
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        <View style={styles.summaryRow}>
          <Text
            style={[
              theme.typography.captionMedium,
              { color: theme.colors.textTertiary, fontSize: 11 },
            ]}
          >
            PURPOSE
          </Text>
          <Text
            style={[
              theme.typography.bodyMedium,
              { color: theme.colors.textPrimary, fontWeight: '500', fontSize: 13 },
            ]}
          >
            {share.purposeLabel}
          </Text>
        </View>

        <View
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        <View style={styles.summaryRow}>
          <Text
            style={[
              theme.typography.captionMedium,
              { color: theme.colors.textTertiary, fontSize: 11 },
            ]}
          >
            VALIDITY
          </Text>
          <Text
            style={[
              theme.typography.bodyMedium,
              { color: theme.colors.textPrimary, fontWeight: '500', fontSize: 13 },
            ]}
          >
            Expires {share.expiresAt}
          </Text>
        </View>

        <View
          style={[styles.divider, { backgroundColor: theme.colors.border }]}
        />

        <View style={styles.summaryRow}>
          <Text
            style={[
              theme.typography.captionMedium,
              { color: theme.colors.textTertiary, fontSize: 11 },
            ]}
          >
            SCOPES
          </Text>
          <Badge
            label={`${share.scopes.length} Categories Included`}
            tone="success"
            size="sm"
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonStack}>
        <Button
          label="Show QR Code"
          onPress={onShowQr}
          variant="primary"
          size="lg"
          leftIcon="maximize"
          fullWidth
        />
        <View style={{ height: 10 }} />
        <Button
          label="Done"
          onPress={onDone}
          variant="secondary"
          size="lg"
          fullWidth
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 24,
    alignItems: 'center',
  },
  topIconWrapper: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  successCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  buttonStack: {
    width: '100%',
  },
});
