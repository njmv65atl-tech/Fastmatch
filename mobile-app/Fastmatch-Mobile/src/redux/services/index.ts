import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { DataManager } from '../../helpers/dataManager';

import { API_URL, DELL_URL, API_VERSION, BASE_URL as ENV_BASE_URL, IMAGE_URL } from '../../config/env';

import { onLogout, popTypes, ShowAlertMessage } from '../../helpers/commonFunctions';

// initialize an empty api service that we'll inject endpoints into later as needed

export const url = {
  local: API_URL,
  dell: DELL_URL,
  version: API_VERSION,
};

export const BASE_URL = ENV_BASE_URL;
export const IMG_URL = IMAGE_URL;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: async (headers) => {
    const access_token = await DataManager.getAccessToken();
    if (access_token) {
      headers.set('x-access-token', `Bearer ${access_token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  const result: any = await rawBaseQuery(args, api, extraOptions);
  if (result.error) {
    const status = result.error.status;
    const msg = (result.error.data?.message || '').toLowerCase();
    if (status === 401 || status === 402 || msg.includes('another device') || result.error.data?.data?.sessionExpired) {
      console.warn('Session expired or logged into on another device. Auto-logging out...');
      onLogout();
      ShowAlertMessage('Your account was logged into on another device. You have been logged out.', popTypes.error);
    }
  }
  return result;
};

export const emptySplitApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  endpoints: builder => ({}),
});

export const header1 = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

export const header2 = {
  Accept: 'application/json',
  'Content-Type': 'multipart/form-data',
};
