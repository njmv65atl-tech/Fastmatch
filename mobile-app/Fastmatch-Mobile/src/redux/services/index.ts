import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { DataManager } from '../../helpers/dataManager';

import { API_URL, DELL_URL, API_VERSION, BASE_URL as ENV_BASE_URL, IMAGE_URL } from '../../config/env';

// initialize an empty api service that we'll inject endpoints into later as needed

export const url = {
  local: API_URL,
  dell: DELL_URL,
  version: API_VERSION,
};

export const BASE_URL = ENV_BASE_URL;
export const IMG_URL = IMAGE_URL;

export const emptySplitApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    // baseUrl: BASE_URL_LIVE,
    baseUrl: BASE_URL,
    credentials: 'include',
    prepareHeaders: async (headers, { getState }) => {
      // console.log('VITE_LOCAL_SERVER: ', BASE_URL_LIVE);
      const access_token = await DataManager.getAccessToken();
      if (access_token) {
        headers.set('x-access-token', `Bearer ${access_token}`);
      }
      return headers;
    },
  }),
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
