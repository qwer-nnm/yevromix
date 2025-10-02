import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getProfile, updateProfile, User } from '../api/user';

interface UserState {
  data: User | null;
  loading: boolean;
  error: string | null;
  isProfileComplete: boolean;
  cardNumber: string | null; // Додаємо поле для номера картки
}

const initialState: UserState = {
  data: null,
  loading: false,
  error: null,
  isProfileComplete: false,
  cardNumber: null, // Початкове значення
};

// Отримання профілю
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getProfile();
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Помилка завантаження профілю');
    }
  }
);

// Оновлення профілю
export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (data: {
    fullName?: string;
    email?: string;
    birthDate?: string;
    address?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await updateProfile(data);
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Помилка оновлення профілю');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.data = action.payload;
      state.cardNumber = action.payload.cardNumber;
      state.isProfileComplete = Boolean(
        action.payload.fullName &&
        action.payload.phone &&
        action.payload.isVerified
      );
    },
    clearUser: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
      state.isProfileComplete = false;
      state.cardNumber = null;
    },
    setCardNumber: (state, action) => {
      state.cardNumber = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Отримання профілю
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.cardNumber = action.payload.cardNumber; // Зберігаємо номер картки
        // Перевіряємо чи всі обов'язкові поля заповнені
        state.isProfileComplete = Boolean(
          action.payload.fullName &&
          action.payload.phone &&
          action.payload.isVerified
        );
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Оновлення профілю
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.cardNumber = action.payload.cardNumber; // Оновлюємо номер картки
        state.isProfileComplete = Boolean(
          action.payload.fullName &&
          action.payload.phone &&
          action.payload.isVerified
        );
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setUser, clearUser, setCardNumber } = userSlice.actions;
export default userSlice.reducer;

// Селектори
export const selectUser = (state: { user: UserState }) => state.user.data;
export const selectCardNumber = (state: { user: UserState }) => state.user.cardNumber;
export const selectIsProfileComplete = (state: { user: UserState }) => state.user.isProfileComplete;
export const selectIsLoading = (state: { user: UserState }) => state.user.loading;
export const selectError = (state: { user: UserState }) => state.user.error;