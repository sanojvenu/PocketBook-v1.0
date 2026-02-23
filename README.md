<p align="center">
  <img src="assets/logo.png" alt="PocketBook Logo" width="120" height="120" style="border-radius: 20px;" />
</p>

<h1 align="center">💰 PocketBook</h1>

<p align="center">
  <strong>AI-Powered Personal Finance Manager</strong><br/>
  Track expenses, manage budgets, and get intelligent financial insights — all in one app.
</p>

## 🌐 Live

**Check it out live:** [web.mypocketbook.in](https://web.mypocketbook.in/)

> [!NOTE]
> The live site is currently optimized for users in **India**. However, the project is designed for global use — feel free to fork the repository, tweak the settings (currency, localization, AI prompts), and deploy a version tailored for your own country!

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/Capacitor-8-blue?logo=capacitor" alt="Capacitor" />
  <img src="https://img.shields.io/badge/AI-Gemini%202.5-purple?logo=google" alt="Gemini AI" />
</p>

---

## ✨ Features

### 📊 Dashboard & Analytics
- **Smart Insights** — AI-generated suggestions based on your spending habits
- **Financial Charts** — Visual breakdowns by category and monthly trends
- **Quick Actions** — One-tap logging for frequent expenses (coffee, groceries, fuel)

### 📒 Cashbook (Transactions)
- **Detailed Logging** — Track income and expenses with categories, tags, and dates
- **Smart Filtering** — Search, filter by date/category/tags, and sort transactions
- **Export** — Download transaction history as PDF or Excel

### ⏰ Reminders
- **Bill Tracking** — Recurring reminders (daily, weekly, monthly, yearly)
- **Swipe Actions** — Swipe to complete or edit on mobile
- **Auto-Link** — Marking a reminder as "Paid" automatically creates a transaction

### 🤖 AI Chat Assistant
- **Natural Language** — Ask _"How much did I spend on food?"_ or _"Remind me to pay rent on the 5th"_
- **Actionable** — The AI can create transactions and reminders directly from chat
- **Context-Aware** — Understands your financial history for relevant answers
- **Powered by Gemini 2.5** — Google's latest generative AI model

### 👤 Admin Dashboard
- **User Management** — View and manage registered users
- **Analytics** — Track signups, retention, and engagement metrics
- **Invite System** — Manage invite-based access

---

## 🛠 Tech Stack

| Layer            | Technology                                          |
|------------------|-----------------------------------------------------|
| **Frontend**     | Next.js 15 (App Router), React 19, Tailwind CSS     |
| **Backend**      | Firebase (Firestore, Authentication, Hosting)        |
| **Mobile**       | Capacitor 8 (Android native packaging)               |
| **AI**           | Google Generative AI SDK (Gemini 2.5 Flash Lite)     |
| **State**        | React Context + Custom Hooks                         |
| **Charts**       | Recharts                                             |
| **Animations**   | Framer Motion                                        |
| **Forms**        | React Hook Form + Zod validation                     |

---

## 📱 Platforms

- **Web** — Responsive Progressive Web App (PWA)
- **Android** — Full native experience with hardware back button, swipe gestures, push notifications, and splash screen

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org/))
- **Firebase Project** ([create one](https://console.firebase.google.com/))
- **Gemini API Key** ([get one](https://aistudio.google.com/app/apikey))
- **Java JDK 17** + **Android Studio** (for Android builds only)

### 1. Clone the Repository

```bash
git clone https://github.com/sanojvenu/PocketBook-v1.0.git
cd PocketBook-v1.0
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```env
# AI Integration
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Firebase Configuration (from Firebase Console > Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 4. Set Up Firebase

1. Create a [Firebase project](https://console.firebase.google.com/).
2. Enable **Authentication** → Phone sign-in method.
3. Enable **Firestore Database** in production mode.
4. Copy your web app config to `.env.local`.
5. Deploy Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🤖 Android Build

### 1. Set Up Android Signing

```bash
# Generate a release keystore
keytool -genkeypair -v -keystore android/app/release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias pb-key

# Create the keystore properties file
cp android/keystore.properties.example android/keystore.properties
# Edit android/keystore.properties with your passwords
```

### 2. Add Firebase for Android

1. In Firebase Console, add an **Android app** with package name `in.mypocketbook.pocketbook`.
2. Download `google-services.json` and place it in `android/app/`.
3. Add your SHA-1 and SHA-256 fingerprints for phone authentication.

### 3. Build and Run

```bash
# Build web assets
npm run build

# Sync with Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android
```

From Android Studio, run on an emulator or connected device.

---

## 📂 Project Structure

```
PocketBook-v1.0/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── cashbook/     # Cashbook (transactions) page
│   │   ├── reminders/    # Reminders page
│   │   ├── categories/   # Category management
│   │   ├── admin/        # Admin dashboard
│   │   └── connect/      # Social/connect features
│   ├── components/       # Reusable UI components
│   │   ├── admin/        # Admin-specific components
│   │   ├── cashbook/     # Transaction cards, filters, forms
│   │   ├── chat/         # AI chat interface components
│   │   ├── dashboard/    # Dashboard widgets, charts
│   │   └── reminders/    # Reminder cards, forms
│   ├── lib/              # Utilities (Firebase, AI service, dates)
│   ├── hooks/            # Custom React hooks
│   ├── context/          # React Context providers
│   ├── services/         # Business logic services
│   ├── config/           # App configuration
│   └── types/            # TypeScript type definitions
├── android/              # Capacitor Android project
├── assets/               # App icons and splash screens
├── public/               # Static assets (PWA manifest, etc.)
├── .env.example          # Environment variable template
└── capacitor.config.ts   # Capacitor configuration
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 🔒 Security

For reporting security vulnerabilities, please see [SECURITY.md](SECURITY.md).

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/sanojvenu">Sanoj Venu</a>
</p>
