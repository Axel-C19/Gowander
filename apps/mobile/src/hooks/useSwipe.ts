import { useMutation } from '@tanstack/react-query';
import { swipeService } from '../services/swipe.service';
import { useSwipeStore } from '../store/slices/swipe.slice';
import type { PlaceCard, SwipeDecision } from '@gowander/shared-types';

export function useSwipeSession(destinationId: string) {
    const { sessionId, recordSwipe, completeSession } = useSwipeStore();

    const createSession = useMutation({
        mutationFn: () => swipeService.createSession(destinationId),
        // onSuccess is handled in SwipeDeckScreen so we have access to places data
    });

    const swipe = useMutation({
        mutationFn: ({
                         place,
                         decision,
                     }: {
            place: PlaceCard;
            decision: SwipeDecision;
        }) => {
            if (!sessionId) throw new Error('No active session');
            return swipeService.recordAction(sessionId, {
                place_id: place.id.toString(),
                decision,
            });
        },
        onSuccess: (_, { place, decision }) => {
            recordSwipe(place, decision);
        },
        onError: (_, { place, decision }) => {
            // Record locally even if API call failed — don't block UX
            recordSwipe(place, decision);
        },
    });

    const finish = useMutation({
        mutationFn: () => {
            if (!sessionId) throw new Error('No active session');
            return swipeService.completeSession(sessionId);
        },
        onSuccess: () => completeSession(),
    });

    return { createSession, swipe, finish };
}