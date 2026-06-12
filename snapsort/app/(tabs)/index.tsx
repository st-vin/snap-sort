import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DetailSheet } from '@/components/DetailSheet';
import { FAB } from '@/components/FAB';
import { FilterPills } from '@/components/FilterPills';
import { ScreenshotGridCard } from '@/components/ScreenshotGridCard';
import { SearchBar } from '@/components/SearchBar';
import { UploadQueue } from '@/components/UploadQueue';
import { useScreenshots } from '@/context/ScreenshotContext';
import { useColors } from '@/hooks/useColors';
import { pickScreenshots } from '@/services/imageService';
import { ScreenshotCard, ScreenshotType } from '@/types';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, filteredCards, dispatch, processImages, retryCard, deleteCard } =
    useScreenshots();

  const [selectedCard, setSelectedCard] = useState<ScreenshotCard | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [queueVisible, setQueueVisible] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const handlePickImages = useCallback(async () => {
    try {
      const images = await pickScreenshots();
      if (images.length === 0) return;
      setQueueVisible(true);
      await processImages(images);
    } catch (err) {
      console.warn('Image pick error:', err);
    }
  }, [processImages]);

  const handleCardPress = useCallback((card: ScreenshotCard) => {
    setSelectedCard(card);
    setDetailVisible(true);
  }, []);

  const handleLongPress = useCallback(
    (card: ScreenshotCard) => {
      Alert.alert(
        'Delete Screenshot',
        `Remove "${card.title || 'this screenshot'}" from your library?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteCard(card.id);
              if (selectedCard?.id === card.id) setDetailVisible(false);
            },
          },
        ],
        { cancelable: true },
      );
    },
    [deleteCard, selectedCard],
  );

  const handleRetry = useCallback(
    (card: ScreenshotCard) => {
      retryCard(card.id);
    },
    [retryCard],
  );

  const handleFilterChange = useCallback(
    (type: ScreenshotType | 'all') => {
      dispatch({ type: 'SET_FILTER', category: type });
    },
    [dispatch],
  );

  const handleSearch = useCallback(
    (query: string) => {
      dispatch({ type: 'SET_QUERY', query });
    },
    [dispatch],
  );

  const processingCards = state.cards.filter(
    c => c.status === 'pending' || c.status === 'analysing',
  );
  const displayCards: ScreenshotCard[] = [...processingCards, ...filteredCards];

  const doneCount = state.cards.filter(c => c.status === 'done').length;
  const hasFilter = state.query.length > 0 || state.activeFilter !== 'all';
  const filteredDoneCount = filteredCards.filter(c => c.status === 'done').length;

  const ListHeader = (
    <View>
      {/* App bar */}
      <View style={[styles.appBar, { paddingTop: topPad + 14 }]}>
        <View style={styles.appBarLeft}>
          <Text
            style={[styles.appTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            SnapSort
          </Text>
          {doneCount > 0 && (
            <View style={[styles.countChip, { backgroundColor: colors.accent + '22' }]}>
              <Text style={[styles.countChipText, { color: colors.accent }]}>
                {doneCount}
              </Text>
            </View>
          )}
        </View>
        <View
          style={[
            styles.aiBadge,
            {
              backgroundColor: colors.primary + '20',
              borderColor: colors.primary + '35',
            },
          ]}
        >
          <Ionicons name="sparkles" size={11} color={colors.primary} />
          <Text
            style={[styles.aiBadgeText, { color: colors.primary }]}
            numberOfLines={1}
          >
            Gemini
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <SearchBar value={state.query} onChange={handleSearch} />
      </View>

      {/* Filter pills */}
      <FilterPills
        activeFilter={state.activeFilter}
        cards={state.cards}
        onSelect={handleFilterChange}
      />

      {/* Results count */}
      {hasFilter && (
        <Text style={[styles.resultsLabel, { color: colors.mutedForeground }]}>
          {filteredDoneCount} result{filteredDoneCount !== 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );

  const isEmpty = displayCards.length === 0 && state.cards.length === 0;
  const isFilterEmpty = displayCards.length === 0 && hasFilter;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {isEmpty ? (
        <>
          {ListHeader}
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.input }]}>
              <Ionicons name="images-outline" size={36} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No screenshots yet
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Tap + to import from your camera roll.{'\n'}Gemini AI will classify and extract text.
            </Text>
          </View>
        </>
      ) : isFilterEmpty ? (
        <>
          {ListHeader}
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.input }]}>
              <Ionicons name="search-outline" size={36} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Try a different word or clear the filter
            </Text>
          </View>
        </>
      ) : (
        <FlatList
          data={displayCards}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.grid, { paddingBottom: bottomPad + 100 }]}
          ListHeaderComponent={ListHeader}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ScreenshotGridCard
              card={item}
              onPress={() => handleCardPress(item)}
              onLongPress={() => handleLongPress(item)}
              onRetry={item.status === 'error' ? () => handleRetry(item) : undefined}
            />
          )}
        />
      )}

      <FAB onPress={handlePickImages} disabled={state.isProcessing} />

      <UploadQueue
        cards={state.cards}
        visible={
          queueVisible &&
          (state.isProcessing ||
            state.cards.some(c => c.status === 'done' || c.status === 'error'))
        }
        onDismiss={() => setQueueVisible(false)}
      />

      <DetailSheet
        card={selectedCard}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
    flexShrink: 1,
  },
  countChip: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    flexShrink: 0,
  },
  countChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  searchRow: {
    marginBottom: 4,
  },
  resultsLabel: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 6,
    fontWeight: '500',
  },
  grid: {
    paddingHorizontal: 12,
  },
  row: {
    gap: 10,
    justifyContent: 'space-between',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
    flexShrink: 1,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    flexShrink: 1,
  },
});
