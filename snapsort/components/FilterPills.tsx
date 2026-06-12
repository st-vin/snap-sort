import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { CATEGORY_META } from '@/constants/categories';
import { useColors } from '@/hooks/useColors';
import { ScreenshotCard, ScreenshotType } from '@/types';

interface Props {
  activeFilter: ScreenshotType | 'all';
  cards: ScreenshotCard[];
  onSelect: (type: ScreenshotType | 'all') => void;
}

export function FilterPills({ activeFilter, cards, onSelect }: Props) {
  const colors = useColors();

  const presentTypes = new Set(
    cards.filter(c => c.status === 'done').map(c => c.type),
  );

  const types: (ScreenshotType | 'all')[] = [
    'all',
    ...(Array.from(presentTypes) as ScreenshotType[]),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.scroll}
    >
      {types.map(type => {
        const meta = CATEGORY_META[type];
        const isActive = activeFilter === type;
        return (
          <TouchableOpacity
            key={type}
            style={[
              styles.pill,
              {
                backgroundColor: isActive ? meta.color : colors.input,
                borderColor: isActive ? meta.color : colors.border,
              },
            ]}
            onPress={() => onSelect(type)}
          >
            <Ionicons
              name={meta.icon as any}
              size={13}
              color={isActive ? '#fff' : colors.mutedForeground}
            />
            <Text
              style={[styles.label, { color: isActive ? '#fff' : colors.mutedForeground }]}
              numberOfLines={1}
            >
              {meta.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  content: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
});
