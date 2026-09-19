/**
 * TAMVA ContributionPlanStep Component (Step 3)
 *
 * Frequency configuration and estimated contribution breakdown:
 * - Options: Weekly, Every 2 weeks, Monthly, Flexible
 * - Period-accurate calculation between current date and target date
 * - Strictly labelled "Estimated contribution" & "Based on your target and selected timeframe"
 * - Clear disclaimer: not a guaranteed achievable plan
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { SavingsFrequency } from '../../types/save';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import {
  calculateEstimatedContribution,
  formatTargetDate,
} from '../../demo/data/mockSaveData';

export interface ContributionPlanStepProps {
  goalName: string;
  targetAmount: number;
  targetDate?: string;
  initialFrequency: SavingsFrequency;
  onContinue: (frequency: SavingsFrequency) => void;
  onBack: () => void;
}

interface FrequencyOption {
  id: SavingsFrequency;
  title: string;
  description: string;
  icon: 'calendar' | 'clock' | 'repeat' | 'sliders';
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  {
    id: 'weekly',
    title: 'Weekly',
    description: 'Set aside money once every week',
    icon: 'calendar',
  },
  {
    id: 'biweekly',
    title: 'Every 2 weeks',
    description: 'Set aside money twice a month or biweekly',
    icon: 'repeat',
  },
  {
    id: 'monthly',
    title: 'Monthly',
    description: 'Set aside money once every month',
    icon: 'clock',
  },
  {
    id: 'flexible',
    title: 'Flexible',
    description: 'Add money whenever you are ready',
    icon: 'sliders',
  },
];

export const ContributionPlanStep: React.FC<ContributionPlanStepProps> = ({
  goalName,
  targetAmount,
  targetDate,
  initialFrequency,
  onContinue,
  onBack,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const [frequency, setFrequency] = useState<SavingsFrequency>(initialFrequency);

  const estimate = useMemo(
    () => calculateEstimatedContribution(targetAmount, frequency, targetDate),
    [targetAmount, frequency, targetDate]
  );

  const handleSelectFrequency = (selected: SavingsFrequency) => {
    haptics.selection();
    setFrequency(selected);
  };

  const handleContinue = () => {
    haptics.selection();
    onContinue(frequency);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. SCREEN HEADER */}
      <ScreenHeader
        title="Contribution Plan"
        subtitle={goalName}
        showBack={true}
        onBackPress={onBack}
        borderBottom={true}
      />

      {/* 2. SCROLLABLE CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 80 },
        ]}
      >
        <View style={styles.introHeader}>
          <Text
            style={[
              theme.typography.subheading,
              { color: theme.colors.textPrimary },
            ]}
          >
            How frequently do you want to contribute?
          </Text>
          <Text
            style={[
              theme.typography.bodySm,
              { color: theme.colors.textSecondary, marginTop: 4 },
            ]}
          >
            Choose a frequency to calculate an estimated contribution plan.
          </Text>
        </View>

        {/* Frequency Options */}
        <View style={styles.optionsList}>
          {FREQUENCY_OPTIONS.map((opt) => {
            const isSelected = frequency === opt.id;
            return (
              <Card
                key={opt.id}
                variant="standard"
                onPress={() => handleSelectFrequency(opt.id)}
                style={{
                  ...styles.optionCard,
                  backgroundColor: isSelected
                    ? theme.colors.primaryLight
                    : theme.colors.surface,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                }}
                accessibilityLabel={`${opt.title}, ${opt.description}`}
              >
                <View style={styles.cardRow}>
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.surfaceElevated,
                      },
                    ]}
                  >
                    <Icon
                      name={opt.icon}
                      size={20}
                      color={isSelected ? '#FFFFFF' : theme.colors.textSecondary}
                    />
                  </View>

                  <View style={styles.optionDetails}>
                    <Text
                      style={[
                        theme.typography.bodyMedium,
                        {
                          color: isSelected
                            ? theme.colors.primary
                            : theme.colors.textPrimary,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      {opt.title}
                    </Text>
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.textSecondary, marginTop: 2 },
                      ]}
                    >
                      {opt.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.borderStrong,
                      },
                    ]}
                  >
                    {isSelected && (
                      <View
                        style={[
                          styles.radioInnerDot,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      />
                    )}
                  </View>
                </View>
              </Card>
            );
          })}
        </View>

        {/* Calculation Estimate Card */}
        <View
          style={[
            styles.estimateCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.estimateHeader}>
            <Icon name="info" size={16} color={theme.colors.primary} />
            <Text
              style={[
                theme.typography.caption,
                styles.estimateLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              {estimate.label}
            </Text>
          </View>

          <Text
            style={[
              theme.typography.heading,
              { color: theme.colors.textPrimary, marginVertical: 4 },
            ]}
          >
            {estimate.displayText}
          </Text>

          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary, marginBottom: 8 },
            ]}
          >
            {estimate.description}
            {targetDate ? ` (Target: ${formatTargetDate(targetDate)})` : ''}
          </Text>

          {/* Transparency Disclaimer */}
          <View
            style={[
              styles.disclaimerBox,
              { backgroundColor: theme.colors.backgroundAlt },
            ]}
          >
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, fontSize: 12 },
              ]}
            >
              This calculation is an estimate for planning purposes only and is
              not a guaranteed achievable return or mandatory obligation.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 3. FIXED BOTTOM CONTINUE BUTTON */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <Button
          label="Choose Funding Account"
          variant="primary"
          onPress={handleContinue}
          fullWidth={true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  introHeader: {
    marginBottom: 16,
  },
  optionsList: {
    gap: 10,
    marginBottom: 20,
  },
  optionCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionDetails: {
    flex: 1,
    paddingRight: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  estimateCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  estimateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  estimateLabel: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  disclaimerBox: {
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
