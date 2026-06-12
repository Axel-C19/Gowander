import { ENDPOINTS } from '@gowander/shared-constants';
import type { TransferSearch } from '@gowander/shared-types';
import { apiClient } from './api';

export const flightsService = {
    /** Flights + ground options between two trip cities on a date. */
    async search(
        fromDestinationId: string,
        toDestinationId: string,
        travelDate: string,
    ): Promise<TransferSearch> {
        const { data } = await apiClient.get<TransferSearch>(ENDPOINTS.FLIGHTS.SEARCH, {
            params: {
                from_destination_id: fromDestinationId,
                to_destination_id: toDestinationId,
                travel_date: travelDate,
            },
        });
        return data;
    },
};
