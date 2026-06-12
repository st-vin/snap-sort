import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { CATEGORY_META } from '@/constants/categories';
import { useColors } from '@/hooks/useColors';
import { ScreenshotCard } from '@/types';

const GAP = 10;
const H_PAD = 12;

interface Props {
  card: ScreenshotCard;
  onPress: () => void;
  onLongPress: () => void;
  onRetry?: () => void;
}

export function ScreenshotGridCard({ card, onPress, onLongPress, onRetry }: Props) {
  const colors = useColors();
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = (windowWidth - H_PAD * 2 - GAP) / 2;
  const cardHeight = cardWidth * 1.42;

  const shimmer = useRef(new Animated.Value(0.3)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (card.status === 'pending') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(shimmer, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    if (card.status === 'analysing') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    shimmer.setValue(0.3);
    pulse.setValue(1);
  }, [card.status]);

  const meta = CATEGORY_META[card.type] ?? CATEGORY_META.other;
  const isPending = card.status === 'pending';
  const isAnalysing = card.status === 'analysing';
  const isError = card.status === 'error';
  const isDone = card.status === 'done';

  const dynamicCard = {
    width: cardWidth,
    height: cardHeight,
    backgroundColor: colors.card,
    borderColor: isError
      ? colors.destructive
      : isAnalysing
        ? colors.accent
        : colors.border,
    borderWidth: isError || isAnalysing ? 1.5 : 1,
  };

  if (isPending) {
    return (
      <Animated.View style={[styles.card, dynamicCard, { opacity: shimmer }]}>
        <View style={[styles.fill, { backgroundColor: colors.surfaceContainerHigh }]} />
      </Animated.View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        dynamicCard,
        pressed && styles.pressed,
      ]}
      onPress={isDone ? onPress : isError ? onPress : undefined}
      onLongPress={isDone || isError ? onLongPress : undefined}
      delayLongPress={450}
    >
      {/* Thumbnail */}
      {card.uri ? (
        <Image source={{ uri: card.uri }} style={styles.fill} resizeMode="cover" />
      ) : (
        <View style={[styles.fill, { backgroundColor: colors.input }]} />
      )}

      {/* Analysing overlay */}
      {isAnalysing && (
        <Animated.View
          style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.55)', opacity: pulse }]}
        >
          <View style={[styles.aiBadge, { backgroundColor: colors.accent }]}>
            <Ionicons name="sparkles" size={11} color="#fff" />
            <Text style={styles.aiText} numberOfLines={1}>Analysing</Text>
          </View>
        </Animated.View>
      )}

      {/* Error overlay with retry */}
      {isError && (
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
          <Ionicons name="alert-circle" size={24} color={colors.destructive} />
          <Text style={[styles.errorLabel, { color: colors.destructive }]} numberOfLines={1}>
            Failed
          </Text>
          {onRetry && (
            <Pressable
              style={[styles.retryBtn, { backgroundColor: colors.accent }]}
              onPress={e => {
                e.stopPropagation?.();
                onRetry();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="refresh" size={11} color="#fff" />
              <Text style={styles.retryText} numberOfLines={1}>Retry</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Done gradient + info */}
      {isDone && (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.82)']}
          style={styles.gradient}
          pointerEvents="none"
        >
          <View style={[styles.typeBadge, { backgroundColor: meta.color + '30' }]}>
            <Ionicons name={meta.icon as any} size={10} color={meta.color} />
            <Text style={[styles.typeText, { color: meta.color }]} numberOfLines={1}>
              {meta.label}
            </Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">
            {card.title}
          </Text>
          {card.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {card.tags.slice(0, 2).map(tag => (
                <Text key={tag} style={styles.tagText} numberOfLines={1} ellipsizeMode="tail">
                  #{tag}
                </Text>
              ))}
            </View>
          )}
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: GAP,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  fill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 8,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    maxWidth: '90%',
  },
  aiText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  errorLabel: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 2,
  },
  retryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    flexShrink: 1,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingTop: 28,
    paddingBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 5,
    maxWidth: '85%',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 16,
    marginBottom: 4,
    flexShrink: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    overflow: 'hidden',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    flexShrink: 1,
    maxWidth: '48%',
  },
});
