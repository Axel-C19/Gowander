import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { socialService } from '../services/social.service';

const KEYS = {
  friends: ['social', 'friends'] as const,
  requests: ['social', 'requests'] as const,
  conversation: (userId: string) => ['social', 'conversation', userId] as const,
  explore: ['explore'] as const,
};

export function useFriends() {
  return useQuery({ queryKey: KEYS.friends, queryFn: socialService.getFriends });
}

export function useFriendRequests() {
  return useQuery({ queryKey: KEYS.requests, queryFn: socialService.getFriendRequests });
}

export function useSendFriendRequest() {
  return useMutation({
    mutationFn: (userId: string) => socialService.sendFriendRequest(userId),
  });
}

export function useAcceptRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) => socialService.acceptRequest(friendshipId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.requests });
      qc.invalidateQueries({ queryKey: KEYS.friends });
    },
  });
}

export function useDeclineRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) => socialService.declineRequest(friendshipId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.requests }),
  });
}

export function useConversation(userId: string) {
  return useQuery({
    queryKey: KEYS.conversation(userId),
    queryFn: () => socialService.getConversation(userId),
    refetchInterval: 5000,   // Simple polling; websockets are post-MVP
  });
}

export function useSendMessage(recipientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ text, itineraryId }: { text?: string; itineraryId?: string }) =>
      socialService.sendMessage(recipientId, text, itineraryId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: KEYS.conversation(recipientId) }),
  });
}

export function usePublicTrips() {
  return useQuery({ queryKey: KEYS.explore, queryFn: socialService.getPublicTrips });
}
