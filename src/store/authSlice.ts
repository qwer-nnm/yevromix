import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { requestCode, verifyCode, completeRegistration } from '../api/auth';
import { authService } from '../services/auth';
import { User } from '../api/user';
import { setUser } from './userSlice';

// Токени керуються через authService

interface AuthState {
  isAuthenticated: boolean;
  isRegistered: boolean;
  phone: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isRegistered: false,
  phone: null,
  loading: false,
  error: null,
};

const saveTokens = async (accessToken: string, refreshToken: string) => {
  await authService.saveTokens(accessToken, refreshToken);
};

const clearTokens = async () => {
  await authService.logout();
};

// Валідація номера телефону
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+380\d{9}$/;
  return phoneRegex.test(phone);
};

// Action для оновлення даних користувача
export const updateUserData = createAsyncThunk(
  'auth/updateUserData',
  async (user: User, { dispatch }) => {
    dispatch(setUser(user));
    return user;
  }
);

// Асинхронні actions
export const requestAuthCode = createAsyncThunk(
  'auth/requestCode',
  async ({ phone, pushToken }: { phone: string; pushToken: string }, { rejectWithValue }) => {
    try {
      if (!validatePhone(phone)) {
        throw new Error('Номер телефону має починатися з +380 та містити 12 цифр');
      }
      const response = await requestCode(phone, pushToken);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const verifyAuthCode = createAsyncThunk(
  'auth/verifyCode',
  async ({ phone, code }: { phone: string; code: string }, { dispatch, rejectWithValue }) => {
    try {
      const response = await verifyCode(phone, code);
      // Зберігаємо токени
      await saveTokens(response.data.token, response.data.refreshToken);
      // Оновлюємо дані користувача
      await dispatch(updateUserData(response.data.user));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const completeUserRegistration = createAsyncThunk(
  'auth/completeRegistration',
  async ({ phone, fullName }: { phone: string; fullName: string }, { dispatch, rejectWithValue }) => {
    try {
      const response = await completeRegistration(phone, fullName);
      await dispatch(updateUserData(response.data.user));
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetAuth: (state) => {
      state.isAuthenticated = false;
      state.isRegistered = false;
      state.phone = null;
      state.loading = false;
      state.error = null;
      // Очищаємо токени
      clearTokens();
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Request Code
      .addCase(requestAuthCode.pending, (state) => {
        state.loading = true;
        state.error = null; // скидаємо помилки перед новою спробою
      })
      .addCase(requestAuthCode.fulfilled, (state, action) => {
        state.loading = false;
        state.phone = action.meta.arg.phone;
        state.isRegistered = action.payload.isRegistered;
      })
      .addCase(requestAuthCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Verify Code
      .addCase(verifyAuthCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyAuthCode.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        // Оновлюємо прапорець реєстрації на основі повного імені користувача
        try {
          const user = (action as any).payload?.user;
          state.isRegistered = Boolean(user && typeof user.fullName === 'string' && user.fullName.trim().length > 0);
        } catch {}
      })
      .addCase(verifyAuthCode.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Неверный формат кода';
      })
      // Complete Registration
      .addCase(completeUserRegistration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeUserRegistration.fulfilled, (state) => {
        state.loading = false;
        state.isRegistered = true;
      })
      .addCase(completeUserRegistration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetAuth, setError } = authSlice.actions;
export default authSlice.reducer;