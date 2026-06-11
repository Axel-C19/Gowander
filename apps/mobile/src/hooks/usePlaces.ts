import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@gowander/shared-constants';
import { placesService } from '../services/places.service';

export function useDestinations() {
  return useQuery({
    queryKey: QUERY_KEYS.DESTINATIONS,
    queryFn: placesService.getDestinations,
    staleTime: 30 * 60 * 1000,
  });
}

export function usePlacesByDestination(destinationId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PLACES(destinationId),
    queryFn: () => placesService.getPlacesByDestination(destinationId),
    enabled: !!destinationId,
    staleTime: 10 * 60 * 1000,
  });
}
