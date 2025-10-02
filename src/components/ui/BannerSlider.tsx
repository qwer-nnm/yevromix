import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { ExternalPathString, RelativePathString } from 'expo-router/build/types';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBanners, setActiveIndex, selectBanners, selectActiveIndex, selectBannersLoading } from '../../store/bannersSlice';
import { imageCache } from '../../services/imageCache';
import type { AppDispatch } from '../../store';
import type { ImageSource } from 'expo-image';
import { logger } from '../../utils/logger';
import { s } from '../../utils/scale';

const { width } = Dimensions.get('window');
const BASE_BANNER_WIDTH = s(312); // цільова ширина 312 по скейлу
const BANNER_MARGIN = s(12);

// Типізуємо плейсхолдер
const PLACEHOLDER_IMAGE = require('../../../assets/images/banner-placeholder.png') as ImageSource;

export default function BannerSlider() {
  const dispatch = useDispatch<AppDispatch>();
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  const banners = useSelector(selectBanners);
  const activeIndex = useSelector(selectActiveIndex);
  const loading = useSelector(selectBannersLoading);
  
  const [cachedImages, setCachedImages] = useState<{ [key: string]: string }>({});
  const [containerWidth] = useState<number>(width);

  // Динамічні розрахунки: гарантуємо "виглядання" по 24px збоку
  const targetSide = s(24);
  const bannerWidth = Math.max(0, Math.min(BASE_BANNER_WIDTH, containerWidth - targetSide * 2));
  const sideInsetDynamic = Math.max(0, Math.round((containerWidth - bannerWidth) / 2));
  const totalBannerWidth = bannerWidth + BANNER_MARGIN;

  useEffect(() => {
    // Завантажуємо банери при монтуванні
    dispatch(fetchBanners());
  }, [dispatch]);

  useEffect(() => {
    // Встановлюємо інтервал для оновлення банерів (тільки один раз)
    const interval = setInterval(() => {
      dispatch(fetchBanners());
    }, 10 * 60 * 1000); // Оновлюємо кожні 10 хвилин

    return () => clearInterval(interval);
  }, []); // Порожній масив залежностей - інтервал створюється тільки один раз

  useEffect(() => {
    // Кешуємо зображення банерів
    const cacheImages = async () => {
      try {
        // Спочатку кешуємо поточний та наступний банер
        const currentAndNext = banners.slice(activeIndex, activeIndex + 2);
        await Promise.all(
          currentAndNext.map(async (banner) => {
            if (banner?.imageUrl) {
              const cachedUrl = await imageCache.getCachedImage(banner.imageUrl);
              setCachedImages(prev => ({ ...prev, [banner.id]: cachedUrl }));
            }
          })
        );

        // Потім кешуємо решту банерів у фоні
        const otherBanners = banners.filter((_, i) => 
          i !== activeIndex && i !== activeIndex + 1
        );
        
        Promise.all(
          otherBanners.map(async (banner) => {
            if (banner?.imageUrl) {
              const cachedUrl = await imageCache.getCachedImage(banner.imageUrl);
              setCachedImages(prev => ({ ...prev, [banner.id]: cachedUrl }));
            }
          })
        );
      } catch (error) {
        logger.error('Error caching banner images:', error);
      }
    };

    if (banners.length > 0) {
      cacheImages();
    }
  }, [banners]);

  useEffect(() => {
    // Автоматично скролимо до другого банера після завантаження
    if (banners.length > 1 && scrollViewRef.current) {
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: totalBannerWidth,
          animated: true
        });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [banners, totalBannerWidth]);

  const onScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / totalBannerWidth);
    if (index !== activeIndex) {
      const newIndex = Math.max(0, Math.min(banners.length - 1, index));
      dispatch(setActiveIndex(newIndex));
    }
  };

  const handleBannerPress = (linkUrl: string | null) => {
    if (!linkUrl) return;
    
    try {
      // Якщо це зовнішнє посилання
      if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
        // TODO: Додати логіку для відкриття зовнішніх посилань
        import('react-native').then(({ Linking }) => {
          Linking.openURL(linkUrl).catch((err) => {
            console.error('Error opening external URL:', err);
          });
        });
        return;
      }
      
      // Для внутрішніх посилань додатку
      const segments = linkUrl.split('/').filter(Boolean);
      const firstSegment = segments[0];
      
      // Перевіряємо, чи це один з відомих маршрутів
      let path: RelativePathString;
      if (firstSegment === 'auth') {
        path = `/(auth)/${segments.slice(1).join('/')}` as RelativePathString;
      } else if (firstSegment === 'main') {
        path = `/(main)/${segments.slice(1).join('/')}` as RelativePathString;
      } else {
        // За замовчуванням перенаправляємо в main розділ
        path = `/(main)/${segments.join('/')}` as RelativePathString;
      }
      router.push(path);
      
    } catch (error) {
      console.error('Error navigating to:', linkUrl, error);
    }
  };

  if (loading && banners.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <View style={[styles.bannerContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </View>
    );
  }

  // deprecated calc – replaced by sideInsetDynamic above

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        style={{ overflow: 'visible' }}
        showsHorizontalScrollIndicator={false}
        snapToInterval={totalBannerWidth}
        snapToAlignment="center"
        disableIntervalMomentum
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={banners.length > 1}
      >
        {banners.map((banner, i) => (
          <TouchableOpacity
            key={banner.id}
            activeOpacity={0.9}
            onPress={() => handleBannerPress(banner.linkUrl)}
          >
            <View style={[
              styles.bannerContainer,
              { 
                width: bannerWidth, 
                marginRight: i === banners.length - 1 ? sideInsetDynamic : BANNER_MARGIN, 
                // ще менше "виглядання" зліва
                marginLeft: i === 0 ? Math.max(0, sideInsetDynamic - s(16)) : 0 
              }
            ]}>
              {banner.imageUrl ? (
                <Image
                  source={cachedImages[banner.id] || banner.imageUrl}
                  style={[styles.bannerImage, { borderRadius: 16 }]}
                  contentFit="cover"
                  contentPosition="center"
                  transition={300}
                  placeholder={loading ? undefined : PLACEHOLDER_IMAGE}
                />
              ) : (
                <View style={{ padding: 16 }}>
                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                  {i === 2 && (
                    <View style={styles.discountContainer}>
                      <Text style={styles.discountText}>{banner.title}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
        {/* Додатковий простір справа більше не потрібен, останній банер має marginRight = sideInset */}
      </ScrollView>

      {banners.length > 1 && (
        <View style={styles.indicatorContainer}>
          <View style={styles.indicatorTrack}>
            <View
              style={[
                styles.indicatorDot,
                {
                  transform: [{ 
                    translateX: activeIndex * 14.5 - (activeIndex === 0 ? -3 : activeIndex === banners.length - 1 ? 3 : 0) 
                  }]
                }
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 51,
  },
  loadingContainer: {
    marginTop: 51,
  },
  scrollContent: {
    // paddingHorizontal динамічно виставляємо через SIDE_INSET
  },
  bannerContainer: {
    height: 146,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 16,
    shadowColor: 'rgba(0,0,0,0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6,
    marginRight: BANNER_MARGIN,
    padding: 0,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute'
  },
  bannerTitle: {
    color: '#000',
    fontSize: 20,
    fontWeight: '700'
  },
  discountContainer: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20
  },
  discountText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800'
  },
  indicatorContainer: {
    marginTop: 15,
    alignItems: 'center'
  },
  indicatorTrack: {
    width: 43,
    height: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(102, 102, 102, 1)',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  indicatorDot: {
    width: 14,
    height: 4,
    borderRadius: 16,
    backgroundColor: '#FFFFFF'
  }
});