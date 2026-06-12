import { ENDPOINTS } from '@gowander/shared-constants';
import type { Itinerary, SelectTransferRequest } from '@gowander/shared-types';
import { apiClient } from './api';

export interface GenerateLeg {
    swipe_session_id: string;
    destination_id: string;
    start_date: string;
    end_date: string;
}

export interface GenerateItineraryRequest {
    legs: GenerateLeg[];
    start_time: string;
}

export const itineraryService = {
    async generate(request: GenerateItineraryRequest): Promise<Itinerary> {
        const { data } = await apiClient.post<Itinerary>(
            ENDPOINTS.ITINERARY.GENERATE,
            request,
        );
        return data;
    },

    async getAll(): Promise<Itinerary[]> {
        const { data } = await apiClient.get<Itinerary[]>(ENDPOINTS.ITINERARY.LIST);
        return data;
    },

    async getById(id: string): Promise<Itinerary> {
        const { data } = await apiClient.get<Itinerary>(ENDPOINTS.ITINERARY.BY_ID(id));
        return data;
    },

    async save(id: string): Promise<Itinerary> {
        const { data } = await apiClient.post<Itinerary>(ENDPOINTS.ITINERARY.SAVE(id));
        return data;
    },

    async publish(id: string): Promise<Itinerary> {
        const { data } = await apiClient.post<Itinerary>(ENDPOINTS.ITINERARY.PUBLISH(id));
        return data;
    },

    async unpublish(id: string): Promise<Itinerary> {
        const { data } = await apiClient.post<Itinerary>(ENDPOINTS.ITINERARY.UNPUBLISH(id));
        return data;
    },

    async rate(id: string, stars: number): Promise<Itinerary> {
        const { data } = await apiClient.post<Itinerary>(ENDPOINTS.ITINERARY.RATE(id), { stars });
        return data;
    },

    async selectTransfer(id: string, payload: SelectTransferRequest): Promise<Itinerary> {
        const { data } = await apiClient.put<Itinerary>(
            ENDPOINTS.ITINERARY.TRANSFERS(id),
            payload,
        );
        return data;
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(ENDPOINTS.ITINERARY.BY_ID(id));
    },
};