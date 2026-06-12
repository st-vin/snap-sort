# SnapSort

AI-powered screenshot organiser built with Expo React Native + Express + Gemini 2.5 Flash-Lite.

Pick screenshots from your camera roll → Gemini classifies and extracts text → browse a searchable dark-themed grid with category filter pills, detail sheet, retry, and long-press delete.

---

## Project Structure

```
react-native-app/
├── snapsort/               # Expo React Native app
│   ├── app/                # Expo Router screens
│   │   ├── _layout.tsx     # Root layout, providers
│   │   ├── +not-found.tsx
│   │   └── (tabs)/
│   │       ├── _layout.tsx
│   │       └── index.tsx   # Home screen (grid, search, FAB)
│   ├── assets/images/      # App icons and splash
│   ├── components/         # Reusable UI components
│   │   ├── DetailSheet.tsx       # Animated bottom sheet
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorFallback.tsx
│   │   ├── FAB.tsx               # Floating action button
│   │   ├── FilterPills.tsx       # Category filter row
│   │   ├── ScreenshotGridCard.tsx # Grid card (retry, long-press delete)
│   │   ├── SearchBar.tsx
│   │   └── UploadQueue.tsx       # Processing progress sheet
│   ├── constants/
│   │   ├── categories.ts   # Category metadata (icons, colours, labels)
│   │   └── colors.ts       # Dark theme design tokens
│   ├── context/
│   │   └── ScreenshotContext.tsx  # Global state, processImages, retryCard, deleteCard
│   ├── hooks/
│   │   └── useColors.ts    # Theme-aware colour hook
│   ├── services/
│   │   ├── geminiService.ts  # Calls POST /api/analyze
│   │   ├── imageService.ts   # expo-image-picker wrapper
│   │   └── storageService.ts # AsyncStorage persistence
│   ├── types/
│   │   └── index.ts         # ScreenshotCard, GeminiAnalysis, etc.
│   ├── app.json
│   ├── babel.config.js
│   ├── metro.config.js
│   └── tsconfig.json
│
├── api-server/             # Express backend — Gemini proxy
│   └── src/
│       ├── routes/
│       │   ├── analyze.ts  # POST /api/analyze → Gemini REST API
│       │   ├── health.ts   # GET /api/healthz
│       │   └── index.ts
│       ├── lib/logger.ts   # Pino logger singleton
│       ├── app.ts          # Express app (CORS, body-parser 20 MB)
│       └── index.ts        # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── .env.example            # Required environment variables
└── README.md
```

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** or **pnpm**
- A **Gemini API key** — free at https://aistudio.google.com/apikey
- **Expo Go** app on your phone (optional) or an iOS/Android simulator

---

## Quick Start

### 1. Clone / extract the project

```bash
unzip react-native-app.zip
cd react-native-app
```

### 2. Set up the API server

```bash
cd api-server
npm install          # or: pnpm install
```

Copy the example env file and fill in your key:

```bash
cp ../.env.example .env
# Edit .env — set GEMINI_API_KEY and PORT (default 3001)
```

Start the server:

```bash
npm run dev          # uses tsx for hot-reload
```

The server will be running at `http://localhost:3001`.

### 3. Set up the Expo app

Open a new terminal:

```bash
cd snapsort
npm install          # or: pnpm install
```

Create a `.env` file in the `snapsort/` folder:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

> **Physical device?** Replace `localhost` with your machine's local IP (e.g. `192.168.1.42`).

Start Expo:

```bash
npm start
```

Scan the QR code with Expo Go (Android/iOS) or press `w` for the web preview.

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `GEMINI_API_KEY` | `api-server/.env` | Gemini API key from Google AI Studio |
| `PORT` | `api-server/.env` | Port for the Express server (default `3001`) |
| `EXPO_PUBLIC_API_URL` | `snapsort/.env` | Base URL of the running API server |

---

## Features

- **AI Analysis** — Gemini 2.5 Flash-Lite classifies each screenshot (tweet, article, recipe, product, code, receipt, meme, chat, etc.) and extracts text + a summary
- **Dark-theme grid** — Responsive 2-column masonry grid that adapts to any screen size
- **Search** — Full-text search across title, tags, extracted text, and summary
- **Category filters** — Horizontal filter pills, only showing categories that exist in your library
- **Retry** — Tap the Retry button on any failed card to re-analyse without re-picking
- **Long-press delete** — Hold any card → confirmation prompt → removes from library and storage
- **Detail sheet** — Swipeable bottom sheet showing the full image, AI summary, extracted text with copy button, and tags
- **Upload queue** — Animated progress sheet showing each image as it is analysed
