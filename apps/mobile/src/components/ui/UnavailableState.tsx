/**
 * TAMVA UnavailableState
 *
 * The honest stand-in for something the backend cannot serve yet. It says what
 * is missing and why, never shows placeholder figures, and always offers a way
 * out.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme';
import { Button } from './Button';
import { Icon } from './Icon';

export interface UnavailableStateProps {
  title: string;
  description: string;
  /** Extra context, e.g. what needs to exist before this can be shown. */
  detail?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export const UnavailableState: React.FC<UnavailableStateProps> = ({
  title,
  description,
  detail,
  actionLabel,
  onActionPress,
}) => {
  const { theme } = useTheme();
  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${title}. Not available yet. ${description}`}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primaryMedium },
        ]}
      >
        <Icon name="clock" size={30} color={theme.colors.primary} />
      </View>
      <Text style={[theme.typography.captionMedium, styles.kicker, { color: theme.colors.textTertiary }]}>
        NOT AVAILABLE YET
      </Text>
      <Text style={[theme.typography.subheading, styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
      <Text style={[theme.typography.bodySm, styles.body, { color: theme.colors.textSecondary }]}>{description}</Text>
      {detail ? (
        <Text style={[theme.typography.caption, styles.body, { color: theme.colors.textTertiary }]}>{detail}</Text>
      ) : null}
      {actionLabel && onActionPress ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onActionPress} variant="secondary" size="md" />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 48 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  kicker: { letterSpacing: 1, marginBottom: 6 },
  title: { textAlign: 'center', marginBottom: 8 },
  body: { textAlign: 'center', marginBottom: 8, maxWidth: 320 },
  action: { marginTop: 16 },
});
