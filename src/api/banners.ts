import { apiClient } from './base';

export interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
}

interface BannersResponse {
  success: boolean;
  banners: Banner[];
}

export const getBanners = () => 
  apiClient.get<BannersResponse>('/api/user/banners');