import React, { useState } from "react";
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";

interface BouncyPressableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  className?: string;
}

export function BouncyPressable({
  children,
  style,
  scaleTo = 0.96,
  onPressIn,
  onPressOut,
  ...props
}: BouncyPressableProps) {
  const [scale] = useState(() => new Animated.Value(1));

  const handlePressIn = (e: any) => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 120,
    }).start();
    onPressOut?.(e);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
