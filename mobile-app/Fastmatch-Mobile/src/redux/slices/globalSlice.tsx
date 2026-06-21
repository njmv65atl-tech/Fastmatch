import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState = {
  isLoading: false,
  fcmToken: null,
  hasUnread: false, // New state for the red dot
  incomingMatchRequest: null as any, // New state for global match request modal
  skippedStack: [] as any[], // Local stack of recently skipped users
};

const globalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    loadingOn: (state) => {
      state.isLoading = true;
    },
    loadingOff: (state) => {
      state.isLoading = false;
    },
    
    // Action to update the red dot status
    setHasUnread: (state, action: PayloadAction<boolean>) => {
      state.hasUnread = action.payload;
    },

    // Actions for the global real-time match request popup
    setIncomingMatchRequest: (state, action: PayloadAction<any>) => {
      state.incomingMatchRequest = action.payload;
    },
    clearIncomingMatchRequest: (state) => {
      state.incomingMatchRequest = null;
    },
    pushSkippedUser: (state, action: PayloadAction<any>) => {
      state.skippedStack.push(action.payload);
      if (state.skippedStack.length > 10) state.skippedStack.shift(); // Keep max 10
    },
    popSkippedUser: (state) => {
      state.skippedStack.pop();
    },

    resetGlobalStore: () => {
      return initialState;
    },
  },
});

// Selectors
export const loadingSelector = (state: any) => state.global.isLoading;
export const hasUnreadSelector = (state: any) => state.global.hasUnread;
export const incomingMatchRequestSelector = (state: any) => state.global.incomingMatchRequest;
export const skippedStackSelector = (state: any) => state.global.skippedStack;

export const { 
  loadingOn, 
  loadingOff, 
  setHasUnread, 
  setIncomingMatchRequest,
  clearIncomingMatchRequest,
  pushSkippedUser,
  popSkippedUser,
  resetGlobalStore 
} = globalSlice.actions;

export default globalSlice.reducer;



