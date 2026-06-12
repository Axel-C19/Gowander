import { create } from 'zustand';
import type { Destination } from '@gowander/shared-types';

export interface TripLeg {
  destination: Destination;
  startDate: string; // ISO "YYYY-MM-DD"
  endDate: string;
}

interface TripState {
  /** Legs collected so far while building a multi-destination trip. */
  legs: TripLeg[];

  addLeg: (leg: TripLeg) => void;
  resetTrip: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  legs: [],

  addLeg: (leg) => set((state) => ({ legs: [...state.legs, leg] })),
  resetTrip: () => set({ legs: [] }),
}));
