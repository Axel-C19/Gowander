import { ENDPOINTS } from '@gowander/shared-constants';
import type { UserPublic, Friend, FriendRequest, Message, PublicTrip } from '@gowander/shared-types';
import { apiClient } from './api';

export const socialService = {
  async searchUsers(q: string): Promise<UserPublic[]> {
    const { data } = await apiClient.get<UserPublic[]>(
      `${ENDPOINTS.SOCIAL.USER_SEARCH}?q=${encodeURIComponent(q)}`,
    );
    return data;
  },

  async sendFriendRequest(userId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.SOCIAL.FRIEND_REQUEST, { user_id: userId });
  },

  async getFriendRequests(): Promise<FriendRequest[]> {
    const { data } = await apiClient.get<FriendRequest[]>(ENDPOINTS.SOCIAL.FRIEND_REQUESTS);
    return data;
  },

  async acceptRequest(friendshipId: string): Promise<void> {
    await apiClient.post(ENDPOINTS.SOCIAL.ACCEPT_REQUEST(friendshipId));
  },

  async declineRequest(friendshipId: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.SOCIAL.DECLINE_REQUEST(friendshipId));
  },

  async getFriends(): Promise<Friend[]> {
    const { data } = await apiClient.get<Friend[]>(ENDPOINTS.SOCIAL.FRIENDS);
    return data;
  },

  async getConversation(userId: string): Promise<Message[]> {
    const { data } = await apiClient.get<Message[]>(ENDPOINTS.SOCIAL.CONVERSATION(userId));
    return data;
  },

  async sendMessage(recipientId: string, text?: string, itineraryId?: string): Promise<Message> {
    const { data } = await apiClient.post<Message>(ENDPOINTS.SOCIAL.MESSAGES, {
      recipient_id: recipientId,
      text: text ?? null,
      itinerary_id: itineraryId ?? null,
    });
    return data;
  },

  async getPublicTrips(): Promise<PublicTrip[]> {
    const { data } = await apiClient.get<PublicTrip[]>(ENDPOINTS.EXPLORE);
    return data;
  },
};
