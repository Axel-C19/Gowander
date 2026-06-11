import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@gowander/shared-constants';
import { itineraryService } from '../services/itinerary.service';
import type { Itinerary } from '@gowander/shared-types';

export interface GenerateRequest {
    swipe_session_id: string;
    destination_id: string;
    start_date?: string;
    end_date?: string;
    start_time?: string;
}

export function useItineraries() {
    return useQuery({
        queryKey: QUERY_KEYS.ITINERARIES,
        queryFn: itineraryService.getAll,
    });
}

export function useItinerary(id: string) {
    return useQuery({
        queryKey: QUERY_KEYS.ITINERARY(id),
        queryFn: () => itineraryService.getById(id),
        enabled: !!id,
    });
}

export function useGenerateItinerary() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (req: GenerateRequest) =>
            itineraryService.generate({
                swipe_session_id: req.swipe_session_id,
                destination_id: req.destination_id,
                start_date: req.start_date,
                end_date: req.end_date,
                start_time: req.start_time ?? '09:00',
            }),
        onSuccess: (itinerary: Itinerary) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ITINERARIES });
            queryClient.setQueryData(
                QUERY_KEYS.ITINERARY(String(itinerary.id)),
                itinerary,
            );
        },
    });
}

export function useSaveItinerary() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => itineraryService.save(id),
        onSuccess: (itinerary: Itinerary) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ITINERARIES });
            queryClient.setQueryData(
                QUERY_KEYS.ITINERARY(String(itinerary.id)),
                itinerary,
            );
        },
    });
}

export function usePublishItinerary() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
            publish ? itineraryService.publish(id) : itineraryService.unpublish(id),
        onSuccess: (itinerary: Itinerary) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ITINERARIES });
            queryClient.invalidateQueries({ queryKey: ['explore'] });
            queryClient.setQueryData(QUERY_KEYS.ITINERARY(String(itinerary.id)), itinerary);
        },
    });
}

export function useRateItinerary() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, stars }: { id: string; stars: number }) =>
            itineraryService.rate(id, stars),
        onSuccess: (itinerary: Itinerary) => {
            // Re-rank the explore feed and refresh the trip detail
            queryClient.invalidateQueries({ queryKey: ['explore'] });
            queryClient.setQueryData(QUERY_KEYS.ITINERARY(String(itinerary.id)), itinerary);
        },
    });
}

export function useDeleteItinerary() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => itineraryService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ITINERARIES });
        },
    });
}