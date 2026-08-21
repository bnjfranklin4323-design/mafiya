# 👻 Ghost Mafia — To'liq loyiha

Real vaqtli ko'p kishilik Mafia o'yini. Neon ko'k/qizil, qora fon, glassmorphism dizayn.

## Xususiyatlar

### 🔐 Autentifikatsiya
- Ro'yxatdan o'tish / Kirish (JWT + bcrypt)
- Avatar tanlash (12 ta emoji avatar)
- Avatar o'zgartirish (profildan)

### 🎮 O'yin mexanikasi
| Rol | Vazifa |
|---|---|
| 🔫 Mafia | Kechasi odam o'ldiradi |
| 🎩 Don | Mafia rahbari — detektivga ko'rinmaydi |
| 🔍 Detektiv | Kechasi kimdirni tekshiradi (mafia yoki yo'q) |
| 🩺 Doktor | Kechasi kimdirni qutqaradi |
| 🎯 Snipper | Kunduzi bir marta o'q uzadi |
| 🛡️ Qo'riqchi | Mafiyadan himoya qiladi, o'zi halok bo'ladi |
| 🃏 Joker | Osılsa — hamma yutqazadi |
| 🔪 Maniac | Yolg'iz qolsa yutadi |
| 🕯️ Fuqaro | Ovoz berish orqali mafialni topadi |

### 🌙 Kecha Fazasi (30 soniya)
- Mafia/Don nishon tanlaydi
- Doktor himoya qiladi
- Detektiv tekshiradi
- Qo'riqchi himoya qiladi (o'zi halok bo'lishi mumkin)
- Kecha oxirida natijalar e'lon qilinadi

### ☀️ Kunduz Fazasi (90 soniya)
- Kim o'lganligi e'lon qilinadi
- Barcha chat qiladi va muhokama qiladi
- Snipper bu vaqtda o'q uzishi mumkin

### 🗳️ Ovoz Berish (40 soniya)
- Har bir tirik o'yinchi birovga ovoz beradi
- Ko'p ovoz olgan osıladi
- Joker osılsa — hamma yutqazadi
- G'alaba shartlari tekshiriladi

### 💬 Chat Tizimi
- **Xona chati** — faqat tirik o'yinchilar
- **Global chat** — barcha foydalanuvchilar
- **O'lganlar chati** — faqat halok bo'lganlar
- Emoji picker (15 ta emoji)

### 🎤 Ovozli Chat (WebRTC)
- P2P ovoz aloqasi (STUN server orqali)
- Mikrofon yoqish/o'chirish
- Gapirish indikatori

### ⚙️ Admin Panel (Host uchun)
- Rollar sonini sozlash (slider orqali)
- O'yinchilarni kick/mute qilish
- Xona sozlamalari

### 👤 Profil
- Daraja va XP progress-bar
- Tangalar
- G'alaba/Mag'lubiyat statistikasi
- Rollar bo'yicha statistika (to'planib boradi)
- Do'stlar tizimi (frontend tayyor)

## Ishga tushirish

### Talablar
- Node.js 18+
- MongoDB (mahalliy yoki Atlas)

### Backend

```bash
cd server
cp .env.example .env
# .env ichidagi MONGO_URI va JWT_SECRET ni to'ldiring

npm install
npm run dev
# Yoki production: npm start
```

### Frontend

```bash
cd client
cp .env.example .env
# .env ichida VITE_API_URL=http://localhost:5000/api
# va VITE_SOCKET_URL=http://localhost:5000

npm install
npm run dev
# Production build: npm run build
```

## Papka tuzilishi

```
ghost-mafia/
├── client/
│   └── src/
│       ├── pages/        AuthPage, LobbyPage, ProfilePage, RoomPage
│       ├── components/   NavBar, Avatar, FogBackground, ChatPanel,
│       │                 PlayerCard, RoleCard, PhaseBanner,
│       │                 VoiceChat, AdminPanel, GameResult
│       ├── hooks/        useRoom.js (barcha socket eventlarini boshqaradi)
│       ├── context/      AuthContext.jsx
│       └── api/          axios.js, socket.js
│
└── server/
    ├── routes/      authRoutes.js, roomRoutes.js
    ├── controllers/ authController.js, roomController.js
    ├── models/      User.js, Room.js, Message.js
    ├── middleware/  auth.js (JWT)
    ├── sockets/     index.js (barcha eventlar), gameEngine.js, gameStore.js
    └── database/    connect.js
```

## Production Deploy (VPS)

```bash
# Nginx konfiguratsiya
server {
    listen 80;
    server_name ghostmafia.uz;
    location / { root /var/www/ghost-mafia/client/dist; try_files $uri /index.html; }
    location /api { proxy_pass http://localhost:5000; }
    location /socket.io { proxy_pass http://localhost:5000; proxy_http_version 1.1; 
      proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; }
}

# PM2 bilan backend
pm2 start server/server.js --name ghost-mafia

# HTTPS (Let's Encrypt)
certbot --nginx -d ghostmafia.uz
```

## Texnologiyalar
| Qatlam | Stack |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v4, Framer Motion, React Router v6 |
| Real vaqt | Socket.IO 4 (klient + server) |
| Backend | Node.js, Express 5, Socket.IO, JWT, bcryptjs |
| Ma'lumotlar bazasi | MongoDB + Mongoose |
| Voice | WebRTC P2P mesh (Google STUN) |
| Dizayn | Cinzel + Space Grotesk, neon glassmorphism |
