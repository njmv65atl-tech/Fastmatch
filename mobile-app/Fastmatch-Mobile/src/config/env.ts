import Config from 'react-native-config';

// Safely access Config in case the native module is stripped by ProGuard
const cfg = Config ?? {};

export const API_URL = cfg.API_URL || 'http://54.91.165.108';
export const DELL_URL = cfg.DELL_URL || 'http://54.91.165.108';
export const API_VERSION = cfg.API_VERSION || '/api/v1/';

export const BASE_URL = `${API_URL}${API_VERSION}`;
export const IMAGE_URL = API_URL;
export const SOCKET_URL = API_URL;
