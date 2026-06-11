import { ENDPOINTS } from '@gowander/shared-constants';
import type { Itinerary } from '@gowander/shared-types';
import { apiClient } from './api';

export interface GenerateItineraryRequest {
    swipe_session_id: string;
    destination_id: string;
    start_date?: string;
    end_date?: string;
    start_time: string;
}

export const itineraryService = {
    async generate(request: GenerateItineraryRequest): Promise<Itinerary> {
        const payload: Record<string, string> = {
            swipe_session_id: request.swipe_session_id,
            destination_id: request.destination_id,
            start_time: request.start_time,
        };
        if (request.start_date) {
            payload.start_date = request.start_date;
        }
        if (request.end_date) {
            payload.end_date = request.end_date;
        }
        const { data } = await apiClient.post<Itinerary>(
            ENDPOINTS.ITINERARY.GENERATE,
            payload,
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

    async delete(id: string): Promise<void> {
        await apiClient.delete(ENDPOINTS.ITINERARY.BY_ID(id));
    },
};