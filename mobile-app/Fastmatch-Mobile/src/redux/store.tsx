import {configureStore} from '@reduxjs/toolkit';
import { authApi } from './services/auth';
import {persistStore} from 'redux-persist';
import { rootReducer } from './slices';
const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(authApi.middleware),
});

export const persistor = persistStore(store);

export default store;
 
