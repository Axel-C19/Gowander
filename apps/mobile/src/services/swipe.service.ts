import { ENDPOINTS } from '@gowander/shared-constants';
import type { SwipeSession, SwipeAction } from '@gowander/shared-types';
import { apiClient } from './api';

export const swipeService = {
  async createSession(destinationId: string): Promise<SwipeSession> {
    const { data } = await apiClient.post<SwipeSession>(ENDPOINTS.SWIPE.SESSION, {
      destination_id: destinationId,
    });
    return data;
  },

  async recordAction(sessionId: string, action: SwipeAction): Promise<void> {
    await apiClient.post(ENDPOINTS.SWIPE.ACTION(sessionId), action);
  },

  async completeSession(sessionId: string): Promise<SwipeSession> {
    const { data } = await apiClient.post<SwipeSession>(
      ENDPOINTS.SWIPE.COMPLETE(sessionId),
    );
    return data;
  },
};
