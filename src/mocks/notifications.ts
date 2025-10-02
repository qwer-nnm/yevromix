import type { NotificationItem } from '../api/notifications';

export const USE_MOCK_NOTIFICATIONS = false;

export const mockNotifications: NotificationItem[] = [
  {
    id: 101,
    title: 'Только сегодня! Скидки до -40% на новые коллекции.',
    message: 'Успей забрать свой размер!',
    status: 'sent',
    createdAt: '2025-09-12T10:02:00.000Z'
  },
  {
    id: 102,
    title: 'Только сегодня! Скидки до -40% на новые коллекции.',
    message: 'Успей забрать свой размер!',
    status: 'read',
    createdAt: '2025-09-12T09:32:00.000Z'
  },
  {
    id: 103,
    title: 'Нові надходження цього тижня',
    message: 'Обери свій стиль разом з нами.',
    status: 'read',
    createdAt: '2025-05-18T09:32:00.000Z'
  },
  {
    id: 104,
    title: 'Весняні знижки до -30%!',
    message: 'Акція діє до кінця тижня.',
    status: 'read',
    createdAt: '2025-05-05T09:32:00.000Z'
  },
  {
    id: 105,
    title: 'Подарунок до кожної покупки',
    message: 'Діє тільки у вихідні.',
    status: 'read',
    createdAt: '2025-01-20T09:32:00.000Z'
  },
  {
    id: 106,
    title: 'Розпродаж сезону',
    message: 'Тільки найкращі пропозиції.',
    status: 'read',
    createdAt: '2025-01-12T09:32:00.000Z'
  }
];


