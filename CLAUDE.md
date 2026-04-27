# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VIP Lao Insight is a Nuxt 4 (Vue 3) lottery analysis and prediction application for Lao lottery. It uses Firebase for authentication and data storage, with server-side API endpoints for web scraping lottery results from racha-lotto.net. The app features AI-powered predictions, dream interpretation, and accuracy tracking.

**Key Technologies:**
- Nuxt 4 with Vue 3 and TypeScript
- Tailwind CSS for styling
- Firebase (Authentication + Firestore)
- Puppeteer for web scraping
- Vercel for deployment (region: sin1)

## Essential Commands

### Development
```bash
npm run dev              # Start dev server at localhost:3000
npm run build            # Build for production
npm run preview          # Preview production build locally
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
```

### Firebase Deployment
```bash
firebase deploy --only firestore:rules    # Deploy Firestore rules
firebase deploy --only firestore:indexes  # Deploy Firestore indexes
```

## Architecture

### Rendering Strategy
- **SSR Mode**: Enabled at root level for server API endpoints
- **Client-side Rendering**: All pages (`/**`) are rendered client-side (SPA mode)
- **API Routes**: Server-side at `/api/**` with CORS enabled

This hybrid approach allows:
- Server API endpoints to run on Vercel serverless functions
- Pages to work as a SPA with client-side routing and Firebase auth

### Directory Structure

```
src/
├── pages/           # Page components (auto-routed)
├── layouts/         # Layout wrapper (main.vue)
├── composables/     # Vue composables for shared logic
├── components/      # Reusable Vue components
├── plugins/         # Nuxt plugins (firebase.ts)
└── assets/css/      # Global CSS and Tailwind

server/
└── api/             # Server-side API endpoints
    ├── lottery/     # Lottery scraping endpoints
    └── balance/     # Balance fetching endpoints

app/
└── app.vue          # Root app component
```

### Key Pages
- `/` (index.vue) - Redirect to home
- `/home` - Main lottery analysis page with hot numbers
- `/login` - Firebase authentication (Google OAuth)
- `/admin` - Admin dashboard for lottery data management
- `/two-digit` - Two-digit prediction system
- `/compare` - Compare numbers and analyze results
- `/dream` - Dream interpretation for lottery numbers
- `/accuracy` - Accuracy tracking for predictions
- `/stats` - Login statistics (admin only)

### Composables Architecture

**Core Prediction & Analysis:**
- `useLaoFormulaAdvanced.ts` - Advanced multi-dimensional lottery analysis using frequency weighting, pair analysis, and position patterns
- `useLaoFormula.ts` - Basic lottery calculation formulas
- `usePatternRecognition.ts` - Pattern recognition for number sequences
- `useTwoDigitPrediction.ts` - Two-digit number prediction system
- `useDreamPrediction.ts` - Dream interpretation to lottery numbers

**Data Management:**
- `useLotteryFetcher.ts` - Fetches lottery results from racha-lotto.net API via server endpoints, stores in Firestore
- `useLotteryType.ts` - Manages lottery type selection (government, savings, BAAC, etc.)
- `useVipResult.ts` - Manages VIP result calculations and storage per lottery type
- `useAccuracyTracking.ts` - Tracks prediction accuracy over time

**User & Authentication:**
- `useAuth.ts` - Firebase authentication wrapper
- `useAdmin.ts` - Admin role checking (email: noipugsa@gmail.com)
- `useLoginStats.ts` - Login history tracking in Firestore
- `useBalance.ts` - Fetches user balance from racha-lotto.net via server API

**UI State:**
- `useEngineSettings.ts` - User preferences for prediction engine
- `useVipPopup.ts` - VIP popup state management

### Server API Endpoints

**Lottery Data (`/api/lottery/`):**
- `fetch.ts` - Proxy endpoint to fetch lottery results from racha-lotto.net, tries multiple API endpoints
- `scrape.ts` - Puppeteer-based web scraping (fallback method)
- `demo.ts` - Demo/test endpoint

