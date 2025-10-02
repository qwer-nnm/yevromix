# API Документация - Система уведомлений

## 📋 Обзор

Система уведомлений позволяет:
- **Админам**: создавать таргетированные рассылки по городам, возрасту, дате регистрации
- **Пользователям**: просматривать только свои уведомления, отмечать прочитанные
- **Отслеживать**: статистику прочтения и эффективность рассылок

---

## 🔐 Админские эндпоинты

### 1. Авторизация админа
```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@euromix.com",
  "password": "admin123"
}
```

**Ответ:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": 1,
    "email": "admin@euromix.com",
    "full_name": "Администратор"
  }
}
```

---

### 2. Создание уведомления с таргетингом
```http
POST /api/admin/push-notifications
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Скидка 20% в Харькове!",
  "message": "Специальное предложение для жителей Харькова. Скидка действует до конца месяца.",
  "scheduledAt": "2024-01-15T10:00:00Z",
  "filters": {
    "cities": ["Харьков", "Львов"],
    "birthDateFrom": "1990-01-01",
    "birthDateTo": "2000-12-31",
    "registrationDateFrom": "2023-01-01",
    "registrationDateTo": "2023-12-31",
    "allUsers": false
  }
}
```

**Параметры фильтров:**
- `cities` - массив городов (поиск по адресу)
- `birthDateFrom` - дата рождения от (YYYY-MM-DD)
- `birthDateTo` - дата рождения до (YYYY-MM-DD)
- `registrationDateFrom` - дата регистрации от (YYYY-MM-DD)
- `registrationDateTo` - дата регистрации до (YYYY-MM-DD)
- `allUsers` - отправить всем пользователям (true/false)

**Ответ:**
```json
{
  "success": true,
  "notification": {
    "id": 1,
    "title": "Скидка 20% в Харькове!",
    "message": "Специальное предложение для жителей Харькова",
    "status": "pending",
    "userCount": 150,
    "targetUsers": [...],
    "created_at": "2024-01-15T10:00:00Z"
  },
  "message": "Уведомление создано для 150 пользователей"
}
```

---

### 3. Предварительный просмотр целевых пользователей
```http
POST /api/admin/push-notifications/preview-targets
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "filters": {
    "cities": ["Харьков"],
    "birthDateFrom": "1990-01-01"
  }
}
```

**Ответ:**
```json
{
  "success": true,
  "targetUsers": [
    {
      "id": 1,
      "phone": "+380501234567",
      "full_name": "Иван Петров",
      "address": "Харьков, ул. Примерная, 1",
      "birth_date": "1990-01-01",
      "created_at": "2023-01-15T10:00:00Z"
    }
  ],
  "count": 1,
  "message": "Найдено 1 пользователей по заданным фильтрам"
}
```

---

### 4. Получение всех уведомлений
```http
GET /api/admin/push-notifications
Authorization: Bearer <admin_token>
```

**Ответ:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "title": "Скидка 20% в Харькове!",
      "message": "Специальное предложение для жителей Харькова",
      "status": "sent",
      "scheduled_at": "2024-01-15T10:00:00Z",
      "sent_at": "2024-01-15T10:00:00Z",
      "created_at": "2024-01-15T10:00:00Z",
      "created_by_name": "Администратор",
      "target_users": "{\"filters\":{\"cities\":[\"Харьков\"]},\"userCount\":4}"
    }
  ]
}
```

---

### 5. Детальная статистика уведомления
```http
GET /api/admin/push-notifications/1/stats
Authorization: Bearer <admin_token>
```

**Ответ:**
```json
{
  "success": true,
  "stats": {
    "id": 1,
    "title": "Скидка 20% в Харькове!",
    "message": "Специальное предложение для жителей Харькова",
    "status": "sent",
    "total_sent": "150",
    "read_count": "45",
    "unread_count": "105",
    "created_by_name": "Администратор",
    "created_at": "2024-01-15T10:00:00Z",
    "sent_at": "2024-01-15T10:00:00Z"
  }
}
```

---

### 6. Отправка уведомления
```http
POST /api/admin/push-notifications/1/send
Authorization: Bearer <admin_token>
```

**Ответ:**
```json
{
  "success": true,
  "notification": {
    "id": 1,
    "status": "sent",
    "sent_at": "2024-01-15T10:00:00Z"
  },
  "message": "Уведомление отправлено"
}
```

---

### 7. Обновление уведомления
```http
PUT /api/admin/push-notifications/1
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Обновленный заголовок",
  "message": "Обновленное сообщение",
  "scheduledAt": "2024-01-16T10:00:00Z"
}
```

---

### 8. Удаление уведомления
```http
DELETE /api/admin/push-notifications/1
Authorization: Bearer <admin_token>
```

**Ответ:**
```json
{
  "success": true,
  "message": "Push-уведомление удалено"
}
```

---

## 👤 Пользовательские эндпоинты

### 1. Авторизация пользователя

#### Запрос кода
```http
POST /api/auth/request-code
Content-Type: application/json

{
  "phone": "+380501234567",
  "pushToken": "firebase_push_token_here"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Код отправлен пуш-уведомлением"
}
```

#### Верификация кода
```http
POST /api/auth/verify-code
Content-Type: application/json

{
  "phone": "+380501234567",
  "code": "19483"
}
```

