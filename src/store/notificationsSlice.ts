import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getUserNotifications, NotificationItem, markNotificationRead, markAllNotificationsRead, getNotificationsStats } from '../api/notifications';
import { USE_MOCK_NOTIFICATIONS, mockNotifications } from '../mocks/notifications';
import { logger } from '../utils/logger';

interface NotificationsState {
  pushToken: string | null;
  enabled: boolean;
  items: NotificationItem[];
  loading: boolean;
  error: string | null;
  unread: number | null;
}

const initialState: NotificationsState = {
  pushToken: null,
  enabled: true,
  items: [],
  loading: false,
  error: null,
  unread: null,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async ({ limit = 50, offset = 0 }: { limit?: number; offset?: number } = {}, { rejectWithValue }) => {
    try {
      logger.info('Fetching notifications...');
      // Dev/mock режим
      if (USE_MOCK_NOTIFICATIONS) {
        logger.info('Using mock notifications');
        return mockNotifications;
      }

      logger.info('Making API call to getUserNotifications...');
      const res = await Promise.race([
        getUserNotifications({ limit, offset }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout after 15s')), 15000))
      ]);
      
      logger.info('API Response received:', res);
      
      const raw = (res as any)?.data ?? {};
      logger.info('Response data:', JSON.stringify(raw, null, 2));
      
      // Перевіряємо різні можливі формати відповіді
      const list = Array.isArray(raw.notifications) 
        ? raw.notifications 
        : Array.isArray(raw.data) 
          ? raw.data
          : Array.isArray(raw)
            ? raw
            : [];
            
      logger.info('Notification list extracted:', list.length, 'items');
      
      const normalized: NotificationItem[] = list.map((n: any) => {
        const item = {
          id: n.id,
          title: n.title,
          message: n.message,
          status: n.is_read !== undefined ? (n.is_read ? 'read' : 'unread') : (n.status || 'unread'),
          createdAt: n.created_at || n.createdAt || new Date().toISOString(),
        };
        logger.info('Normalized item:', item);
        return item;
      });
      
      logger.info('Total notifications normalized:', normalized.length);
      return normalized;
    } catch (e: any) {
      logger.error('Failed to fetch notifications:', e);
      logger.error('Error response status:', e?.response?.status);
      logger.error('Error response data:', e?.response?.data);
      logger.error('Error message:', e?.message);
      
      // Якщо це таймаут
      if (e?.message?.includes('timeout')) {
        return rejectWithValue('Перевищено час очікування відповіді сервера (15 секунд)');
      }
      
      return rejectWithValue(e.response?.data?.message || e?.message || 'Помилка завантаження сповіщень');
    }
  }
);

export const readNotification = createAsyncThunk(
  'notifications/readOne',
  async (id: number, { rejectWithValue }) => {
    try {
      await markNotificationRead(id);
      return id;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Не вдалося відмітити як прочитане');
    }
  }
);

export const readAllNotifications = createAsyncThunk(
  'notifications/readAll',
  async (_, { rejectWithValue }) => {
    try {
      await markAllNotificationsRead();
      return true;
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Не вдалося відмітити всі як прочитані');
    }
  }
);

export const fetchNotificationsStats = createAsyncThunk(
  'notifications/stats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getNotificationsStats();
      return (res as any)?.data ?? {};
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message || 'Не вдалося отримати статистику');
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setPushToken(state, action) {
      state.pushToken = action.payload;
    },
    setEnabled(state, action) {
      state.enabled = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
        logger.info('Notifications slice: pending');
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        logger.info('Notifications slice: fulfilled', { count: action.payload.length });
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        logger.warn('Notifications slice: rejected', action.payload);
      })
      .addCase(readNotification.fulfilled, (state, action) => {
        state.items = state.items.map(n => n.id === action.payload ? { ...n, status: 'read' } : n);
      })
      .addCase(readAllNotifications.fulfilled, (state) => {
        state.items = state.items.map(n => ({ ...n, status: 'read' }));
      })
      .addCase(fetchNotificationsStats.fulfilled, (state, action) => {
        state.unread = (action.payload as any)?.unread ?? null;
      });
  }
});

export const { setPushToken, setEnabled } = notificationsSlice.actions;
export default notificationsSlice.reducer;

// selectors
export const selectNotifications = (state: { notifications: NotificationsState }) => state.notifications.items;
export const selectNotificationsLoading = (state: { notifications: NotificationsState }) => state.notifications.loading;
export const selectNotificationsError = (state: { notifications: NotificationsState }) => state.notifications.error;


