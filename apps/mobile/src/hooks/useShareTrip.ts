import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { AppScreenNavigationProp } from '../types/navigation';
import { usePublishItinerary } from './useItinerary';
import type { Itinerary } from '@gowander/shared-types';

/**
 * Shared "Share trip" action sheet: publish/unpublish on Explore
 * (public) or send to a friend via chat (private). `onUpdated` receives
 * the refreshed itinerary after a publish toggle.
 */
export function useShareTrip(onUpdated?: (itinerary: Itinerary) => void) {
    const navigation = useNavigation<AppScreenNavigationProp>();
    const publishItinerary = usePublishItinerary();

    function shareTrip(itinerary: Itinerary) {
        Alert.alert('Share trip', 'How do you want to share it?', [
            {
                text: itinerary.is_public ? 'Remove from Explore' : 'Publish to Explore',
                onPress: async () => {
                    try {
                        const updated = await publishItinerary.mutateAsync({
                            id: String(itinerary.id),
                            publish: !itinerary.is_public,
                        });
                        onUpdated?.(updated);
                    } catch (err) {
                        Alert.alert('Could not update', err instanceof Error ? err.message : '');
                    }
                },
            },
            {
                text: 'Send to a friend',
                onPress: () =>
                    navigation.navigate('ShareTrip', {
                        itineraryId: String(itinerary.id),
                        itineraryTitle: itinerary.title,
                    }),
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    }

    return { shareTrip, isPublishing: publishItinerary.isPending };
}
