/**
 * TAMVA MoneyDisplay Component
 *
 * Core financial value presenter.
 * Integrates with PrivacyContext to automatically mask sensitive amounts,
 * supports currency codes (default: GHS / GH₵), positive/negative/neutral flows,
 * and typographic scales tailored for fintech hierarchy.
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { usePrivacy } from '../../hooks/usePrivacy';
import { CurrencyCode, TransactionFlow } from '../../types/financial';
import { formatCurrency, maskCurrency } from '../../utils/currency';
import { Icon } from '../ui/Icon';

export type MoneyDisplaySize = 'sm' | 'md' | 'lg' | 'display';

export interface MoneyDisplayProps {
  amount: number;
  currency?: CurrencyCode;
  flow?: TransactionFlow;
  size?: MoneyDisplaySize;
  isPrivate?: boolean; // If undefined, uses global PrivacyContext
  showPrivacyToggle?: boolean;
  showSign?: boolean;
  hideDecimals?: boolean;
  compact?: boolean;
  style?: ViewStyle;
}

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({
  amount,
  currency = 'GHS',
  flow = 'neutral',
  size = 'md',
  isPrivate: overridePrivate,
  showPrivacyToggle = false,
  showSign = false,
  hideDecimals = false,
  compact = false,
  style,
}) => {
  const { theme } = useTheme();
  const { isPrivate: globalPrivate, togglePrivacy } = usePrivacy();

  const isMasked = overridePrivate !== undefined ? overridePrivate : globalPrivate;

  // Smooth cross-fade animation for instantaneous, elegant transition
  const fadeAnim = useState(() => new Animated.Value(1))[0];
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    fadeAnim.setValue(0.35);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 160,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isMasked, fadeAnim]);

  // Resolve typography based on size
  const getSizeStyles = (): { text: TextStyle; iconSize: number; minHeight: number } => {
    switch (size) {
      case 'sm':
        return {
          text: {
            ...theme.typography.numericSm,
            fontSize: 15,
            lineHeight: 20,
            fontWeight: '600',
          } as TextStyle,
          iconSize: 14,
          minHeight: 20,
        };
      case 'md':
        return {
          text: {
            ...theme.typography.numeric,
            fontSize: 18,
            lineHeight: 24,
            fontWeight: '600',
          } as TextStyle,
          iconSize: 18,
          minHeight: 24,
        };
      case 'lg':
        return {
          text: {
            ...theme.typography.numericLg,
            fontSize: 24,
            lineHeight: 30,
            fontWeight: '700',
          } as TextStyle,
          iconSize: 22,
          minHeight: 30,
        };
      case 'display':
        return {
          text: {
            ...theme.typography.numericLg,
            fontSize: 34,
            lineHeight: 40,
            fontWeight: '700',
          } as TextStyle,
          iconSize: 24,
          minHeight: 42,
        };
    }
  };

  // Resolve color based on flow
  const getFlowColor = (): string => {
    if (isMasked) return theme.colors.textPrimary;
    switch (flow) {
      case 'income':
        return theme.colors.income;
      case 'outflow':
        return theme.colors.outflow;
      case 'neutral':
      default:
        return theme.colors.textPrimary;
    }
  };

  const sizeStyle = getSizeStyles();
  const textColor = getFlowColor();

  const formattedDisplay = isMasked
    ? maskCurrency(currency)
    : formatCurrency(amount, {
        currency,
        flow,
        showSign,
        hideDecimals,
        compact,
      });

  // Split integer and decimal parts for sophisticated fintech decimal hierarchy
  let integerPart = formattedDisplay;
  let decimalPart = '';
  if (!isMasked && !compact && formattedDisplay.includes('.')) {
    const dotIndex = formattedDisplay.lastIndexOf('.');
    integerPart = formattedDisplay.substring(0, dotIndex);
    decimalPart = formattedDisplay.substring(dotIndex);
  }

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[{ opacity: fadeAnim, minHeight: sizeStyle.minHeight, justifyContent: 'center' }]}>
        <Text
          style={[
            sizeStyle.text,
            { color: textColor },
          ]}
          accessibilityRole="text"
          accessibilityLabel={`Amount: ${isMasked ? 'Hidden for privacy' : formattedDisplay}`}
          accessibilityHint={isMasked ? 'Masked for confidentiality. Tap privacy toggle to reveal.' : undefined}
        >
          {integerPart}
          {decimalPart ? (
            <Text
              style={{
                fontSize: Math.round(Number(sizeStyle.text.fontSize || 16) * 0.78),
                opacity: 0.72,
              }}
            >
              {decimalPart}
            </Text>
          ) : null}
        </Text>
      </Animated.View>

      {showPrivacyToggle && (
        <Pressable
          onPress={togglePrivacy}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.toggleBtn}
          accessibilityRole="button"
          accessibilityLabel={isMasked ? 'Reveal amount' : 'Hide amount'}
          accessibilityHint="Toggles privacy masking for financial balance"
        >
          <Icon
            name={isMasked ? 'eye-off' : 'eye'}
            size={sizeStyle.iconSize}
            color={theme.colors.textTertiary}
          />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleBtn: {
    marginLeft: 8,
    padding: 2,
  },
});
