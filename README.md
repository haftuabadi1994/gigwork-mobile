# GigWork Mobile — Expo React Native App

The worker-facing mobile app for GigWork. Runs on Android, iOS and web via Expo.

---

## Setup

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (Android/iOS)

### Install & run

```bash
cd gigwork-mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone.

---

## Connect to your backend

Open `src/utils/api.js` and update the IP:

```js
export const API_BASE = 'http://10.10.3.209:5000/api';
//                              ↑ Your PC's LAN IP
```

Also update `src/screens/home/InviteScreen.js`:
```js
const API_IP = '10.10.3.209';
```

---

## Screens

| Screen              | Route / Tab        | Description |
|---------------------|--------------------|-------------|
| Login               | Auth               | JWT login with SecureStore |
| Register            | Auth               | Sign up with referral code validation |
| Home                | Tab: Home          | Task feed, income snapshot, notifications bell |
| Task Detail         | Stack → Home       | Accept/submit/complete + YouTube trailer embed |
| My Tasks            | Tab: Tasks         | Progress tracking, status filter |
| Wallet              | Tab: Wallet        | Dual wallet (income + personal), withdraw |
| Deposit             | Stack → Wallet     | 4 methods, account details, receipt upload |
| Team                | Tab: Team          | Tier A/B/C tree, leaderboard |
| Profile             | Tab: Profile       | Personal info, notification prefs, security |
| Notifications       | Stack → Home       | Real-time alerts, mark read |
| Income Dashboard    | Stack → Home       | Today/week/month earnings, charts |
| Handbook            | Stack → Home       | Employee guide + level rules |
| Invite              | Stack → Team       | WhatsApp/Telegram/SMS/Email share + QR code |
| Records             | Stack → Wallet     | Transaction log + task log |
| Referral            | Stack → Home       | Referral code, bonus history, how it works |

---

## Test accounts (after seed)

| Role   | Email             | Password     |
|--------|-------------------|--------------|
| Worker | worker@gigwork.et | worker123456 |
| Admin  | admin@gigwork.et  | admin123456  |

---

## Build for Android APK

```bash
npx expo build:android
# or with EAS:
npm install -g eas-cli
eas build -p android --profile preview
```
