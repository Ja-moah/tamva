/**
 * TAMVA BrandLogo Component
 *
 * Universal, zero-dependency brand logo component for financial institutions,
 * mobile money providers, and utilities across Ghana.
 *
 * Features:
 * - Direct local asset resolution with zero network latency
 * - Optical scale calibration for varying aspect ratios (banners vs square marks)
 * - Restrained container styling respecting TAMVA's theme (background, borders, radius)
 * - Seamless fallback to semantic Feather icons when unmapped
 * - Disconnected / inactive visual states
 */

import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ViewStyle,
  ImageStyle,
  ImageSourcePropType,
} from 'react-native';
import { useTheme } from '../../theme';
import { FeatherIconName } from '../../constants/icons';
import { Icon } from './Icon';
import {
  BrandKey,
  getBrandAsset,
  getBrandMetadata,
  normalizeBrandName,
} from '../../constants/brands';

export interface BrandLogoProps {
  /** Name of the institution, provider, or merchant (e.g. 'GCB Bank', 'Stanbic Bank Ghana') */
  name?: string | null;
  /** Explicit brand key override if known */
  brandKey?: BrandKey | null;
  /** Custom image source override */
  source?: ImageSourcePropType | null;
  /** Explicit size of the image inside the container (defaults to containerSize * opticalScale) */
  size?: number;
  /** Dimension of the outer container (defaults to 40) */
  containerSize?: number;
  /** Shape of the container (defaults to 'circle') */
  shape?: 'circle' | 'rounded' | 'square';
  /** Fallback icon when no brand asset is found (defaults to 'credit-card') */
  fallbackIcon?: FeatherIconName;
  /** Fallback icon color */
  fallbackIconColor?: string;
  /** Fallback container background color */
  fallbackBg?: string;
  /** Whether the account/connection is inactive or disconnected (applies subtle muted opacity) */
  isDisconnected?: boolean;
  /** Whether to render within an outer bordered container (defaults to true) */
  showContainer?: boolean;
  /** Additional container style */
  style?: ViewStyle;
  /** Additional image style */
  imageStyle?: ImageStyle;
  /** Accessible label */
  accessibilityLabel?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  name,
  brandKey,
  source,
  size,
  containerSize = 40,
  shape = 'circle',
  fallbackIcon = 'credit-card',
  fallbackIconColor,
  fallbackBg,
  isDisconnected = false,
  showContainer = true,
  style,
  imageStyle,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();
  const [imageError, setImageError] = useState(false);

  // 1. Resolve key & metadata
  const resolvedKey = brandKey ?? normalizeBrandName(name);
  const metadata = resolvedKey ? getBrandMetadata(resolvedKey) : null;
  const imageSource = source ?? (resolvedKey ? getBrandAsset(resolvedKey) : null);

  const hasValidAsset = Boolean(imageSource) && !imageError;

  // 2. Determine optical dimensions
  const opticalScale = metadata?.opticalScale ?? 0.8;
  const computedImageSize = size ?? Math.round(containerSize * opticalScale);
  const iconSize = size ?? Math.round(containerSize * 0.46);

  // 3. Container styling
  const borderRadius =
    shape === 'circle'
      ? containerSize / 2
      : shape === 'rounded'
      ? theme.radius.md
      : 0;

  const containerBackground =
    metadata?.containerBg ??
    (fallbackBg || (isDisconnected ? theme.colors.surfaceElevated : theme.colors.surface));

  const resolvedA11yLabel =
    accessibilityLabel ||
    (metadata?.displayName
      ? `${metadata.displayName} logo`
      : name
      ? `${name} icon`
      : 'Institution logo');

  // If container is disabled, render just the image or fallback icon
  if (!showContainer) {
    if (hasValidAsset) {
      return (
        <Image
          source={imageSource!}
          onError={() => setImageError(true)}
          style={[
            {
              width: computedImageSize,
              height: computedImageSize,
              opacity: isDisconnected ? 0.45 : 1,
            },
            imageStyle,
          ]}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel={resolvedA11yLabel}
        />
      );
    }
    return (
      <Icon
        name={fallbackIcon}
        size={iconSize}
        color={
          fallbackIconColor ||
          (isDisconnected ? theme.colors.textTertiary : theme.colors.textPrimary)
        }
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius,
          backgroundColor: isDisconnected
            ? theme.colors.surfaceElevated
            : containerBackground,
          borderColor: theme.colors.border,
          borderWidth: 1,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={resolvedA11yLabel}
    >
      {hasValidAsset ? (
        <Image
          source={imageSource!}
          onError={() => setImageError(true)}
          style={[
            styles.image,
            {
              width: computedImageSize,
              height: computedImageSize,
              opacity: isDisconnected ? 0.45 : 1,
            },
            imageStyle,
          ]}
          resizeMode="contain"
        />
      ) : (
        <Icon
          name={fallbackIcon}
          size={iconSize}
          color={
            fallbackIconColor ||
            (isDisconnected ? theme.colors.textTertiary : theme.colors.textPrimary)
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  image: {
    alignSelf: 'center',
  },
});
