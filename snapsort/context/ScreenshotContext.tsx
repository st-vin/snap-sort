import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react';

import { analyzeImage } from '@/services/geminiService';
import { PickedImage } from '@/services/imageService';
import { deleteCard as storageDelete, loadCards, saveCard } from '@/services/storageService';
import { GeminiAnalysis, ProcessingStatus, ScreenshotCard, ScreenshotType } from '@/types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
}

const DELAY_MS = 4000;
const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

type Action =
  | { type: 'ADD_CARDS'; cards: ScreenshotCard[] }
  | { type: 'UPDATE_CARD'; id: string; patch: Partial<ScreenshotCard> }
  | { type: 'DELETE_CARD'; id: string }
  | { type: 'LOAD_STORED'; cards: ScreenshotCard[] }
  | { type: 'SET_QUERY'; query: string }
  | { type: 'SET_FILTER'; category: ScreenshotType | 'all' };

interface State {
  cards: ScreenshotCard[];
  query: string;
  activeFilter: ScreenshotType | 'all';
  isProcessing: boolean;
}

const initialState: State = {
  cards: [],
  query: '',
  activeFilter: 'all',
  isProcessing: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_CARDS':
      return { ...state, cards: [...action.cards, ...state.cards], isProcessing: true };
    case 'UPDATE_CARD': {
      const cards = state.cards.map(c =>
        c.id === action.id ? { ...c, ...action.patch } : c,
      );
      const isProcessing = cards.some(
        c => c.status === 'pending' || c.status === 'analysing',
      );
      return { ...state, cards, isProcessing };
    }
    case 'DELETE_CARD':
      return { ...state, cards: state.cards.filter(c => c.id !== action.id) };
    case 'LOAD_STORED':
      return { ...state, cards: action.cards };
    case 'SET_QUERY':
      return { ...state, query: action.query };
    case 'SET_FILTER':
      return { ...state, activeFilter: action.category };
    default:
      return state;
  }
}

export function selectFiltered(state: State): ScreenshotCard[] {
  const q = state.query.toLowerCase().trim();
  return state.cards
    .filter(c => c.status === 'done' || c.status === 'error')
    .filter(c => state.activeFilter === 'all' || c.type === state.activeFilter)
    .filter(c => {
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q)) ||
        c.extracted_text.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q)
      );
    });
}

interface ContextValue {
  state: State;
  filteredCards: ScreenshotCard[];
  dispatch: React.Dispatch<Action>;
  processImages: (images: PickedImage[]) => Promise<void>;
  retryCard: (id: string) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
}

const ScreenshotContext = createContext<ContextValue | null>(null);

export function ScreenshotProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // In-memory cache of base64 data for retry — not persisted to avoid storage bloat
  const base64Cache = useRef(new Map<string, { base64: string; mimeType: string }>());

  useEffect(() => {
    loadCards().then(stored => {
      if (stored.length > 0) {
        dispatch({ type: 'LOAD_STORED', cards: stored });
      }
    });
  }, []);

  const processImages = useCallback(async (images: PickedImage[]) => {
    const pendingCards: ScreenshotCard[] = images.map(img => ({
      id: generateId(),
      uri: img.uri,
      type: 'other' as ScreenshotType,
      title: 'Processing…',
      tags: [],
      extracted_text: '',
      summary: '',
      status: 'pending' as ProcessingStatus,
      createdAt: new Date().toISOString(),
    }));

    // Cache base64 data for potential retries
    images.forEach((img, i) => {
      base64Cache.current.set(pendingCards[i].id, {
        base64: img.base64,
        mimeType: img.mimeType,
      });
    });

    dispatch({ type: 'ADD_CARDS', cards: pendingCards });

    for (let i = 0; i < images.length; i++) {
      const card = pendingCards[i];
      dispatch({ type: 'UPDATE_CARD', id: card.id, patch: { status: 'analysing' } });

      try {
        const analysis: GeminiAnalysis = await analyzeImage(
          images[i].base64,
          images[i].mimeType,
        );
        const patch: Partial<ScreenshotCard> = { ...analysis, status: 'done' };
        dispatch({ type: 'UPDATE_CARD', id: card.id, patch });
        await saveCard({ ...card, ...patch } as ScreenshotCard);
      } catch (err) {
        dispatch({
          type: 'UPDATE_CARD',
          id: card.id,
          patch: {
            status: 'error',
            error: String((err as Error)?.message ?? err),
            title: 'Analysis failed',
          },
        });
      }

      if (i < images.length - 1) await delay(DELAY_MS);
    }
  }, []);

  const retryCard = useCallback(async (id: string) => {
    const cached = base64Cache.current.get(id);
    if (!cached) return; // original image data not in cache (session was restarted)

    // Reset to analysing
    dispatch({
      type: 'UPDATE_CARD',
      id,
      patch: { status: 'analysing', error: undefined, title: 'Retrying…' },
    });

    // Keep a snapshot of the card data we need after dispatch
    try {
      const analysis: GeminiAnalysis = await analyzeImage(cached.base64, cached.mimeType);
      const patch: Partial<ScreenshotCard> = { ...analysis, status: 'done' };
      dispatch({ type: 'UPDATE_CARD', id, patch });
      // We don't have the full card here so we load it from storage to save
      const cards = await loadCards();
      const existing = cards.find(c => c.id === id);
      if (existing) await saveCard({ ...existing, ...patch } as ScreenshotCard);
    } catch (err) {
      dispatch({
        type: 'UPDATE_CARD',
        id,
        patch: {
          status: 'error',
          error: String((err as Error)?.message ?? err),
          title: 'Analysis failed',
        },
      });
    }
  }, []);

  const deleteCard = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_CARD', id });
    base64Cache.current.delete(id);
    await storageDelete(id);
  }, []);

  const filteredCards = selectFiltered(state);

  return (
    <ScreenshotContext.Provider
      value={{ state, filteredCards, dispatch, processImages, retryCard, deleteCard }}
    >
      {children}
    </ScreenshotContext.Provider>
  );
}

export function useScreenshots(): ContextValue {
  const ctx = useContext(ScreenshotContext);
  if (!ctx) throw new Error('useScreenshots must be used within ScreenshotProvider');
  return ctx;
}
