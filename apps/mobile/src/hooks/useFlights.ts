import { useQuery } from '@tanstack/react-query';
import { flightsService } from '../services/flights.service';

export function useTransferSearch(
    fromDestinationId: string,
    toDestinationId: string,
    travelDate: string,
) {
    return useQuery({
        queryKey: ['flights', fromDestinationId, toDestinationId, travelDate],
        queryFn: () => flightsService.search(fromDestinationId, toDestinationId, travelDate),
        enabled: !!fromDestinationId && !!toDestinationId && !!travelDate,
        staleTime: 5 * 60 * 1000,
    });
}
