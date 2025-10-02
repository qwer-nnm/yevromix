import { apiClient } from './base';

export interface User {
  id: number;
  phone: string;
  fullName: string;
  cardNumber: string;
  birthDate: string | null;
  email: string | null;
  address: string | null;
  isVerified: boolean;
}

interface ProfileResponse {
  success: boolean;
  user: User;
}

interface UpdateProfileData {
  fullName?: string;
  email?: string;
  birthDate?: string;
  address?: string;
}

interface UpdatePushTokenData {
  pushToken: string;
}

interface UpdatePushTokenResponse {
  success: boolean;
  message: string;
}

// Отримання профілю
export const getProfile = () => 
  apiClient.get<ProfileResponse>('/api/user/profile');

// Оновлення профілю
export const updateProfile = (data: UpdateProfileData) => 
  apiClient.put<ProfileResponse>('/user/profile', data);

// Оновлення push токена
export const updatePushToken = (data: UpdatePushTokenData) =>
  apiClient.put<UpdatePushTokenResponse>('/user/push-token', data);