import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  completeProfile: false,
  user: null,
};

const persistedSlice = createSlice({
  name: "persist",
  initialState,
  reducers: {
    setToken: (state, action) => {
      return {
        ...state,
        token: action?.payload,
      };
    },
    setCompleteProfile: (state, action) => {
      return { ...state, completeProfile: action?.payload };
    },
    setGlobalUser: (state, action) => {
      return {
        ...state,
        user: action?.payload,
      };
    },
    resetPersistStore: () => initialState,
  },
});

export const tokenSelector = (state: any) => state.persist.token;
export const completeProfileSelector = (state: any) =>
  state.persist.completeProfile;
export const userSelector = (state: any) => state.persist.user;

export const {
  setToken,
  setCompleteProfile,
  setGlobalUser,
  resetPersistStore,
} = persistedSlice.actions;
export default persistedSlice.reducer;
