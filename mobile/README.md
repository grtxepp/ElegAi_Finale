# ElegAI Mobile App (React Native / Expo)

A **real native mobile app** version of ElegAI — the same backend and AI engine as the web app,
with a phone-native UI: bottom tab bar, native navigation, image picker for the AI stylist photo,
and session persistence.

## How it works

```
ElegAI Mobile (React Native + Expo)
        │  HTTP (REST + JWT)
        ▼
Express REST API (the same backend/ folder)
        ▼
MySQL + AI Recommendation Service
```

The mobile app is a **separate client** for the same API — it does not duplicate any business
logic. Everything you learn fixing the API, the AI prompts, or the database applies to both apps.

## Folder layout

```
mobile/
├── App.js                    # navigation shell (stack + bottom tabs)
├── app.json                  # Expo config: name, icons, splash
├── assets/                   # app icon, adaptive icon, splash
└── src/
    ├── config.js             # ⚠️ API_BASE — point this at your backend
    ├── theme.js              # ivory / charcoal / gold design tokens
    ├── api.js                # axios client + JWT interceptor
    ├── utils.js              # formatPeso, dates, image URLs
    ├── components.js         # reusable UI (buttons, chips, cards, states)
    ├── context/
    │   ├── AuthContext.js    # login/register/logout + session restore
    │   └── CartContext.js    # cart state synced with the API
    └── screens/
        ├── LoginScreen.js
        ├── RegisterScreen.js
        ├── ForgotPasswordScreen.js
        ├── HomeScreen.js             # hero + categories + featured
        ├── CatalogScreen.js          # search + filters + grid
        ├── ProductScreen.js          # details + size + qty + add to cart
        ├── StylistScreen.js          # ✨ AI stylist (photo picker + recommendations)
        ├── CartScreen.js
        ├── CheckoutScreen.js
        ├── OrdersScreen.js
        ├── OrderDetailScreen.js      # tracking timeline + cancel
        ├── ProfileScreen.js          # account + style preferences
        └── AccountScreen.js          # user hub + menu
```

## Run it on your phone (no Android Studio needed!)

Requirements: **Node.js 18+** (your laptop) and the free **Expo Go** app on your phone
(Android: Play Store · iPhone: App Store). That's it — no Android SDK, no Xcode, no builds.

### 1. Start the backend

```bash
cd elegai/backend
npm install
npm start          # API on :5000
```

(Requires MySQL running with the `elegai` database — see the main README / setup.sh.)

### 2. Point the app at your backend

Edit **`mobile/src/config.js`**:

```js
// Android emulator on the same PC:
export const API_BASE = 'http://10.0.2.2:5000';
// Physical phone (phone + laptop on the same Wi-Fi):
export const API_BASE = 'http://<YOUR-LAPTOP-LAN-IP>:5000';
```

Find your laptop's LAN IP: Windows `ipconfig` → "IPv4 Address"; Mac `ipconfig getifaddr en0`;
Linux `hostname -I`.

### 3. Start Expo and scan the QR code

```bash
cd elegai/mobile
npm install
npx expo start
```

A QR code appears in the terminal. Open **Expo Go** on your phone → **Scan QR code**.
The app loads on your phone in seconds. Any change you save to the code reloads instantly (hot reload).

## Learning map (study order)

1. `src/config.js` + `src/api.js` — how the app talks to the backend (JWT).
2. `src/context/AuthContext.js` — sessions, login/logout flow.
3. `App.js` — navigation: stack screens vs bottom tabs.
4. `src/screens/CatalogScreen.js` + `ProductScreen.js` — the shopping flow.
5. `src/screens/StylistScreen.js` — the AI feature (multipart upload + recommendations).
6. `src/theme.js` + `src/components.js` — design system (same palette as the web app).

## Building a standalone APK (later, when you're ready)

You do NOT need this to study — Expo Go is enough. When you eventually want a real `.apk`
you can install without Expo Go, use **EAS Build** (Expo's cloud builds — your 4GB laptop never
touches Android SDK):

```bash
npx expo install expo-dev-client
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

Expo's free tier is fine for this. Details: https://docs.expo.dev/build/introduction/