**Balance Data (`/api/balance/`):**
- `fetch.ts` - Fetches user balance from racha-lotto.net using HTTP first, Puppeteer as fallback
- `test-login.ts` - Test login functionality

### Firebase Setup

**Configuration:**
- Project ID: `kinetic-abbey-408904`
- Plugin: `src/plugins/firebase.ts` provides `$firebase`, `$auth`, `$db` to all components
- Auth: Google Sign-In with OAuth setup (see GOOGLE_SIGNIN_SETUP.md)

**Firestore Collections:**
- `login_history` - User login tracking (write: authenticated users, read: admin only)
- `lotteryResults` - Lottery results storage (read/write: authenticated users)

**Security:**
- Admin email: `noipugsa@gmail.com` (has full access)
- All other users need authentication for read/write
- Rules defined in `firestore.rules`

### Lottery Type System

The app supports multiple lottery types, each with isolated data storage:
- Government lottery
- Savings lottery
- BAAC lottery
- Others

Data is stored in localStorage with keys like `vip_lao_history_{lotteryType}` to maintain separate histories per type.

### Web Scraping Notes

**Challenges:**
- racha-lotto.net is a SPA, making direct HTTP requests difficult
- The site may require login or have bot protection
- See PUPPETEER_LIMITATIONS.md for Vercel serverless constraints

**Strategy:**
1. Try HTTP requests first (fast, low resource)
2. Fall back to Puppeteer if HTTP fails
3. Use mock data for development (`?mock=true`)
4. Manual entry available in admin panel as last resort

## Important Files

- `nuxt.config.ts` - Nuxt configuration with SSR/SPA routing rules
- `vercel.json` - Vercel deployment config (framework: nuxtjs, region: sin1, Node 20)
- `firebase.json` - Firebase configuration
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore indexes

## Development Workflow

1. **Adding New Lottery Analysis Features:**
   - Create composable in `src/composables/` following the naming pattern `useLao*.ts`
   - Use weighted frequency analysis for recent results (see `useLaoFormulaAdvanced.ts`)
   - Store per-lottery-type data in localStorage with keys: `vip_lao_*_{lotteryType}`

2. **Adding New Pages:**
   - Create `.vue` file in `src/pages/`
   - Use `<NuxtLayout name="main">` wrapper
   - Import composables: `useAuth()`, `useLotteryType()`, etc.
   - Check auth with `waitForAuth()` before accessing user data

3. **Creating Server API Endpoints:**
   - Add to `server/api/` directory
   - Use `defineEventHandler()` from `h3`
   - Handle CORS for external requests
   - Return JSON with `{ success: boolean, data?: any, message?: string }` format

4. **Working with Firestore:**
   - Use `$db` from `useNuxtApp()` to get Firestore instance
   - Collections: `login_history`, `lotteryResults`
   - Always check authentication before writes
   - Use `waitForAuth()` to ensure user is loaded

5. **Styling:**
   - Uses Tailwind CSS utility classes
   - Thai language UI
   - Gradient backgrounds common (purple/blue theme)
   - Mobile-responsive design

## Deployment

- **Platform:** Vercel
- **Region:** sin1 (Singapore)
- **Framework Preset:** Nuxt.js
- **Node Version:** 20
- **Build Command:** `npm run build`
- **Output Directory:** `.output/public`

## Documentation Reference

- `SETUP_SUMMARY.md` - Setup guide for lottery fetcher system
- `LOTTERY_FETCHER_GUIDE.md` - Detailed guide for lottery data fetching
- `GOOGLE_SIGNIN_SETUP.md` - Google OAuth setup instructions
- `OAUTH_DOMAIN_FIX.md` - OAuth domain configuration fixes
- `PUPPETEER_LIMITATIONS.md` - Puppeteer constraints on Vercel
- `HOW_TO_FIND_API.md` - Guide for finding lottery APIs
- `TROUBLESHOOTING.md` - Common issues and solutions
