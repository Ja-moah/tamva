/**
 * TAMVA ProfileDataMethodSheet Component
 *
 * BottomSheet explaining data provenance and normalization methodology:
 * "How your profile is built".
 * Clarifies the transparent transformation from consented accounts to behavioural signals.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { FeatherIconName } from '../../constants/icons';

export interface ProfileDataMethodSheetProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToConsent: () => void;
}

export const ProfileDataMethodSheet: React.FC<ProfileDataMethodSheetProps> = ({
  visible,
  onClose,
  onNavigateToConsent,
}) => {
  const { theme } = useTheme();

  const pipelineSteps: {
    step: string;
    title: string;
    description: string;
    icon: FeatherIconName;
  }[] = [
    {
      step: '1',
      title: 'Consented Accounts',
      description: 'You explicitly authorize read-only access to selected financial institutions.',
      icon: 'lock',
    },
    {
      step: '2',
      title: 'Financial Activity',
      description: 'Recorded deposits, outflows, and operational balances are imported securely.',
      icon: 'activity',
    },
    {
      step: '3',
      title: 'Normalized Data',
      description: 'Data from different institutions is standardized into a consistent structure.',
      icon: 'layers',
    },
    {
      step: '4',
      title: 'Behavioural Signals',
      description: 'Signals describe consistency, stability, savings habits, and liquid reserves.',
      icon: 'pie-chart',
    },
    {
      step: '5',
      title: 'Financial Profile',
      description: 'One cohesive, portable view of your observed financial behaviour.',
      icon: 'user-check',
    },
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="How Your Profile is Built"
      subtitle="Consented data pipeline"
      maxHeight="85%"
    >
      <View style={styles.container}>
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginBottom: 14, lineHeight: 18 },
          ]}
        >
          TAMVA combines financial information you have consented to share and turns it into consistent financial signals. These signals describe patterns in your financial activity.
        </Text>

        {/* Pipeline Steps List */}
        <View
          style={[
            styles.pipelineCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {pipelineSteps.map((item, idx) => {
            const isLast = idx === pipelineSteps.length - 1;

            return (
              <View key={item.step} style={styles.stepItem}>
                <View style={styles.stepIndicatorCol}>
                  <View
                    style={[
                      styles.stepCircle,
                      {
                        backgroundColor: theme.colors.primaryLight,
                        borderColor: theme.colors.primary,
                      },
                    ]}
                  >
                    <Icon
                      name={item.icon}
                      size={13}
                      color={theme.colors.primary}
                    />
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.stepLine,
                        { backgroundColor: theme.colors.border },
                      ]}
                    />
                  )}
                </View>

                <View style={styles.stepTextWrapper}>
                  <Text
                    style={[
                      theme.typography.bodyMedium,
                      { color: theme.colors.textPrimary, fontWeight: '600', fontSize: 13 },
                    ]}
                  >
                    {item.step}. {item.title}
                  </Text>
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.textSecondary, marginTop: 2, lineHeight: 16 },
                    ]}
                  >
                    {item.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* User Control Notice */}
        <View
          style={[
            styles.noticeBox,
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
            style={{ marginRight: 8, marginTop: 1 }}
          />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 16, flex: 1 },
            ]}
          >
            You control which financial sources you connect and can revoke access at any time from Connected Accounts. TAMVA does not perform automated credit scoring.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonStack}>
          <Button
            label="View Connected Accounts"
            onPress={() => {
              onClose();
              onNavigateToConsent();
            }}
            variant="secondary"
            size="md"
            rightIcon="arrow-right"
            fullWidth
          />
          <View style={{ height: 8 }} />
          <Button
            label="Done"
            onPress={onClose}
            variant="primary"
            size="md"
            fullWidth
          />
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 24,
  },
  pipelineCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    marginBottom: 14,
  },
  stepItem: {
    flexDirection: 'row',
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 28,
    marginRight: 10,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 1.5,
    flex: 1,
    marginVertical: 4,
    minHeight: 20,
  },
  stepTextWrapper: {
    flex: 1,
    paddingBottom: 14,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  buttonStack: {
    width: '100%',
  },
});
