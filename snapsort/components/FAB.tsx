import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';

interface Props {
  onPress: () => void;
  disabled?: boolean;
}

export function FAB({ onPress, disabled }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(1)).current;

  const bottom =
    Platform.OS === 'web' ? 34 + 20 : insets.bottom + 20;

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.9, duration: 70, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 10, stiffness: 280, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={[styles.wrapper, { bottom, transform: [{ scale }] }]}>
      <Pressable
        style={[
          styles.btn,
          { backgroundColor: disabled ? colors.mutedForeground : colors.accent },
        ]}
        onPress={handlePress}
        disabled={disabled}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: 16,
  },
  btn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C6FFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
});
