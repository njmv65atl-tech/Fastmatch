/**
 * fastMatchSocket.ts
 * Socket service for FastMatch backend integration.
 * Connect, find match, accept/decline, start/end call.
 */
import { Socket, io } from 'socket.io-client';
import { API_URL } from '../config/env';

const SOCKET_URL = API_URL;

export type MatchData = {
    matchId: string;
    user: {
        name: string;
        age?: number;
        profilePicture?: string;
    };
};

export type CallStartData = {
    matchId: string;
    callId: string;
    streamToken: {
        token: string;
        apiKey: string;
        userId: string;
    };
    callType?: 'audio' | 'video';
};

let socket: Socket | null = null;

export const connectFastMatchSocket = (token: string): Socket => {
    if (socket?.connected) return socket;

    socket = io(SOCKET_URL, {
        auth: { token: token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
        console.log('[FastMatchSocket] Connected:', socket?.id);
    });

    socket.on('connect_error', (err) => {
        console.error('[FastMatchSocket] Connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
        console.log('[FastMatchSocket] Disconnected:', reason);
    });

    return socket;
};

export const getFastMatchSocket = (): Socket | null => socket;

export const disconnectFastMatchSocket = () => {
    socket?.disconnect();
    socket = null;
};

// ─── Actions ─────────────────────────────────────────────────────────────────

export const findMatch = (preference: 'everyone' | 'male' | 'female' = 'everyone') => {
    socket?.emit('find-match', { preference });
};

export const respondToMatch = (matchId: string, response: 'accepted' | 'declined') => {
    socket?.emit('match-response', { matchId, response });
};

export const endCall = (matchId: string) => {
    socket?.emit('end-call', { matchId });
};

// ─── Event Listeners ─────────────────────────────────────────────────────────

export const onMatchFound = (callback: (data: MatchData) => void) => {
    socket?.on('match-found', callback);
    return () => socket?.off('match-found', callback);
};

export const onCallStart = (callback: (data: CallStartData) => void) => {
    socket?.on('call-start', callback);
    return () => socket?.off('call-start', callback);
};

export const onCallEnded = (callback: (data: { matchId: string }) => void) => {
    socket?.on('call-ended', callback);
    return () => socket?.off('call-ended', callback);
};

export const onMatchDeclined = (callback: () => void) => {
    socket?.on('match-declined', callback);
    return () => socket?.off('match-declined', callback);
};