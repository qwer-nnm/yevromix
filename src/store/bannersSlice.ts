import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getBanners, Banner } from '../api/banners';
import { logger } from '../utils/logger';

interface BannersState {
  items: Banner[];
  loading: boolean;
  error: string | null;
  activeIndex: number;
  lastFetch: number | null;
  staleTime: number;
}

const STALE_TIME = 5 * 60 * 1000; // 5 хвилин

const initialState: BannersState = {
  items: [],
  loading: false,
  error: null,
  activeIndex: 0,
  lastFetch: null,
  staleTime: STALE_TIME,
};

// Перевірка чи потрібно оновлювати дані
const shouldFetchBanners = (state: { banners: BannersState }): boolean => {
  const { lastFetch, staleTime } = state.banners;
  if (!lastFetch) {
    logger.info('Should fetch banners: no lastFetch');
    return true;
  }
  const shouldFetch = Date.now() - lastFetch > staleTime;
  logger.info('Should fetch banners:', { 
    lastFetch: new Date(lastFetch).toISOString(), 
    staleTime: staleTime / 1000 / 60 + ' min',
    shouldFetch 
  });
  return shouldFetch;
};

// Отримання банерів з API
export const fetchBanners = createAsyncThunk(
  'banners/fetch',
  async (_, { getState, rejectWithValue }) => {
    try {
      // Перевіряємо чи потрібно оновлювати дані
      const state = getState() as { banners: BannersState };
      if (!shouldFetchBanners(state)) {
        return null; // Пропускаємо запит якщо дані свіжі
      }

      const response = await getBanners();
      return response.data.banners;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Помилка завантаження банерів');
    }
  },
  {
    // Пропускаємо action якщо дані свіжі
    condition: (_, { getState }) => {
      const state = getState() as { banners: BannersState };
      return shouldFetchBanners(state);
    }
  }
);

const bannersSlice = createSlice({
  name: 'banners',
  initialState,
  reducers: {
    setActiveIndex: (state, action) => {
      state.activeIndex = action.payload;
    },
    // Фолбек на дефолтні банери при помилці
    setDefaultBanners: (state) => {
      state.items = [
        {
          id: 1,
          title: 'Твоя ціль — відпочинок.',
          imageUrl: '',
          linkUrl: null,
          orderIndex: 1,
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Ми вже влучили!',
          imageUrl: '',
          linkUrl: null,
          orderIndex: 2,
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          title: '-30%',
          imageUrl: '',
          linkUrl: null,
          orderIndex: 3,
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanners.pending, (state) => {
        // Не встановлюємо loading якщо дані свіжі
        if (!state.lastFetch || Date.now() - state.lastFetch > state.staleTime) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.items = action.payload;
          state.lastFetch = Date.now();
          // Автоматично встановлюємо другий банер активним при завантаженні
          if (state.items.length > 1) {
            state.activeIndex = 1;
          }
        }
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // При помилці встановлюємо дефолтні банери
        state.items = [
          {
            id: 1,
            title: 'Твоя ціль — відпочинок.',
            imageUrl: '',
            linkUrl: null,
            orderIndex: 1,
            isActive: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            title: 'Ми вже влучили!',
            imageUrl: '',
            linkUrl: null,
            orderIndex: 2,
            isActive: true,
            createdAt: new Date().toISOString()
          },
          {
            id: 3,
            title: '-30%',
            imageUrl: '',
            linkUrl: null,
            orderIndex: 3,
            isActive: true,
            createdAt: new Date().toISOString()
          }
        ];
      });
  },
});

export const { setActiveIndex, setDefaultBanners } = bannersSlice.actions;

// Селектори
export const selectBanners = (state: { banners: BannersState }) => state.banners.items;
export const selectActiveBanner = (state: { banners: BannersState }) => 
  state.banners.items[state.banners.activeIndex];
export const selectBannersLoading = (state: { banners: BannersState }) => state.banners.loading;
export const selectBannersError = (state: { banners: BannersState }) => state.banners.error;
export const selectActiveIndex = (state: { banners: BannersState }) => state.banners.activeIndex;

export default bannersSlice.reducer;