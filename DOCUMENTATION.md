# NexAlgoTrix - Complete Platform Documentation

> A comprehensive DSA (Data Structures & Algorithms) learning platform with AI-powered tutoring, interview simulation, gamification, and job board features.

**Live URL**: https://nexalgotrix.lovable.app

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Authentication Flow](#authentication-flow)
6. [Pages & Routes](#pages--routes)
7. [Component Architecture](#component-architecture)
8. [Design System](#design-system)
9. [Edge Functions](#edge-functions)
10. [Key Features Implementation](#key-features-implementation)
11. [Hooks & Utilities](#hooks--utilities)
12. [Deployment & Configuration](#deployment--configuration)

---

## Project Overview

NexAlgoTrix is a pattern-first DSA learning platform designed to help developers master data structures and algorithms for technical interviews. 

### Core Philosophy
- **Pattern Recognition** over memorization
- **Mental Models** for each pattern type
- **"Why Before How"** approach
- **Interview Ready** practice ladder

### Key Features
1. **18-Week Curriculum** - Structured 10-level roadmap (Levels 0-1 free, 2-10 Pro)
2. **NexMentor AI Tutor** - 4-step guided problem solving with real-time hints
3. **Interview Simulator** - Timed mock interviews with code evaluation
4. **Gamification** - XP, streaks, badges, leaderboards
5. **Job Board** - Curated DSA-focused job opportunities
6. **Referral System** - Earn Pro access or cash rewards

---

## Tech Stack

### Frontend
```
- React 18.3.1
- TypeScript
- Vite (Build Tool)
- Tailwind CSS + tailwindcss-animate
- shadcn/ui (Component Library)
- Framer Motion (Animations)
- TanStack React Query (Data Fetching)
- React Router DOM 6 (Routing)
- React Hook Form + Zod (Form Validation)
- Monaco Editor (Code Editor)
- Recharts (Charts)
```

### Backend (Supabase/Lovable Cloud)
```
- Supabase Auth (Authentication)
- PostgreSQL Database
- Row Level Security (RLS)
- Edge Functions (Deno)
- Storage Buckets
```

### External Integrations
```
- Razorpay (Payments - India)
- Resend (Email notifications)
- OpenAI/Gemini (AI features via Lovable AI)
```

---

## Project Structure

```
├── public/
│   ├── favicon.ico
│   ├── favicon.png
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── assets/
│   │   └── logo.png
│   ├── components/
│   │   ├── admin/           # Admin panel components
│   │   ├── analytics/       # Weakness analytics, charts
│   │   ├── checkout/        # Coupon input, payment
│   │   ├── curriculum/      # Level cards, filters, progress
│   │   ├── dashboard/       # Payment banners, reminders
│   │   ├── discussions/     # Q&A system
│   │   ├── gamification/    # Badges, streaks, leaderboard
│   │   ├── home/            # 3-panel home layout
│   │   ├── interview/       # Interview simulator UI
│   │   ├── landing/         # Marketing pages
│   │   ├── layout/          # AppLayout, BottomNav, MobileHeader
│   │   ├── nexmentor/       # AI tutor interface
│   │   ├── patterns/        # Pattern cards, AI mentor
│   │   ├── premium/         # Upgrade modals, banners
│   │   ├── profile/         # Profile sections
│   │   ├── share/           # Share modal, cards
│   │   ├── tutor/           # AI tutor helpers
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/
│   │   ├── useAuth.tsx          # Authentication context
│   │   ├── useSubscription.tsx  # Pro status management
│   │   ├── useRazorpay.tsx      # Payment processing
│   │   ├── useBadgeAwarder.ts   # Auto badge evaluation
│   │   └── use-mobile.tsx       # Responsive detection
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts    # Supabase client (auto-generated)
│   │       └── types.ts     # Database types (auto-generated)
│   ├── lib/
│   │   └── utils.ts         # cn() helper for classNames
│   ├── pages/
│   │   ├── admin/           # Admin dashboard pages
│   │   ├── Auth.tsx
│   │   ├── Curriculum.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Gamification.tsx
│   │   ├── Index.tsx        # Landing/Home
│   │   ├── InterviewSimulator.tsx
│   │   ├── Jobs.tsx
│   │   ├── NexMentor.tsx
│   │   ├── Payments.tsx
│   │   ├── Pricing.tsx
│   │   ├── ProfileManagement.tsx
│   │   ├── Referral.tsx
│   │   ├── UserProfile.tsx
│   │   └── ... (policy pages)
│   ├── types/
│   │   └── interview.ts     # Interview types
│   ├── utils/
│   │   └── NexMentorAudio.ts
│   ├── App.tsx              # Main router
│   ├── App.css
│   ├── index.css            # Design tokens, global styles
│   └── main.tsx             # Entry point
├── supabase/
│   ├── config.toml          # Supabase config (auto-generated)
│   ├── migrations/          # Database migrations
│   └── functions/           # Edge functions
├── tailwind.config.ts       # Tailwind + theme config
├── vite.config.ts
└── package.json
```

---

## Database Schema

### Core Tables

#### `profiles`
User profile data extending auth.users:
```sql
- id (UUID, FK to auth.users)
- username (TEXT, unique)
- email (TEXT)
- full_name (TEXT)
- avatar_url (TEXT)
- bio (TEXT)
- mobile (TEXT)
- address (TEXT)
- college (TEXT)
- degree (TEXT)
- cgpa (NUMERIC)
- graduation_year (INTEGER)
- work_experience (JSONB) -- Array of {company, role, duration, tech_stack}
- github_url, linkedin_url, twitter_url, portfolio_url, leetcode_url, instagram_url
- subscription_status (TEXT) -- 'free' | 'monthly' | 'six_month' | 'yearly'
- subscription_expires_at (TIMESTAMPTZ)
- total_xp (INTEGER)
- current_level (INTEGER)
- current_streak (INTEGER)
- longest_streak (INTEGER)
- last_solved_at (TIMESTAMPTZ)
- streak_freeze_available (INTEGER)
- curriculum_level (INTEGER)
- tutor_preferences (JSONB)
- profile_completed_at (TIMESTAMPTZ)
```

#### `curriculum_levels`
10-level structured roadmap:
```sql
- id (UUID)
- level_number (INTEGER) -- 0-10
- name (TEXT)
- description (TEXT)
- color (TEXT) -- Hex color
- icon (TEXT) -- Emoji
- week_start (INTEGER)
- week_end (INTEGER)
- is_free (BOOLEAN) -- Levels 0-1 are free
- display_order (INTEGER)
```

#### `curriculum_modules`
Pattern modules within levels:
```sql
- id (UUID)
- level_id (UUID, FK)
- pattern_id (UUID, FK to patterns)
- module_number (INTEGER)
- name (TEXT)
- subtitle (TEXT)
- estimated_hours (INTEGER)
- mental_model (TEXT)
- pattern_template (TEXT)
- why_exists (TEXT)
- when_not_to_use (TEXT)
- confusion_breakers (TEXT)
- exit_condition (TEXT)
- display_order (INTEGER)
```

#### `patterns`
DSA patterns (linked to modules):
```sql
- id (UUID)
- name (TEXT)
- slug (TEXT)
- description (TEXT)
- icon (TEXT)
- color (TEXT)
- phase (INTEGER)
- total_questions (INTEGER)
- is_free (BOOLEAN)
- topic_id (UUID, FK)
- display_order (INTEGER)
```

#### `questions`
DSA problems:
```sql
- id (UUID)
- title (TEXT)
- description (TEXT)
- difficulty ('easy' | 'medium' | 'hard')
- pattern_id (UUID, FK)
- sub_pattern_id (UUID, FK)
- practice_tier (TEXT) -- 'confidence' | 'thinking' | 'interview_twist'
- is_trap_problem (BOOLEAN)
- signal (TEXT)
- approach (TEXT)
- brute_force (TEXT)
- optimal_solution (TEXT)
- why_this_approach (TEXT)
- what_fails_if_wrong (TEXT)
- interview_followups (TEXT[])
- hints (JSONB)
- test_cases (JSONB)
- companies (TEXT[])
- leetcode_link (TEXT)
- youtube_link (TEXT)
- article_link (TEXT)
- xp_reward (INTEGER)
- display_order (INTEGER)
```

#### `user_progress`
User's question-level progress:
```sql
- id (UUID)
- user_id (UUID)
- question_id (UUID, FK)
- is_solved (BOOLEAN)
- solved_at (TIMESTAMPTZ)
- xp_earned (INTEGER)
- hints_used (INTEGER)
- approach_viewed (BOOLEAN)
- brute_force_viewed (BOOLEAN)
- solution_viewed (BOOLEAN)
- notes (TEXT)
- next_review_at (TIMESTAMPTZ) -- Spaced repetition
- interval_days (INTEGER)
- ease_factor (NUMERIC)
- review_count (INTEGER)
- is_revision (BOOLEAN)
```

#### `tutor_sessions`
NexMentor AI sessions:
```sql
- id (UUID)
- user_id (UUID)
- question_id (UUID, FK)
- pattern_id (UUID, FK)
- session_type (TEXT) -- 'nexmentor'
- current_step (INTEGER) -- 1-4
- messages (JSONB) -- Chat history
- user_code (TEXT)
- language (TEXT) -- 'python' | 'javascript' | 'java' | 'cpp'
- leetcode_unlocked (BOOLEAN)
- problem_solved (BOOLEAN)
- time_spent (INTEGER) -- seconds
- hints_given (INTEGER)
- started_at (TIMESTAMPTZ)
- ended_at (TIMESTAMPTZ)
```

#### `interview_sessions` & `interview_results`
Mock interview data:
```sql
-- interview_sessions
- id, user_id, session_type, mode
- pattern_id, company_name
- questions (JSONB) -- Array of question IDs
- time_limit (INTEGER)
- status, total_score
- started_at, completed_at

-- interview_results
- id, session_id, question_id
- is_solved, submitted_code, selected_language
- time_spent, hints_used, run_count, submission_count
- evaluation_result (JSONB)
- code_quality_score, communication_score
- interview_performance_score
```

#### `badges` & `user_badges`
Gamification:
```sql
-- badges
- id, name, description, icon, type
- requirement (JSONB) -- Conditions to earn

-- user_badges
- id, user_id, badge_id, earned_at
```

#### `payments` & `refund_requests`
Subscription management:
```sql
-- payments
- id, user_id, amount, original_amount, discount_amount
- coupon_code, plan_type, status
- razorpay_order_id, razorpay_payment_id, razorpay_signature

-- refund_requests
- id, user_id, payment_id, reason
- status, admin_notes, processed_at, processed_by
```

#### `coupons` & `coupon_redemptions`
Discount system:
```sql
-- coupons
- id, code (unique)
- discount_type ('fixed' | 'percentage')
- monthly_discount, six_month_discount, yearly_discount
- is_active, max_redemptions, current_redemptions
- starts_at, expires_at
```

#### `dsa_jobs`
Job board:
```sql
- id, title, company_name, company_logo
- role, description, about_job
- location, job_type, experience, education
- skills (TEXT[]), tags (TEXT[])
- apply_link, posted_date, closing_date
- is_featured, status
```

---

## Authentication Flow

### Implementation (`src/hooks/useAuth.tsx`)

```tsx
// Context provides:
- user: User | null
- loading: boolean
- signIn(email, password): Promise
- signUp(email, password, username): Promise
- signOut(): void
- isAdmin: boolean

// Features:
- Email/password authentication
- Google OAuth
- Password reset via email
- Auto-confirm enabled (no email verification required)
- Admin role check via user_roles table
```

### Auth Page (`src/pages/Auth.tsx`)
- Login / Signup / Forgot password modes
- Animated UI with floating particles
- Google OAuth button
- Redirect handling for upgrade flows

---

## Pages & Routes

### Public Routes
| Route | Page | Description |
|-------|------|-------------|
| `/` | Index.tsx | Landing page (unauthenticated) or Home dashboard (authenticated) |
| `/auth` | Auth.tsx | Login/Signup/Reset password |
| `/pricing` | Pricing.tsx | Subscription plans with comparison |
| `/privacy` | PrivacyPolicy.tsx | Privacy policy |
| `/terms` | TermsConditions.tsx | Terms & conditions |
| `/refund` | RefundPolicy.tsx | Refund policy |
| `/shipping` | ShippingPolicy.tsx | Shipping policy |

### Authenticated Routes
| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Dashboard.tsx | User stats, continue learning, weakness analytics |
| `/curriculum` | Curriculum.tsx | 10-level DSA roadmap with filters |
| `/curriculum/module/:id` | CurriculumModule.tsx | Module deep-dive |
| `/question/:id` | Question.tsx | Individual question view |
| `/tutor` | NexMentor.tsx | AI-powered 4-step problem solving |
| `/interview` | InterviewSimulator.tsx | Mock interview setup & sessions |
| `/gamification` | Gamification.tsx | Tracker, badges, leaderboard |
| `/jobs` | Jobs.tsx | DSA job listings |
| `/referral` | Referral.tsx | Referral program (coming soon) |
| `/events` | Events.tsx | Coding events (coming soon) |
| `/payments` | Payments.tsx | Payment history & refund requests |
| `/profile/:username` | UserProfile.tsx | Public profile view |
| `/profile-settings` | ProfileManagement.tsx | Edit profile |
| `/payment-status` | PaymentStatus.tsx | Payment result |

### Admin Routes (`/admin/*`)
| Route | Page |
|-------|------|
| `/admin` | AdminDashboard.tsx |
| `/admin/users` | AdminUsers.tsx |
| `/admin/questions` | AdminQuestions.tsx |
| `/admin/patterns` | AdminPatterns.tsx |
| `/admin/topics` | AdminTopics.tsx |
| `/admin/curriculum` | AdminCurriculum.tsx |
| `/admin/modules` | AdminModules.tsx |
| `/admin/badges` | AdminBadges.tsx |
| `/admin/subscriptions` | AdminSubscriptions.tsx |
| `/admin/jobs` | AdminJobs.tsx |
| `/admin/coupons` | AdminCoupons.tsx |
| `/admin/refunds` | AdminRefunds.tsx |
| `/admin/testimonials` | AdminTestimonials.tsx |
| `/admin/companies` | AdminCompanies.tsx |
| `/admin/email-templates` | AdminEmailTemplates.tsx |

---

## Component Architecture

### Layout System

#### 1. HomeLayout (Authenticated Home)
```
┌─────────────────────────────────────────────────────┐
│ HomeHeader (fixed top - Logo, Search, XP/Streak)   │
├───────┬─────────────────────────┬───────────────────┤
│       │                         │                   │
│ Home  │    HomeCenterPanel      │  HomeRightPanel   │
│Sidebar│   (Curriculum Levels)   │ (Tracker/Badges)  │
│       │                         │                   │
│       │                         │                   │
└───────┴─────────────────────────┴───────────────────┘
```

#### 2. AppLayout (Other authenticated pages)
- Wraps all authenticated pages
- Persistent sidebar on desktop
- Bottom navigation on mobile
- Optional right panel support

#### 3. Mobile Layout
- Bottom navigation: Home, Interview, Jobs, Rewards
- Rotating stats header (XP, Streak, Rank)
- Hamburger menu for full navigation

### Key Components

#### Curriculum Components
```
- UnifiedLevelCard: Expandable level with modules and questions
- CurriculumFilters: Search, difficulty, status, bookmark filters
- CurriculumOverallProgress: Stats bar with difficulty breakdown
- CurriculumQuestionRow: Question item with checkbox, links, companies
- WeekTimeline: Visual week progress indicator
```

#### NexMentor Components
```
- LeetCodeProblemPanel: Problem description with examples
- NexMentorCodeEditor: Monaco editor with language selection
- NexMentorPanel: Chat interface with AI responses
- MobileNexMentorLayout: Swipeable 3-tab mobile layout
```

#### Interview Components
```
- SessionSetup: Configure interview (pattern/company/random)
- InterviewSession: Fullscreen interview with timer
- CodeEditor: Monaco with test case running
- TestCaseResults: Visual test results
- InterviewResults: Score breakdown and feedback
```

#### Gamification Components
```
- MonthlyTracker: GitHub-style activity calendar
- BadgesTab: Badge gallery with progress
- LeaderboardTab: XP-based rankings
- StreakCounter: Current streak display
- PatternMasteryMeter: Pattern-level progress
- InterviewReadinessScore: Overall readiness metric
```

---

## Design System

### Color Tokens (index.css)
```css
:root {
  --background: 0 0% 0%;           /* Black */
  --foreground: 0 0% 98%;          /* White text */
  --primary: 342 92% 47%;          /* Magenta/Red #e80948 */
  --primary-foreground: 0 0% 98%;
  --secondary: 45 93% 47%;         /* Gold */
  --muted: 240 4% 16%;
  --accent: 240 4% 16%;
  --card: 240 4% 6%;
  --success: 142 76% 36%;          /* Green */
  --warning: 38 92% 50%;           /* Amber */
  --destructive: 0 63% 31%;        /* Red */
}
```

### UI Patterns
```css
/* Glass card effect */
.glass-card {
  @apply bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl;
}

/* Interactive card with hover */
.interactive-card {
  @apply glass-card hover:bg-card/70 transition-all cursor-pointer;
}

/* Primary button with glow */
.btn-primary-glow {
  @apply bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25;
}

/* Gradient text */
.gradient-text {
  @apply bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent;
}
```

### Animation Patterns (Framer Motion)
```tsx
// Page entry
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
/>

// Staggered children
{items.map((item, i) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.1 }}
  />
))}

// Hover effects
<motion.div whileHover={{ y: -4, scale: 1.02 }} />
```

---

## Edge Functions

Located in `supabase/functions/`:

| Function | Purpose |
|----------|---------|
| `ai-mentor` | AI mentor for quick pattern hints (requires auth) |
| `ai-tutor` | NexMentor 4-step tutoring (requires auth) |
| `nexmentor-realtime` | Real-time code analysis |
| `nexmentor-thinking` | Thought process analysis |
| `evaluate-code` | Code execution and evaluation |
| `run-test-cases` | Run test cases against user code |
| `interview-feedback` | Generate interview performance feedback |
| `create-razorpay-order` | Create payment order |
| `verify-razorpay-payment` | Verify payment signature |
| `razorpay-webhook` | Handle Razorpay webhooks |
| `request-refund` | Submit refund request |
| `update-refund-status` | Admin: Update refund status |
| `subscription-email` | Send subscription emails |
| `check-expiring-subscriptions` | Cron: Check expiring subs |
| `get-user-email` | Admin: Get user email |

### Edge Function Pattern
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );
    
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Function logic here...

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

## Key Features Implementation

### 1. Curriculum System

**Data Flow:**
```
curriculum_levels → curriculum_modules → patterns → questions
```

**Level Access:**
- Levels 0-1: Free for all users
- Levels 2-10: Require Pro subscription
- Check via `useSubscription().isPremium`

### 2. NexMentor (4-Step AI Tutor)

**Steps:**
1. **Decode + Pattern** - Understand problem, identify pattern
2. **Brute Force** - Discuss brute approach + complexity
3. **Optimal** - Optimize solution
4. **Code & Verify** - Implement and test

**State Persistence:**
- Sessions saved to `tutor_sessions`
- Code auto-saved with 2s debounce
- Resume across devices

### 3. Interview Simulator

**Modes:**
- Pattern-based (select specific pattern)
- Company-based (filter by company tags)
- Random (mixed questions)

**Features:**
- Fullscreen mode
- Copy-paste detection
- Timer with per-question tracking
- Code evaluation via edge function
- Performance scoring

### 4. Gamification

**XP System:**
- Earn XP for solving problems (based on difficulty)
- XP determines level (level = XP / 100)

**Streaks:**
- Daily streak for consecutive solving days
- Streak freeze (Pro feature)

**Badges:**
- Awarded automatically via `useBadgeAwarder` hook
- Types: streak, problems, patterns, special

### 5. Payment System (Razorpay)

**Flow:**
```
1. User selects plan → initiatePayment()
2. Create order via edge function
3. Open Razorpay checkout
4. On success → verify-razorpay-payment
5. Update profile subscription_status
```

**Plans:**
- Monthly: ₹199
- 6-Month: ₹999 (most popular)
- Yearly: ₹1499

---

## Hooks & Utilities

### Custom Hooks

```typescript
// useAuth - Authentication state
const { user, loading, signIn, signUp, signOut, isAdmin } = useAuth();

// useSubscription - Pro status
const { isPremium, status, expiresAt, refetch } = useSubscription();

// useRazorpay - Payment processing
const { initiatePayment, isLoading } = useRazorpay();

// useBadgeAwarder - Auto badge evaluation
useBadgeAwarder(); // Called in Gamification page

// useIsMobile - Responsive detection
const isMobile = useIsMobile(); // < 768px width
```

### Utility Functions

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Deployment & Configuration

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### Supabase Config (`supabase/config.toml`)
- Auto-generated, don't edit manually
- Contains auth settings, API config

### Required Secrets (Edge Functions)
```
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RESEND_API_KEY (for emails)
```

### RLS Policies

All tables have Row Level Security enabled. Key policies:
- Users can only read/write their own data
- Public views (`profiles_public`, `payments_public`) for safe data exposure
- Admin policies use `has_role('admin', auth.uid())` function

---

## Quick Start for Hackathon

### 1. Clone & Setup
```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

### 2. Database Setup
- Create Supabase project
- Run migrations from `supabase/migrations/`
- Enable Row Level Security
- Create admin user in `user_roles` table

### 3. Configure Auth
- Enable email/password auth
- Enable Google OAuth (optional)
- Enable auto-confirm for signups

### 4. Deploy Edge Functions
```bash
supabase functions deploy
```

### 5. Add Secrets
```bash
supabase secrets set RAZORPAY_KEY_ID=xxx
supabase secrets set RAZORPAY_KEY_SECRET=xxx
```

---

## Summary

NexAlgoTrix is a full-stack DSA learning platform with:

- **Frontend**: React + TypeScript + Tailwind + shadcn/ui + Framer Motion
- **Backend**: Supabase (Auth, DB, Edge Functions, Storage)
- **Key Features**: Curriculum, AI Tutor, Interview Sim, Gamification, Jobs
- **Monetization**: Razorpay subscriptions (Monthly/6-Month/Yearly)
- **Design**: Dark theme, magenta primary, glass cards, smooth animations

For questions: hello.nexalgotrix@gmail.com

---

*Last updated: January 2026*
