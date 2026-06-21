
import AsyncStorage from '@react-native-async-storage/async-storage';
import {authApi} from '../services/auth';
import {combineReducers} from '@reduxjs/toolkit';
import persistReducer from 'redux-persist/es/persistReducer';
import persistedReducer from './persistedSlice';
import globalReducer from './globalSlice';

const persistConfig = {
  key: 'persist',
  storage: AsyncStorage,
};

const persistValueReducer = persistReducer(persistConfig, persistedReducer);

export const rootReducer = combineReducers({
  persist: persistValueReducer,
  global: globalReducer,
  [authApi.reducerPath]: authApi.reducer,
});