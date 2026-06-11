// ─── Auth ─────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  preferences: string[] | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

// ─── Places ───────────────────────────────────────────────────────────────
export interface Destination {
  id: string;
  name: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  image_url?: string;
}

export interface PlaceCard {
  id: string;
  name: string;
  description: string;
  category: PlaceCategory;
  rating: number;
  image_url: string;
  address: string;
  latitude: number;
  longitude: number;
  opening_hours: OpeningHours;
  estimated_duration_minutes: number;
  destination_id: string;
}

export type PlaceCategory =
  | 'museum'
  | 'restaurant'
  | 'landmark'
  | 'park'
  | 'shopping'
  | 'entertainment'
  | 'religious'
  | 'viewpoint'
  | 'beach'
  | 'other';

export interface OpeningHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
  always_open?: boolean;
}

export interface DayHours {
  open: string;   // "09:00"
  close: string;  // "18:00"
  closed?: boolean;
}

// ─── Swipe session ────────────────────────────────────────────────────────
export type SwipeDecision = 'accepted' | 'rejected';

export interface SwipeAction {
  place_id: string;
  decision: SwipeDecision;
}

export interface SwipeSession {
  id: string;
  destination_id: string;
  accepted_place_ids: string[];
  rejected_place_ids: string[];
  completed: boolean;
  created_at: string;
}

// ─── Itinerary ────────────────────────────────────────────────────────────
export interface Itinerary {
  id: string;
  user_id: string;        // Owner
  title: string;
  destination: Destination;
  date: string;           // Trip start date, ISO "2025-06-01"
  end_date: string | null; // Trip end date
  start_time: string;     // "09:00"
  total_duration_minutes: number;
  is_saved: boolean;
  is_public: boolean;
  stops: ItineraryStop[];
  created_at: string;
  updated_at: string;
  // Rating summary — populated for public trips
  avg_rating: number | null;
  ratings_count: number;
  my_rating: number | null;
}

export interface ItineraryStop {
  order: number;
  day: number;            // 1-based trip day
  place: PlaceCard;
  arrival_time: string;    // "10:30"
  departure_time: string;  // "12:00"
  travel_time_to_next_minutes: number;
  travel_mode: TravelMode;
}

export type TravelMode = 'walking' | 'driving' | 'transit';

// ─── API response wrappers ────────────────────────────────────────────────
export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
}

// ─── Social ───────────────────────────────────────────────────────────────
export interface UserPublic {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  bio?: string | null;
}

export interface FriendRequest {
  id: string;
  requester: UserPublic;
  created_at: string;
}

export interface Friend {
  friendship_id: string;
  user: UserPublic;
}

export interface SharedTripPreview {
  id: string;
  title: string;
  total_duration_minutes: number;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  text: string | null;
  itinerary: SharedTripPreview | null;
  created_at: string;
}

export interface PublicTrip {
  itinerary: Itinerary;
  owner: UserPublic;
}
