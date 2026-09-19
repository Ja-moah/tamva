/**
 * TAMVA RiskDecisionContextSheet Component
 *
 * Lightweight selection BottomSheet for choosing a Decision Intelligence review context (Phase 8C).
 * Context selection frames the explanatory narrative only; it does NOT modify
 * underlying risk scores, calculate fake probabilities, or change financial metrics.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { RiskDecisionContext } from '../../types/risk';
import { DECISION_CONTEXT_OPTIONS } from '../../demo/data/mockRiskData';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

export interface RiskDecisionContextSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedContext: RiskDecisionContext;
  onSelectContext: (context: RiskDecisionContext) => void;
}

export const RiskDecisionContextSheet: React.FC<RiskDecisionContextSheetProps> = ({
  visible,
  onClose,
  selectedContext,
  onSelectContext,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const handleSelect = (contextId: RiskDecisionContext) => {
    haptics.selection();
    onSelectContext(contextId);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Select Decision Context"
      subtitle="Choose a review context to tailor financial signals"
      maxHeight="85%"
    >
      <View style={styles.container}>
        {/* Advisory disclaimer banner */}
        <View
          style={[
            styles.advisoryBox,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <Icon
            name="info"
            size={13}
            color={theme.colors.textSecondary}
            style={styles.advisoryIcon}
          />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, flex: 1, lineHeight: 16 },
            ]}
          >
            Context selection frames the narrative for review and does not alter your underlying risk assessment.
          </Text>
        </View>

        {/* Options List */}
        <View
          style={[
            styles.optionsList,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          {DECISION_CONTEXT_OPTIONS.map((option, idx) => {
            const isSelected = selectedContext === option.id;
            const isLast = idx === DECISION_CONTEXT_OPTIONS.length - 1;

            return (
              <Pressable
                key={option.id}
                onPress={() => handleSelect(option.id)}
                style={({ pressed }) => [
                  styles.optionRow,
                  pressed && { backgroundColor: theme.colors.backgroundAlt },
                  !isLast && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
                accessible
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Decision context: ${option.label}. ${option.description}`}
              >
                {/* Left: Context Icon */}
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primaryLight
                        : theme.colors.backgroundAlt,
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                >
                  <Icon
                    name={option.icon}
                    size={16}
                    color={
                      isSelected
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                    }
                  />
                </View>

                {/* Center: Label and Description */}
                <View style={styles.textCol}>
                  <Text
                    style={[
                      theme.typography.label,
                      {
                        color: isSelected
                          ? theme.colors.textPrimary
                          : theme.colors.textSecondary,
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.textTertiary, marginTop: 2 },
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>

                {/* Right: Checkmark indicator */}
                {isSelected && (
                  <View style={styles.checkCol}>
                    <Icon
                      name="check"
                      size={18}
                      color={theme.colors.primary}
                    />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Action: Done Button */}
        <Button
          label="Done"
          variant="secondary"
          size="lg"
          fullWidth
          onPress={onClose}
          style={styles.doneButton}
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  advisoryBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    marginBottom: 14,
  },
  advisoryIcon: {
    marginTop: 2,
  },
  optionsList: {
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 56,
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  checkCol: {
    marginLeft: 8,
  },
  doneButton: {
    minHeight: 48,
  },
});
