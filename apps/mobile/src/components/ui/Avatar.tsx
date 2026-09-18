/**
 * TAMVA Avatar Component
 *
 * User and institution avatar supporting images, monogram initials,
 * and icon fallbacks with optional presence indicators.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { useTheme } from '../../theme';
import { FeatherIconName } from '../../constants/icons';
import { Icon } from './Icon';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  source?: ImageSourcePropType | string;
  name?: string;
  icon?: FeatherIconName;
  size?: AvatarSize;
  showStatus?: boolean;
  statusColor?: string;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  icon = 'user',
  size = 'md',
  showStatus = false,
  statusColor,
  style,
}) => {
  const { theme } = useTheme();
  const [imageError, setImageError] = useState(false);

  const getDimension = (): { size: number; fontSize: number; iconSize: number; statusSize: number } => {
    switch (size) {
      case 'xs':
        return { size: 24, fontSize: 10, iconSize: 12, statusSize: 6 };
      case 'sm':
        return { size: 32, fontSize: 12, iconSize: 16, statusSize: 8 };
      case 'md':
        return { size: 40, fontSize: 14, iconSize: 20, statusSize: 10 };
      case 'lg':
        return { size: 48, fontSize: 16, iconSize: 24, statusSize: 12 };
      case 'xl':
        return { size: 64, fontSize: 20, iconSize: 32, statusSize: 14 };
    }
  };

  const getInitials = (fullName?: string): string => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const dim = getDimension();
  const initials = getInitials(name);
  const imageUri = typeof source === 'string' ? { uri: source } : source;
  const canShowImage = Boolean(source) && !imageError;

  return (
    <View style={[styles.wrapper, { width: dim.size, height: dim.size }, style]}>
      <View
        style={[
          styles.container,
          {
            width: dim.size,
            height: dim.size,
            borderRadius: dim.size / 2,
            backgroundColor: theme.colors.primaryLight,
            borderColor: theme.colors.border,
            borderWidth: 1,
          },
        ]}
      >
        {canShowImage ? (
          <Image
            source={imageUri!}
            onError={() => setImageError(true)}
            style={[
              styles.image,
              { width: dim.size, height: dim.size, borderRadius: dim.size / 2 },
            ]}
            accessibilityRole="image"
            accessibilityLabel={name || 'Avatar'}
          />
        ) : initials ? (
          <Text
            style={[
              theme.typography.button,
              {
                color: theme.colors.primary,
                fontSize: dim.fontSize,
                fontWeight: '700',
              },
            ]}
          >
            {initials}
          </Text>
        ) : (
          <Icon
            name={icon}
            size={dim.iconSize}
            color={theme.colors.primary}
          />
        )}
      </View>

      {showStatus && (
        <View
          style={[
            styles.statusIndicator,
            {
              width: dim.statusSize,
              height: dim.statusSize,
              borderRadius: dim.statusSize / 2,
              backgroundColor: statusColor || theme.colors.success,
              borderColor: theme.colors.surface,
              borderWidth: dim.statusSize > 8 ? 2 : 1.5,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  statusIndicator: {
    position: 'absolute',
  },
});
