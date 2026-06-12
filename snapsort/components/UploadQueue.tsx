import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CATEGORY_META } from '@/constants/categories';
import { useColors } from '@/hooks/useColors';
import { ScreenshotCard } from '@/types';

interface Props {
  cards: ScreenshotCard[];
  visible: boolean;
  onDismiss: () => void;
}

function SpinIcon({ color }: { color: string }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1100, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Ionicons name="sync" size={18} color={color} />
    </Animated.View>
  );
}

export function UploadQueue({ cards, visible, onDismiss }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(380)).current;

  const queueCards = cards.filter(c =>
    ['pending', 'analysing', 'done', 'error'].includes(c.status),
  );
  const doneCount = queueCards.filter(c => c.status === 'done' || c.status === 'error').length;
  const total = queueCards.length;
  const allDone = total > 0 && doneCount === total;
  const progress = total > 0 ? doneCount / total : 0;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 420,
      damping: 22,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible || queueCards.length === 0) return null;

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          paddingBottom: insets.bottom + 6,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Handle */}
      <View style={styles.handleRow}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
      </View>

      {/* Header */}
      <View style={styles.headerRow}>
        <Text
          style={[styles.headerTitle, { color: colors.foreground }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {allDone
            ? `Done — ${total} analysed`
            : `Analysing ${doneCount + 1} of ${total}…`}
        </Text>
        {allDone && (
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.accent }]}
            onPress={onDismiss}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress bar */}
      <View style={[styles.track, { backgroundColor: colors.input }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: colors.accent,
              width: `${Math.round(progress * 100)}%`,
            },
          ]}
        />
      </View>

      {/* Queue list */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {queueCards.map(card => {
          const meta = CATEGORY_META[card.type] ?? CATEGORY_META.other;
          return (
            <View
              key={card.id}
              style={[styles.item, { borderBottomColor: colors.border }]}
            >
              <View style={styles.iconWrap}>
                {card.status === 'done' ? (
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                ) : card.status === 'error' ? (
                  <Ionicons name="alert-circle" size={18} color={colors.destructive} />
                ) : card.status === 'analysing' ? (
                  <SpinIcon color={colors.accent} />
                ) : (
                  <Ionicons name="time-outline" size={18} color={colors.mutedForeground} />
                )}
              </View>
              <View style={styles.itemBody}>
                <Text
                  style={[styles.itemTitle, { color: colors.foreground }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {card.status === 'pending'
                    ? 'Waiting…'
                    : card.status === 'analysing'
                      ? 'Analysing with AI…'
                      : card.status === 'done'
                        ? card.title
                        : 'Failed'}
                </Text>
                {card.status === 'done' && (
                  <Text
                    style={[styles.itemSub, { color: meta.color }]}
                    numberOfLines={1}
                  >
                    {meta.label}
                  </Text>
                )}
                {card.status === 'error' && card.error && (
                  <Text
                    style={[styles.itemSub, { color: colors.destructive }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {card.error}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: 380,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    flexShrink: 1,
  },
  doneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    flexShrink: 0,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  track: {
    height: 3,
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  list: {
    maxHeight: 260,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 24,
    alignItems: 'center',
    flexShrink: 0,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
    flexShrink: 1,
  },
});
