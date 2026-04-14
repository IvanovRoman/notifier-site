# 🔔 Notifier Site — Push-уведомления через Firebase

Сайт для получения push-уведомлений в браузере. Замена Telegram-боту.

**Стек:** Next.js + Firebase Cloud Messaging + Vercel

---

## 🚀 Быстрый старт

### 1. Настройка Firebase

1. Откройте [Firebase Console](https://console.firebase.google.com)
2. Создайте новый проект (или используйте существующий)
3. Перейдите в **Project Settings → General**
4. В разделе **Your apps** добавьте Web-приложение (`</>` иконка)
5. Скопируйте конфигурацию Firebase

### 2. Включите Cloud Messaging

1. В Firebase Console перейдите в **Project Settings → Cloud Messaging**
2. В разделе **Web Push certificates** сгенерируйте ключ (VAPID key)
3. Скопируйте этот ключ

### 3. Скачайте Service Account Key

1. Перейдите в **Project Settings → Service Accounts**
2. Нажмите **Generate new private key**
3. Откройте скачанный JSON файл
4. Скопируйте значения `project_id`, `client_email`, `private_key`

### 4. Создайте Firestore Database

1. В Firebase Console перейдите в **Firestore Database**
2. Нажмите **Create database** → Start in **test mode**
3. Создайте составной индекс для коллекции `notifications`:
   - Поля: `createdAt` (Descending)
   - Это можно сделать автоматически при первом запросе или вручную в Firebase Console

### 5. Настройте переменные окружения

```bash
cp .env.local.example .env.local
```

Заполните `.env.local` вашими данными из Firebase:

```env
# Client (из Project Settings → General → Your apps → Web app)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXX

# VAPID Key (из Cloud Messaging → Web Push certificates)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BLxxx...

# Admin (из Service Account JSON)
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# Придумайте случайный API ключ для отправки уведомлений
ADMIN_API_KEY=my-super-secret-key-12345
```

### 6. Обновите Service Worker

Откройте `public/firebase-messaging-sw.js` и вставьте вашу Firebase конфигурацию:

```javascript
firebase.initializeApp({
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
});
```

### 7. Добавьте иконки

Поместите в папку `public/`:
- `icon-192.png` — иконка 192x192px
- `icon-512.png` — иконка 512x512px

### 8. Запуск локально

```bash
npm install
npm run dev
```

Откройте http://localhost:3000

---

## 📡 Отправка уведомлений

Для отправки уведомления выполните POST-запрос:

```bash
curl -X POST https://your-site.vercel.app/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer my-super-secret-key-12345" \
  -d '{"title": "Заголовок", "body": "Текст уведомления"}'
```

### Пример на Python

```python
import requests

requests.post("https://your-site.vercel.app/api/send", 
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer my-super-secret-key-12345"
    },
    json={
        "title": "Уведомление",
        "body": "Привет! Это тестовое уведомление."
    }
)
```

### Пример на Node.js

```javascript
fetch("https://your-site.vercel.app/api/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer my-super-secret-key-12345",
  },
  body: JSON.stringify({
    title: "Уведомление",
    body: "Привет! Это тестовое уведомление.",
  }),
});
```

---

## 🌐 Деплой на Vercel

### Вариант 1: Через GitHub

1. Инициализируйте git и отправьте код на GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/you/notifier-site.git
   git push -u origin main
   ```

2. Откройте [vercel.com](https://vercel.com) и импортируйте репозиторий

3. Добавьте все переменные из `.env.local` в **Settings → Environment Variables**

4. Нажмите **Deploy**

### Вариант 2: Через Vercel CLI

```bash
npm i -g vercel
vercel
# Добавьте переменные окружения:
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# ... и так далее для каждой переменной
```

---

## 🔒 Firestore Rules

Установите следующие правила в Firebase Console → Firestore Database → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Токены — запись через API, чтение только сервером
    match /tokens/{tokenId} {
      allow read, write: if false; // доступ только через Admin SDK
    }
    // Уведомления — чтение для всех, запись через API
    match /notifications/{notifId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

---

## 📁 Структура проекта

```
notifier-site/
├── lib/
│   ├── firebase-client.ts    # Firebase клиент (браузер)
│   └── firebase-admin.ts     # Firebase Admin (сервер)
├── pages/
│   ├── _app.tsx              # Обёртка приложения
│   ├── _document.tsx         # HTML head с manifest
│   ├── index.tsx             # Главная страница
│   └── api/
│       ├── subscribe.ts      # Подписка/отписка токена
│       ├── send.ts           # Отправка уведомлений
│       └── notifications.ts  # Получение истории
├── public/
│   ├── firebase-messaging-sw.js  # Service Worker
│   ├── manifest.json              # PWA манифест
│   ├── icon-192.png
│   └── icon-512.png
├── styles/
│   ├── globals.css
│   └── Home.module.css
├── types/
│   └── css.d.ts
├── .env.local.example        # Шаблон переменных
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## 💡 Как это работает

1. Пользователь открывает сайт и нажимает «Подписаться»
2. Браузер запрашивает разрешение на уведомления
3. Firebase FCM генерирует уникальный токен
4. Токен сохраняется в Firestore через API
5. Ваш сервер отправляет POST на `/api/send` с текстом
6. API рассылает push-уведомления всем подписчикам
7. Service Worker в браузере показывает уведомление
8. Уведомление сохраняется в историю (Firestore)