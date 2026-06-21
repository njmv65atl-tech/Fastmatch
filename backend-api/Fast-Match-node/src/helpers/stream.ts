import { StreamClient } from '@stream-io/node-sdk';
import appConfig from '@config/config';

const apiKey = appConfig.streamApiKey || 'abc123';
const apiSecret = appConfig.streamApiSecret || 'secret';

/**
 * Generates a Stream Video token for a user
 * @param userId - The ID of the user
 * @returns A token string
 */
export const generateStreamToken = async (userId: string): Promise<string> => {
    const client = new StreamClient(apiKey, apiSecret);
    return client.generateUserToken({ user_id: userId, validity_in_seconds: 3600 });
};

/**
 * Creates a call on Stream Video servers to ensure it exists before clients try to join
 * @param callId - The unique ID for the call (matchId)
 * @param creatorId - The ID of the user creating/starting the call
 * @param memberIds - Array of user IDs who are members of this call
 */
export const createStreamCall = async (callId: string, creatorId: string, memberIds: string[]) => {
    try {
        const client = new StreamClient(apiKey, apiSecret);

        // 🔥 IMPORTANT: Users MUST exist on Stream server before they can be added to a call
        // We upsert them here to ensure they exist.
        await client.upsertUsers(memberIds.map(id => ({ id, role: 'user' })));

        // Use 'default' call type. ID can be the matchId.
        const call = client.video.call('default', callId);

        await call.getOrCreate({
            data: {
                created_by_id: creatorId,
                members: memberIds.map(id => ({ user_id: id, role: 'admin' })),
                custom: {
                    matchId: callId
                }
            },
        });

        console.log(`📡 Stream Call created successfully: ${callId}`);
        return true;
    } catch (error: any) {
        console.error('❌ Error creating Stream Call:', error.message);
        throw error;
    }
};

export const getStreamApiKey = (): string => apiKey;
