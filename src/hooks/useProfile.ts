import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { 
  fetchUserProfile, 
  updateUserProfile,
  selectUser,
  selectIsProfileComplete,
  selectIsLoading,
  selectError
} from '../store/userSlice';
import type { AppDispatch } from '../store';

export const useProfile = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  
  const user = useSelector(selectUser);
  const isComplete = useSelector(selectIsProfileComplete);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  useEffect(() => {
    // Завантажуємо профіль при першому рендері
    if (!user) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, user]);

  const updateProfile = async (data: {
    fullName?: string;
    email?: string;
    birthDate?: string;
    address?: string;
  }) => {
    try {
      await dispatch(updateUserProfile(data)).unwrap();
      return true;
    } catch (error) {
      return false;
    }
  };

  // Валідація email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Валідація дати народження
  const validateBirthDate = (date: string): boolean => {
    const birthDate = new Date(date);
    const now = new Date();
    const minAge = 16;
    const maxAge = 100;

    const age = now.getFullYear() - birthDate.getFullYear();
    return age >= minAge && age <= maxAge;
  };

  // Форматування дати для API
  const formatBirthDate = (date: string): string => {
    return new Date(date).toISOString().split('T')[0];
  };

  return {
    user,
    isComplete,
    isLoading,
    error,
    updateProfile,
    validateEmail,
    validateBirthDate,
    formatBirthDate,
  };
};
