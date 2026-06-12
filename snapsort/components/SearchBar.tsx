import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { useColors } from '@/hooks/useColors';

interface Props {
  value: string;
  onChange: (text: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  const colors = useColors();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
      <Ionicons name="search" size={16} color={colors.mutedForeground} />
      <TextInput
        style={[styles.input, { color: colors.foreground }]}
        value={value}
        onChangeText={onChange}
        placeholder="Search screenshots…"
        placeholderTextColor={colors.mutedForeground}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChange('')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
    margin: 0,
  },
});
