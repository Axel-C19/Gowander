import { ENDPOINTS } from '@gowander/shared-constants';
import type {
  Destination,
  PlaceCard,
  PaginatedResponse,
} from '@gowander/shared-types';
import { apiClient } from './api';

export const placesService = {
  async searchDestinations(query: string): Promise<Destination[]> {
    const { data } = await apiClient.get<Destination[]>(
      ENDPOINTS.DESTINATIONS.SEARCH,
      { params: { q: query } },
    );
    return data;
  },

  async getDestinations(): Promise<Destination[]> {
    const { data } = await apiClient.get<Destination[]>(ENDPOINTS.DESTINATIONS.LIST);
    return data;
  },

  async getPlacesByDestination(
    destinationId: string,
    page = 1,
    perPage = 20,
  ): Promise<PaginatedResponse<PlaceCard>> {
    const { data } = await apiClient.get<PaginatedResponse<PlaceCard>>(
      ENDPOINTS.PLACES.BY_DESTINATION(destinationId),
      { params: { page, per_page: perPage } },
    );
    return data;
  },
};
