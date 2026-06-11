import { create } from 'zustand';
import type { PlaceCard, SwipeDecision } from '@gowander/shared-types';

interface SwipeRecord {
  place: PlaceCard;
  decision: SwipeDecision;
}

interface SwipeState {
  sessionId: string | null;
  cards: PlaceCard[];
  currentIndex: number;
  swipeHistory: SwipeRecord[];
  isSessionComplete: boolean;

  setSession: (sessionId: string, cards: PlaceCard[]) => void;
  recordSwipe: (place: PlaceCard, decision: SwipeDecision) => void;
  completeSession: () => void;
  resetSession: () => void;

  // Derived helpers
  currentCard: () => PlaceCard | null;
  acceptedPlaceIds: () => string[];
}

export const useSwipeStore = create<SwipeState>((set, get) => ({
  sessionId: null,
  cards: [],
  currentIndex: 0,
  swipeHistory: [],
  isSessionComplete: false,

  setSession: (sessionId, cards) =>
    set({ sessionId, cards, currentIndex: 0, swipeHistory: [], isSessionComplete: false }),

  recordSwipe: (place, decision) =>
    set((state) => ({
      currentIndex: state.currentIndex + 1,
      swipeHistory: [...state.swipeHistory, { place, decision }],
    })),

  completeSession: () => set({ isSessionComplete: true }),

  resetSession: () =>
    set({
      sessionId: null,
      cards: [],
      currentIndex: 0,
      swipeHistory: [],
      isSessionComplete: false,
    }),

  currentCard: () => {
    const { cards, currentIndex } = get();
    return cards[currentIndex] ?? null;
  },

  acceptedPlaceIds: () =>
    get()
      .swipeHistory.filter((r) => r.decision === 'accepted')
      .map((r) => r.place.id),
}));
