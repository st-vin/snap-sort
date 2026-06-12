import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WithPendoModal } from 'rn-pendo-sdk';

import { CATEGORY_META } from '@/constants/categories';
import { useColors } from '@/hooks/useColors';
import { ScreenshotCard } from '@/types';

const PendoModal = WithPendoModal(Modal);

interface Props {
  card: ScreenshotCard | null;
  visible: boolean;
  onClose: () => void;
}

async function copyToClipboard(text: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      await (navigator as any).clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Clipboard = require('expo-clipboard');
    await Clipboard.setStringAsync(text);
  } catch {
    // no-op
  }
}

export function DetailSheet({ card, visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [copied, setCopied] = useState(false);

  // Use a large off-screen value so the initial position is always hidden
  const translateY = useRef(new Animated.Value(windowHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const sheetHeight = windowHeight * 0.91;

  useEffect(() => {
    if (visible) {
      translateY.setValue(windowHeight);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: windowHeight,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, windowHeight]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, { dy }) => dy > 8,
    onPanResponderMove: (_, { dy }) => {
      if (dy > 0) translateY.setValue(dy);
    },
    onPanResponderRelease: (_, { dy, vy }) => {
      if (dy > 120 || vy > 0.6) {
        onClose();
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const handleCopy = async () => {
    if (!card?.extracted_text) return;
    await copyToClipboard(card.extracted_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!card) return null;

  const meta = CATEGORY_META[card.type] ?? CATEGORY_META.other;
  const date = new Date(card.createdAt);
  const dateStr =
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' · ' +
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <PendoModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            height: sheetHeight,
            paddingBottom: insets.bottom + 12,
            transform: [{ translateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces
          contentContainerStyle={styles.scrollContent}
        >
          {/* Full image */}
          <View style={[styles.imageWrap, { backgroundColor: '#000', maxHeight: windowHeight * 0.35 }]}>
            <Image
              source={{ uri: card.uri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.body}>
            {/* Meta row */}
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: meta.color + '20',
                    borderColor: meta.color + '40',
                  },
                ]}
              >
                <Ionicons name={meta.icon as any} size={12} color={meta.color} />
                <Text
                  style={[styles.badgeText, { color: meta.color }]}
                  numberOfLines={1}
                >
                  {meta.label}
                </Text>
              </View>
              <Text
                style={[styles.dateText, { color: colors.mutedForeground }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {dateStr}
              </Text>
              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: colors.input }]}
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={17} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text
              style={[styles.titleText, { color: colors.foreground }]}
              numberOfLines={4}
              ellipsizeMode="tail"
            >
              {card.title}
            </Text>

            {/* Tags */}
            {card.tags.length > 0 && (
              <View style={styles.tagsWrap}>
                {card.tags.map(tag => (
                  <View key={tag} style={[styles.tagPill, { backgroundColor: colors.input }]}>
                    <Text
                      style={[styles.tagLabel, { color: colors.onSurfaceVariant }]}
                      numberOfLines={1}
                    >
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* AI Summary */}
            {!!card.summary && (
              <View style={styles.section}>
                <View style={styles.sectionHead}>
                  <Ionicons name="sparkles" size={14} color={colors.accent} />
                  <Text style={[styles.sectionLabel, { color: colors.accent }]}>
                    AI SUMMARY
                  </Text>
                </View>
                <Text style={[styles.summaryText, { color: colors.onSurfaceVariant }]}>
                  {card.summary}
                </Text>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Extracted text */}
            {!!card.extracted_text && (
              <View style={styles.section}>
                <View style={styles.sectionHeadRow}>
                  <View style={[styles.sectionHead, { flex: 1 }]}>
                    <Ionicons name="text" size={14} color={colors.mutedForeground} />
                    <Text
                      style={[styles.sectionLabel, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      EXTRACTED TEXT
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.copyBtn, { backgroundColor: colors.accent + '20' }]}
                    onPress={handleCopy}
                  >
                    <Ionicons
                      name={copied ? 'checkmark' : 'copy-outline'}
                      size={13}
                      color={colors.accent}
                    />
                    <Text style={[styles.copyLabel, { color: colors.accent }]}>
                      {copied ? 'Copied!' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.codeBox,
                    { backgroundColor: colors.input, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.codeText, { color: colors.onSurfaceVariant }]}>
                    {card.extracted_text}
                  </Text>
                </View>
              </View>
            )}

            {/* Error */}
            {!!card.error && (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: colors.destructive + '15',
                    borderColor: colors.destructive + '30',
                  },
                ]}
              >
                <Ionicons name="alert-circle-outline" size={16} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>
                  {card.error}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </PendoModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageWrap: {
    width: '100%',
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  body: {
    padding: 16,
    gap: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'nowrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  dateText: {
    fontSize: 12,
    flex: 1,
    flexShrink: 1,
  },
  closeBtn: {
    padding: 7,
    borderRadius: 20,
    flexShrink: 0,
  },
  titleText: {
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 25,
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    maxWidth: '45%',
  },
  tagLabel: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  section: {
    gap: 9,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    flexShrink: 1,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 22,
    flexShrink: 1,
  },
  divider: {
    height: 1,
    marginVertical: 2,
  },
  codeBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  codeText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flexShrink: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 0,
  },
  copyLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
    flexShrink: 1,
  },
});
