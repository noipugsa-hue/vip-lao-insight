# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VIP Lao Insight is a Nuxt 4 (Vue 3) lottery analysis and prediction application for Thai government lottery. It uses Firebase for authentication and data storage, with server-side API endpoints for web scraping lottery results. The app features AI-powered predictions using gap analysis, frequency weighting, dream interpretation, and accuracy tracking.

**⚠️ Note:** VIP subscription payment system is currently in testing phase and NOT yet active for real transactions.

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
npm run generate         # Generate static site
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
```

### Firebase Deployment
```bash
firebase deploy --only firestore:rules    # Deploy Firestore rules
firebase deploy --only firestore:indexes  # Deploy Firestore indexes
```

## Architecture

### Rendering Strategy (SSR/SPA Hybrid)
- **SSR Mode**: Enabled at root level (`ssr: true` in nuxt.config.ts)
- **Client-side Rendering**: All pages (`/**`) render client-side via route rule `{ ssr: false }`
- **API Routes**: Server-side at `/api/**` with CORS enabled, run as Vercel serverless functions

**Why this hybrid approach:**
- Server API endpoints bypass CORS for web scraping racha-lotto.net and glo.or.th
- Pages work as pure SPA with client-side routing and Firebase authentication
- Firebase auth state management requires client-side hydration

### Directory Structure

```
src/
├── pages/              # Page components (auto-routed by Nuxt)
├── layouts/            # Layout wrappers (main.vue with sidebar navigation)
├── composables/        # Vue composables for shared logic
│   ├── useLaoFormulaAdvanced.ts    # Core prediction algorithm
│   ├── useLotteryFetcher.ts        # Data fetching layer
│   ├── useLotteryHistory.ts        # Government lottery results
│   ├── useVipResult.ts             # Prediction result storage
│   ├── useAccuracyTracking.ts      # Prediction accuracy metrics
│   ├── useAuth.ts                  # Firebase authentication
│   ├── useSubscription.ts          # VIP subscription management
│   └── ...
├── components/         # Reusable Vue components
├── plugins/            # Nuxt plugins (firebase.ts)
└── assets/css/         # Global CSS and Tailwind

server/
└── api/                # Server-side API endpoints
    ├── lottery/        # Lottery scraping endpoints
    │   ├── fetch.ts    # Multi-endpoint HTTP proxy
    │   ├── scrape.ts   # Puppeteer fallback
    │   ├── glo.ts      # Government lottery API
    │   └── demo.ts     # Mock data
    ├── balance/        # Balance fetching endpoints
    └── payment/        # Payment processing endpoints

app/
└── app.vue             # Root app component
```

### Key Pages
- `/login` - Firebase authentication (Email/Password + Google OAuth) with modern purple-blue-pink gradient theme
- `/home` - Main lottery analysis dashboard with hot/cold numbers, 2-digit, 3-digit predictions
- `/lottery-history` - Government lottery results history with period selection and prize checker
- `/check-prize` - Prize checking tool for purchased tickets
- `/my-numbers` - User's purchased lottery numbers tracking
- `/two-digit` - Two-digit (00-99) prediction system
- `/dream` - Dream interpretation to lottery numbers
- `/statistics` - Statistical analysis and charts
- `/accuracy` - Prediction accuracy tracking dashboard
- `/pricing` - VIP subscription plans
- `/payment` - VIP payment processing (testing phase)
- `/subscription` - Subscription management
- `/admin` - Admin dashboard for lottery data management (admin only)
- `/stats` - Login statistics and user analytics (admin only)

### Composables Architecture

#### **Core Prediction Algorithm (useLaoFormulaAdvanced.ts)**

The heart of the prediction system uses multi-dimensional analysis:

**Key Functions:**
- `analyzeFrequencyWithWeight()` - Exponential weighted frequency (recent draws weighted higher)
- `analyzeGaps()` - Gap analysis: tracks draws since last appearance for each digit
- `analyzeTwoDigitGap()` - Optimal 2-digit gap: 3-7 draws (highest probability zone)
- `analyzeThreeDigitGap()` - Optimal 3-digit gap: 3-8 draws (highest probability zone)
- `analyzePairs()` - Co-occurring digit pair analysis with weight decay
- `analyzePositions()` - Position-specific digit occurrence analysis
- `getAdvancedHotNumbers()` - Returns top 4 digits via 60% frequency + 40% gap scoring
- `getSmartColdNumbers()` - Identifies cold numbers (>10 draws since appearance)
- `generateSmartTwoDigits()` - Combines gap numbers + sequential patterns + hot pairs + random
- `generateSmartThreeDigits()` - Similar strategy for 3-digit predictions
- `calculateAdvanced()` - Main orchestration function

**Algorithm Flow:**
1. Load lottery history from localStorage (`vip_lao_history_{lotteryType}`)
2. Analyze via weighted frequency + gap scoring + pair analysis + position patterns
3. Generate predictions: hot numbers (4 digits), 2-digit (10 numbers), 3-digit (12 numbers)
4. Calculate confidence scores based on pattern strength
5. Store results via `useVipResult` → localStorage + Firestore
6. Track predictions via `useAccuracyTracking` for accuracy measurement

#### **Data Management Composables**

**useLotteryFetcher.ts** - Multi-source lottery data acquisition:
- `fetchFromRachaLotto()` - Tries 6 different API endpoints in sequence with validation
- `fetchFromScraper()` - Puppeteer fallback for SPA sites
- `saveToFirestore()` - Persists results with lottery type tagging
- `getLatestFromFirestore()` - Retrieves most recent result filtered by lottery type
- **Graceful degradation**: HTTP → Puppeteer → Mock data

**useLotteryHistory.ts** - Government lottery specific:
- `fetchLatestResult()` - Gets latest from glo.or.th API via `/api/lottery/glo`
- `fetchMultipleResults()` - Combines latest API result + historical Firestore data
- `saveResultToFirestore()` - Auto-saves to `governmentLottery` collection
- `checkNumber()` - Prize validation for 6-digit lottery tickets

**useVipResult.ts** - Prediction result storage:
- Stores: `{hotNumbers, twoDigits, threeDigits, lotteryType, calculatedAt}`
- Key: `vip_result` (single storage, lottery-type aware)
- Methods: `setResult()`, `loadResult()`, `clearResult()`

**useLotteryType.ts** - Multi-lottery support:
- Supported types: `government`, `savings`, `BAAC`, `lao-dev`, `lao-vip`, `lao-special`, `nikkei-vip-morning`, `dow-jones`, `hanoi`, `hanoi-vip`, `hanoi-special`, `hanoi-chaiyo`
- Key: `selected_lottery_type` in localStorage
- Per-type history: `vip_lao_history_{lotteryType}` pattern

**useAccuracyTracking.ts** - Prediction accuracy metrics:
- Stores: `PredictionRecord[]` in `accuracy_tracking` localStorage key
- Record structure: `{date, lotteryType, predictedNumbers, actualNumber, isCorrect, confidence}`
- Computes: overall accuracy %, statistics by confidence level (high/medium/low)

#### **User & Authentication Composables**

**useAuth.ts** - Firebase authentication wrapper:
- Methods: `login()`, `register()`, `logout()`, `loginWithGoogle()`, `waitForAuth()`
- Reactive state: `user`, `isAuthReady`
- Auth flow: `onAuthStateChanged` listener → updates `user` ref → triggers page re-renders
- **Critical**: Always call `waitForAuth()` before accessing user data in pages

**useAdmin.ts** - Role-based access control:
- Admin check: email in `['noipugsa@gmail.com']`
- Exposed as computed: `isAdmin`
- Used for: `/admin`, `/stats` page access + admin-only menu items

**useSubscription.ts** - VIP subscription management:
- Tracks: `isVIP`, `currentPlan`, `expirationDate`, `daysRemaining`
- Calculates urgency: `critical` (<3 days), `high` (<7 days), `normal` (>7 days)
- Shown in: sidebar user card + expiration warning banner in main.vue

**useBalance.ts** - User account balance:
- Fetches from `/api/balance/fetch` via HTTP → Puppeteer → Mock fallback
- Returns: `{balance, source, warning}`

**useLoginStats.ts** - Login analytics:
- Records login events to Firestore `login_history` collection
- Structure: `{uid, email, timestamp, deviceInfo}`

#### **UI State Composables**

**useDarkMode.ts** - Theme toggle:
- Stores preference in localStorage
- Applies `dark` class to document root

**useEngineSettings.ts** - Prediction engine preferences:
- User configuration for analysis methods

**useVipPopup.ts** - Modal state management:
- Controls VIP upgrade prompt visibility

### Server API Endpoints

#### **Lottery Data APIs** (`/server/api/lottery/`)

**fetch.ts** - Multi-endpoint HTTP proxy with validation:
```typescript
// Tries these endpoints in sequence:
1. https://www.racha-lotto.net/api/result-product/LA
2. https://api.racha-lotto.net/result-product/LA
3. https://www.racha-lotto.net/api/results/LA
4. https://api.racha-lotto.net/results/LA
5. https://www.racha-lotto.net/api/lao/latest
6. https://api.racha-lotto.net/lao/latest

// Response validation:
- Checks for HTML vs JSON
- Parses JSON safely with try-catch
- Normalizes various API response schemas to standard format

// Standard response:
{
  success: boolean,
  data?: {
    date: string,
    period: string,
    threeDigit: string,
    twoDigit: string,
    fourDigit: string,
    source: string,
    fetchedAt: string
  },
  message?: string,
  error?: string
}
```

**scrape.ts** - Puppeteer fallback for SPAs:
- Uses `puppeteer-core` + `chrome-aws-lambda` for Vercel compatibility
- Headless browser automation
- Waits for dynamic content rendering
- Extracts lottery numbers from rendered DOM

**glo.ts** - Government lottery specific:
- Fetches from official glo.or.th or rayriffy API
- Returns 6-digit lottery format with all prize categories
- Auto-saves to Firestore `governmentLottery` collection

**demo.ts** - Mock data endpoint:
- Returns test lottery data
- Used during development and API failures

#### **Balance Data APIs** (`/server/api/balance/`)

**fetch.ts** - Multi-method balance fetching:
```typescript
// Method 1: HTTP requests (fastest)
POST /api/login → Bearer token
GET /api/user/balance with Authorization header

// Method 2: Puppeteer scraping (fallback)
- Auto-detects Chrome path (macOS/Windows/Linux)
- Headless navigation with form filling
- Text extraction from balance element

// Method 3: Mock data (final fallback)
- Random balance 1,000-50,000 THB with realistic precision
```

#### **Payment APIs** (`/server/api/payment/`)

**create-charge.ts** - Payment charge creation (testing phase)

**webhook.ts** - Payment processor webhook handler (testing phase)

### Firebase Setup

**Configuration** (src/plugins/firebase.ts):
```typescript
Project ID: kinetic-abbey-408904
OAuth Domain: kinetic-abbey-408904.firebaseapp.com
Services: Authentication (getAuth), Firestore (getFirestore)
Plugin exports: $firebase, $auth, $db
```

**Access pattern:**
```typescript
const { $db, $auth } = useNuxtApp()
```

**Firestore Collections:**

| Collection | Purpose | Read Rules | Write Rules |
|-----------|---------|-----------|-----------|
| `login_history` | User login tracking | Admin only | Authenticated users |
| `lotteryResults` | Lottery draw results | Authenticated users | Authenticated users |
| `governmentLottery` | Government lottery history | Public | Admin + auto-save |

**Security** (firestore.rules):
- Admin email: `noipugsa@gmail.com` has full access
- Authenticated users: read/write to `lotteryResults`
- Public: read-only to `governmentLottery`

### localStorage Strategy

**Per-lottery-type isolation:**
```typescript
Key pattern: vip_lao_history_{lotteryType}
Example: vip_lao_history_government, vip_lao_history_hanoi-vip
Purpose: Separate prediction histories prevent data collision when switching lottery types
```

**Global state keys:**
```typescript
vip_result              → Current prediction results
selected_lottery_type   → Active lottery selection
accuracy_tracking       → Historical prediction accuracy
```

**Data flow:**
1. User selects lottery type → stored in `selected_lottery_type`
2. Prediction generated → stored in `vip_result` + `vip_lao_history_{type}`
3. Actual result fetched → compared against predictions in `accuracy_tracking`

### Layout Structure (main.vue)

**Desktop:**
- Fixed left sidebar (72px width, always visible)
- User info card with email + VIP badge
- Navigation menu with icons (dynamically filters admin-only items)
- Dark mode toggle + logout at bottom
- Expiration warning banner for VIP users (color-coded urgency)

**Mobile:**
- Hamburger menu → slide-in sidebar (transform-x animation)
- Top bar with logo + dark mode toggle
- Bottom tab bar with 5 key pages (Home, History, Prize Check, My Numbers, VIP)

**Navigation Menu:**
```typescript
All users: Home, History, Prize Check, My Numbers, Statistics, Manual,
           Two-digit, Dream, Win5, Range, Pricing

Admin only: User Stats, System Admin
```

### Important Patterns

#### **Authentication Flow**
```typescript
1. Page mounts → call waitForAuth()
2. Firebase initializes → onAuthStateChanged listener fires
3. user ref updates → page re-renders with auth state
4. If not authenticated → router.push('/login')
5. If authenticated → proceed with data loading
```

#### **Prediction Generation Flow**
```typescript
1. User selects lottery type (useLotteryType)
2. Page loads history from localStorage (vip_lao_history_{type})
3. useLaoFormulaAdvanced.calculateAdvanced() analyzes:
   - Weighted frequency (exponential decay)
   - Gap analysis (optimal: 2-digit 3-7 draws, 3-digit 3-8 draws)
   - Pair co-occurrence
   - Position patterns
4. Returns: {hot, twoDigits, threeDigits, cold, confidence}
5. useVipResult.setResult() saves to localStorage + Firestore
6. useAccuracyTracking.addPrediction() records for later comparison
7. Display predictions in UI with confidence scores
```

#### **API Response Standardization**
All server endpoints return consistent format:
```typescript
{
  success: boolean,
  data?: any,
  message?: string,
  error?: string
}
```

#### **Graceful Degradation**
Multiple fallback layers ensure app functionality:
```
Lottery: HTTP API → Puppeteer scraping → Mock data
Balance: HTTP API → Puppeteer scraping → Mock data
Auth: Firebase (required, no fallback)
```

### Styling Conventions

- **Framework**: Tailwind CSS utility classes exclusively
- **Theme**: Modern purple-blue-pink gradient theme (updated from green-yellow)
- **Dark mode**: `dark:` prefixed classes, state in localStorage
- **Mobile-first**: Base styles for mobile, `lg:` breakpoints for desktop
- **UI Language**: Thai with emoji icons for visual hierarchy
- **Animations**: Custom keyframes for float, pulse, bounce effects

### Development Workflow

1. **Adding New Lottery Analysis Features:**
   - Create composable in `src/composables/` with naming pattern `useLao*.ts`
   - Use `useLaoFormulaAdvanced.ts` as reference for weighted frequency + gap analysis
   - Store per-lottery-type data in localStorage: `vip_lao_*_{lotteryType}`
   - Include confidence scoring in predictions
   - Add accuracy tracking integration

2. **Adding New Pages:**
   - Create `.vue` file in `src/pages/` (auto-routed by Nuxt)
   - Add `definePageMeta({ layout: 'main' })` for sidebar layout
   - Import composables: `useAuth()`, `useLotteryType()`, etc.
   - Call `waitForAuth()` in `onMounted` before accessing user data
   - Handle loading/error states
   - Support dark mode with `dark:` classes

3. **Creating Server API Endpoints:**
   - Add to `server/api/` directory
   - Use `defineEventHandler()` from `h3`
   - Handle CORS: `setResponseHeaders(event, { 'Access-Control-Allow-Origin': '*' })`
   - Return standard JSON format: `{ success, data?, message?, error? }`
   - Implement graceful fallbacks (HTTP → Puppeteer → Mock)
   - Add error logging for debugging

4. **Working with Firestore:**
   - Access via: `const { $db } = useNuxtApp()`
   - Always check authentication before writes: `if (!user.value) return`
   - Use `waitForAuth()` to ensure user is loaded
   - Collections: `login_history`, `lotteryResults`, `governmentLottery`
   - Use proper TypeScript types for documents

5. **Styling Pages:**
   - Use Tailwind utility classes
   - Purple-blue-pink gradient theme: `from-purple-600 via-pink-500 to-blue-600`
   - Mobile responsive: start mobile-first, add `lg:` for desktop
   - Dark mode support: add `dark:` variants for all colors
   - Thai language UI with emoji icons
   - Consistent spacing: `p-4`, `gap-4`, `space-y-4`

## Deployment

- **Platform:** Vercel
- **Region:** sin1 (Singapore)
- **Framework Preset:** Nuxt.js
- **Node Version:** 20
- **Build Command:** `npm run build`
- **Output Directory:** `.output/public`
- **Serverless Functions:** `/api/**` routes via Nitro

**vercel.json configuration:**
```json
{
  "framework": "nuxtjs",
  "regions": ["sin1"],
  "build": {
    "env": {
      "NODE_VERSION": "20"
    }
  }
}
```

## Important Files

- `nuxt.config.ts` - Nuxt configuration with SSR/SPA routing rules
- `vercel.json` - Vercel deployment config
- `firebase.json` - Firebase configuration
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore composite indexes
- `tailwind.config.js` - Tailwind CSS configuration
- `package.json` - Dependencies and scripts

## Documentation Reference

- `SETUP_SUMMARY.md` - Setup guide for lottery fetcher system
- `LOTTERY_FETCHER_GUIDE.md` - Detailed guide for lottery data fetching
- `GOOGLE_SIGNIN_SETUP.md` - Google OAuth setup instructions
- `OAUTH_DOMAIN_FIX.md` - OAuth domain configuration fixes
- `PUPPETEER_LIMITATIONS.md` - Puppeteer constraints on Vercel
- `HOW_TO_FIND_API.md` - Guide for finding lottery APIs
- `TROUBLESHOOTING.md` - Common issues and solutions
- `SUBSCRIPTION_GUIDE.md` - VIP subscription system documentation
