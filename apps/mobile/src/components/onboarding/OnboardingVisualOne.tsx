/**
 * TAMVA OnboardingVisualOne Component
 *
 * Screen 1 Visual: "Your financial picture, connected."
 * Abstract native visualization showing multiple consented financial data sources
 * flowing into one central consolidated financial profile.
 * Strictly adheres to TAMVA design guidelines: No stock imagery, no fake bank logos.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../ui/Icon';
import { FeatherIconName } from '../../constants/icons';

interface SourceNode {
  id: string;
  label: string;
  icon: FeatherIconName;
}

const SOURCES: SourceNode[] = [
  { id: 'bank', label: 'Bank Accounts', icon: 'dollar-sign' },
  { id: 'momo', label: 'Mobile Money', icon: 'pocket' },
  { id: 'cards', label: 'Cards & Credit', icon: 'credit-card' },
  { id: 'fintech', label: 'Fintech Services', icon: 'sliders' },
];

export const OnboardingVisualOne: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.xl,
        },
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Abstract visualization showing bank accounts, mobile money, cards, and fintech services connecting into one consolidated financial profile."
    >
      {/* Subtle geometric background grid lines */}
      <View style={[styles.gridCircleOuter, { borderColor: theme.colors.border }]} />
      <View style={[styles.gridCircleInner, { borderColor: theme.colors.border }]} />

      {/* Crosshairs */}
      <View style={[styles.axisHorizontal, { backgroundColor: theme.colors.border }]} />
      <View style={[styles.axisVertical, { backgroundColor: theme.colors.border }]} />

      {/* Satellite Source Nodes */}
      {/* 1. Top-Left: Bank Accounts */}
      <View
        style={[
          styles.satelliteNode,
          styles.posTopLeft,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <View
          style={[
            styles.nodeIconWrap,
            { backgroundColor: theme.colors.backgroundAlt, borderColor: theme.colors.border },
          ]}
        >
          <Icon name={SOURCES[0].icon} size={14} color={theme.colors.primary} />
        </View>
        <Text
          style={[
            theme.typography.captionMedium,
            { color: theme.colors.textPrimary, fontSize: 11 },
          ]}
          numberOfLines={1}
        >
          {SOURCES[0].label}
        </Text>
      </View>

      {/* 2. Top-Right: Mobile Money */}
      <View
        style={[
          styles.satelliteNode,
          styles.posTopRight,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <View
          style={[
            styles.nodeIconWrap,
            { backgroundColor: theme.colors.backgroundAlt, borderColor: theme.colors.border },
          ]}
        >
          <Icon name={SOURCES[1].icon} size={14} color={theme.colors.primary} />
        </View>
        <Text
          style={[
            theme.typography.captionMedium,
            { color: theme.colors.textPrimary, fontSize: 11 },
          ]}
          numberOfLines={1}
        >
          {SOURCES[1].label}
        </Text>
      </View>

      {/* 3. Bottom-Left: Cards & Credit */}
      <View
        style={[
          styles.satelliteNode,
          styles.posBottomLeft,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <View
          style={[
            styles.nodeIconWrap,
            { backgroundColor: theme.colors.backgroundAlt, borderColor: theme.colors.border },
          ]}
        >
          <Icon name={SOURCES[2].icon} size={14} color={theme.colors.primary} />
        </View>
        <Text
          style={[
            theme.typography.captionMedium,
            { color: theme.colors.textPrimary, fontSize: 11 },
          ]}
          numberOfLines={1}
        >
          {SOURCES[2].label}
        </Text>
      </View>

      {/* 4. Bottom-Right: Fintech Services */}
      <View
        style={[
          styles.satelliteNode,
          styles.posBottomRight,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <View
          style={[
            styles.nodeIconWrap,
            { backgroundColor: theme.colors.backgroundAlt, borderColor: theme.colors.border },
          ]}
        >
          <Icon name={SOURCES[3].icon} size={14} color={theme.colors.primary} />
        </View>
        <Text
          style={[
            theme.typography.captionMedium,
            { color: theme.colors.textPrimary, fontSize: 11 },
          ]}
          numberOfLines={1}
        >
          {SOURCES[3].label}
        </Text>
      </View>

      {/* Central TAMVA Profile Node */}
      <View style={styles.centerAnchor}>
        <View
          style={[
            styles.centerPulseRing,
            {
              borderColor: theme.colors.primaryLight,
              backgroundColor: theme.colors.primaryLight,
            },
          ]}
        />
        <View
          style={[
            styles.centerCoreNode,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <Icon name="shield" size={24} color={theme.colors.primary} />
        </View>
        <Text
          style={[
            theme.typography.captionMedium,
            {
              color: theme.colors.textPrimary,
              fontSize: 11,
              fontWeight: '700',
              marginTop: 6,
              letterSpacing: 0.2,
            },
          ]}
        >
          TAMVA Profile
        </Text>
      </View>

      {/* Honest Status Note (Correction 1) */}
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: theme.colors.backgroundAlt,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.full,
          },
        ]}
      >
        <View
          style={[
            styles.statusDot,
            { backgroundColor: theme.colors.success },
          ]}
        />
        <Text
          style={[
            theme.typography.captionMedium,
            {
              color: theme.colors.textSecondary,
              fontSize: 11,
            },
          ]}
        >
          Consented financial data · Connected
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 270,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  gridCircleOuter: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.45,
  },
  gridCircleInner: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    opacity: 0.4,
  },
  axisHorizontal: {
    position: 'absolute',
    width: 200,
    height: 1,
    opacity: 0.35,
  },
  axisVertical: {
    position: 'absolute',
    width: 1,
    height: 180,
    opacity: 0.35,
  },
  centerAnchor: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  centerPulseRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    opacity: 0.5,
  },
  centerCoreNode: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  satelliteNode: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 1,
    gap: 6,
    zIndex: 4,
  },
  nodeIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posTopLeft: {
    top: 20,
    left: 16,
  },
  posTopRight: {
    top: 20,
    right: 16,
  },
  posBottomLeft: {
    bottom: 50,
    left: 16,
  },
  posBottomRight: {
    bottom: 50,
    right: 16,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    gap: 6,
    zIndex: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
