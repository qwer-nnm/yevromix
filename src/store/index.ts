import { configureStore } from '@reduxjs/toolkit';
import authSlice from './authSlice';
import userSlice from './userSlice';
import bannersSlice from './bannersSlice';
import notificationsSlice from './notificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    banners: bannersSlice,
    notifications: notificationsSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;