**Ответ:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "phone": "+380501234567",
    "full_name": "Иван Петров",
    "card_number": "1234567890",
    "birth_date": "1990-01-01",
    "email": "ivan@example.com",
    "address": "Харьков, ул. Примерная, 1"
  }
}
```

---

### 2. Получение уведомлений (за последний месяц)
```http
GET /api/user/notifications?limit=20&offset=0
Authorization: Bearer <user_token>
```

**Параметры:**
- `limit` - количество уведомлений (по умолчанию 50)
- `offset` - смещение для пагинации (по умолчанию 0)

**Ответ:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "title": "Скидка 20% в Харькове!",
      "message": "Специальное предложение для жителей Харькова",
      "is_read": false,
      "sent_at": "2024-01-15T10:00:00Z",
      "read_at": null,
      "created_at": "2024-01-15T10:00:00Z",
      "created_by_name": "Администратор"
    }
  ],
  "unreadCount": 3,
  "stats": {
    "total": 5,
    "unread": 3,
    "read_count": 2,
    "last_week": 1,
    "last_month": 5
  },
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

---

### 3. Получение уведомлений за последние 4 недели
```http
GET /api/user/notifications/last-4-weeks?limit=20&offset=0
Authorization: Bearer <user_token>
```

**Ответ:** Аналогично предыдущему, но только за последние 4 недели.

---

### 4. Получение конкретного уведомления
```http
GET /api/user/notifications/1
Authorization: Bearer <user_token>
```

**Ответ:**
```json
{
  "success": true,
  "notification": {
    "id": 1,
    "title": "Скидка 20% в Харькове!",
    "message": "Специальное предложение для жителей Харькова",
    "is_read": false,
    "sent_at": "2024-01-15T10:00:00Z",
    "read_at": null,
    "created_at": "2024-01-15T10:00:00Z",
    "created_by_name": "Администратор"
  }
}
```

---

### 5. Отметить уведомление как прочитанное
```http
PUT /api/user/notifications/1/read
Authorization: Bearer <user_token>
```

**Ответ:**
```json
{
  "success": true,
  "message": "Уведомление отмечено как прочитанное",
  "notification": {
    "id": 1,
    "is_read": true,
    "read_at": "2024-01-15T12:00:00Z"
  }
}
```

---

### 6. Отметить все уведомления как прочитанные
```http
PUT /api/user/notifications/read-all
Authorization: Bearer <user_token>
```

**Ответ:**
```json
{
  "success": true,
  "message": "Отмечено как прочитанные: 5 уведомлений",
  "count": 5
}
```

---

### 7. Получить статистику уведомлений пользователя
```http
GET /api/user/notifications/stats
Authorization: Bearer <user_token>
```

**Ответ:**
```json
{
  "success": true,
  "stats": {
    "total": 10,
    "unread": 3,
    "read_count": 7,
    "last_week": 2,
    "last_month": 10,
    "unreadCount": 3
  }
}
```

---

## 🎯 Примеры использования

### Пример 1: Рассылка для клиентов из Харькова
```json
{
  "title": "Скидка в Харькове!",
  "message": "Специальные цены для жителей Харькова",
  "filters": {
    "cities": ["Харьков"]
  }
}
```

### Пример 2: Рассылка для молодых клиентов
```json
{
  "title": "Новая коллекция для молодежи",
  "message": "Посмотрите нашу новую коллекцию",
  "filters": {
    "birthDateFrom": "1995-01-01",
    "birthDateTo": "2005-12-31"
  }
}
```

### Пример 3: Рассылка для новых клиентов
```json
{
  "title": "Добро пожаловать!",
  "message": "Спасибо за регистрацию в нашем приложении",
  "filters": {
    "registrationDateFrom": "2024-01-01"
  }
}
```

### Пример 4: Комбинированная рассылка
```json
{
  "title": "Специальное предложение",
  "message": "Только для молодых клиентов из Киева",
  "filters": {
    "cities": ["Киев"],
    "birthDateFrom": "1990-01-01",
    "birthDateTo": "2000-12-31",
    "registrationDateFrom": "2023-01-01"
  }
}
```

### Пример 5: Рассылка для всех
```json
{
  "title": "Важное объявление",
  "message": "Информация для всех наших клиентов",
  "filters": {
    "allUsers": true
  }
}
```

---

## 📊 Коды ошибок

### Общие ошибки
- `400` - Неверные параметры запроса
- `401` - Неверный токен авторизации
- `404` - Ресурс не найден
- `500` - Внутренняя ошибка сервера

### Специфичные ошибки
- `"Неверный формат кода"` - Код авторизации должен быть 5-значным числом
- `"Код истек"` - Код авторизации истек (действует 10 минут)
- `"Неверный код"` - Введен неверный код авторизации
- `"Не найдено пользователей по заданным фильтрам"` - Нет пользователей, соответствующих критериям

---

## 🔧 Технические детали

### Авторизация
- **Админы**: JWT токен с `adminId` в payload
- **Пользователи**: JWT токен с `userId` в payload
- **Коды**: 5-значные числа, действуют 10 минут

### Пагинация
- По умолчанию: `limit=50`, `offset=0`
- Максимальный лимит: 100
- Поле `hasMore` указывает есть ли еще данные

### Фильтрация
- **По городам**: поиск по полю `address` (ILIKE)
- **По дате рождения**: диапазон дат
- **По дате регистрации**: диапазон дат
- **Комбинированные**: все условия объединяются через AND

### Статистика
- **Админская**: общая статистика по уведомлению
- **Пользовательская**: персональная статистика
- **Автоматическая очистка**: уведомления старше месяца удаляются
