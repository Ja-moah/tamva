/**
 * TAMVA QuickActions Component
 *
 * Lightweight, elegant action shortcuts (Send, Receive, Save, More).
 * Avoids loud generic banking button styling in favour of restrained, calm fintech aesthetics.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { Icon } from '../ui/Icon';
import { QuickActionItem } from '../../types/home';

export interface QuickActionsProps {
  actions: QuickActionItem[];
  onActionPress: (action: QuickActionItem) => void;
}

const QuickActionButton: React.FC<{
  item: QuickActionItem;
  onPress: () => void;
}> = ({ item, onPress }) => {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const scaleAnim = useState(() => new Animated.Value(1))[0];

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: Platform.OS !== 'web',
      speed: 60,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      speed: 45,
      bounciness: 2,
    }).start();
  };

  const handlePress = () => {
    haptics.selection();
    onPress();
  };

  return (
    <Animated.View style={[styles.itemWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        accessibilityHint={`Initiates ${item.label.toLowerCase()} flow`}
        style={({ pressed }) => [
          styles.pressable,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View
          style={[
            styles.iconTile,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              ...theme.elevation.xs,
            },
          ]}
        >
          <Icon
            name={item.icon}
            size={19}
            color={item.isPrimary ? theme.colors.primary : theme.colors.textPrimary}
          />
        </View>

        <Text
          style={[
            styles.label,
            theme.typography.captionMedium,
            { color: theme.colors.textPrimary },
          ]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  onActionPress,
}) => {
  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <QuickActionButton
          key={action.id}
          item={action}
          onPress={() => onActionPress(action)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginVertical: 14,
  },
  itemWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  pressable: {
    alignItems: 'center',
    paddingVertical: 2,
    width: '100%',
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
  },
});
