// ─── API ──────────────────────────────────────────────────────────────────
export const API_VERSION = 'v1';
export const API_BASE = `/api/${API_VERSION}`;

export const ENDPOINTS = {
    AUTH: {
        LOGIN: `${API_BASE}/auth/login`,
        REGISTER: `${API_BASE}/auth/register`,   // ← add this line
        ME: `${API_BASE}/auth/me`,
        PREFERENCES: `${API_BASE}/auth/me/preferences`,
        PROFILE: `${API_BASE}/auth/me/profile`,
        AVATAR: `${API_BASE}/auth/me/avatar`,
        GOOGLE: `${API_BASE}/auth/google`,
        GOOGLE_START: `${API_BASE}/auth/google/start`,
        REFRESH: `${API_BASE}/auth/refresh`,
    },
  DESTINATIONS: {
    LIST: `${API_BASE}/destinations`,
    SEARCH: `${API_BASE}/destinations/search`,
  },
  PLACES: {
    BY_DESTINATION: (destinationId: string) =>
      `${API_BASE}/destinations/${destinationId}/places`,
  },
  SWIPE: {
    SESSION: `${API_BASE}/swipe/session`,
    ACTION: (sessionId: string) => `${API_BASE}/swipe/session/${sessionId}/action`,
    COMPLETE: (sessionId: string) => `${API_BASE}/swipe/session/${sessionId}/complete`,
  },
  ITINERARY: {
    GENERATE: `${API_BASE}/itinerary/generate`,
    LIST: `${API_BASE}/itinerary`,
    BY_ID: (id: string) => `${API_BASE}/itinerary/${id}`,
    SAVE: (id: string) => `${API_BASE}/itinerary/${id}/save`,
    PUBLISH: (id: string) => `${API_BASE}/itinerary/${id}/publish`,
    UNPUBLISH: (id: string) => `${API_BASE}/itinerary/${id}/unpublish`,
    RATE: (id: string) => `${API_BASE}/itinerary/${id}/rate`,
  },
  SOCIAL: {
    USER_SEARCH: `${API_BASE}/social/users/search`,
    FRIEND_REQUEST: `${API_BASE}/social/friends/request`,
    FRIEND_REQUESTS: `${API_BASE}/social/friends/requests`,
    ACCEPT_REQUEST: (id: string) => `${API_BASE}/social/friends/requests/${id}/accept`,
    DECLINE_REQUEST: (id: string) => `${API_BASE}/social/friends/requests/${id}`,
    FRIENDS: `${API_BASE}/social/friends`,
    MESSAGES: `${API_BASE}/social/messages`,
    CONVERSATION: (userId: string) => `${API_BASE}/social/messages/${userId}`,
  },
  EXPLORE: `${API_BASE}/explore`,
} as const;

// ─── Navigation ───────────────────────────────────────────────────────────
export const SCREENS = {
  // Auth stack
  LOGIN: 'Login',
  REGISTER: 'Register',
  // Main stack
  DESTINATION_PICKER: 'DestinationPicker',
  SWIPE_DECK: 'SwipeDeck',
  ITINERARY_SUMMARY: 'ItinerarySummary',
  MAP_VIEW: 'MapView',
  SAVED_ITINERARIES: 'SavedItineraries',
} as const;

// ─── App config ───────────────────────────────────────────────────────────
export const SWIPE = {
  ROTATION_ANGLE: 15,
  SWIPE_THRESHOLD: 120,
  CARD_STACK_SIZE: 5,
} as const;

export const ITINERARY = {
  DEFAULT_START_HOUR: 9,
  DEFAULT_END_HOUR: 20,
  TRAVEL_BUFFER_MINUTES: 15,
} as const;

export const QUERY_KEYS = {
  DESTINATIONS: ['destinations'] as const,
  PLACES: (destinationId: string) => ['places', destinationId] as const,
  ITINERARIES: ['itineraries'] as const,
  ITINERARY: (id: string) => ['itinerary', id] as const,
  ME: ['me'] as const,
} as const;

// ─── Travel interests (preferences) ────────────────────────────────────────
export interface Interest {
    id: string;
    label: string;
    emoji: string;
    /** Place categories this interest maps to, for recommendation ordering. */
    categories: string[];
}

export const INTERESTS: Interest[] = [
    { id: 'culture', label: 'Culture', emoji: '🎭', categories: ['museum', 'landmark'] },
    { id: 'gastronomy', label: 'Gastronomy', emoji: '🍽️', categories: ['restaurant'] },
    { id: 'history', label: 'History', emoji: '🏛️', categories: ['museum', 'religious', 'landmark'] },
    { id: 'nature', label: 'Nature', emoji: '🌲', categories: ['park', 'beach', 'viewpoint'] },
    { id: 'nightlife', label: 'Nightlife', emoji: '🌃', categories: ['entertainment'] },
    { id: 'art', label: 'Art', emoji: '🎨', categories: ['museum'] },
    { id: 'extreme', label: 'Adventure', emoji: '🧗', categories: ['entertainment', 'viewpoint'] },
    { id: 'shopping', label: 'Shopping', emoji: '🛍️', categories: ['shopping'] },
    { id: 'architecture', label: 'Architecture', emoji: '🏰', categories: ['landmark', 'religious'] },
];
