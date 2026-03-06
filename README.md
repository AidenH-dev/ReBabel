# ReBabel - Japanese Study Aid

A modern web application that helps users learn Japanese through interactive AI-powered tutoring sessions. Built with Next.js 14, this platform provides personalized language learning experiences with SRS flashcards, AI translation practice, vocabulary/grammar sets, and study analytics.

## Features

- SRS (Spaced Repetition System) flashcards
- Vocabulary & Grammar Sets
- AI-powered translation practice with feedback
- Flashcards & Quiz modes
- Push notifications for study reminders
- Premium subscriptions via Stripe

## Tech Stack

- **Frontend Framework**: Next.js 14 (Pages Router)
- **Styling**: Tailwind CSS
- **Authentication**: Auth0
- **Database**: Supabase (`v1_kvs_rebabel` schema)
- **AI Integration**: DeepSeek
- **LLM Tracing**: LangSmith
- **Payments**: Stripe
- **Analytics**: PostHog, Vercel Analytics
- **Push Notifications**: APNS
- **Form Handling**: Formik + Yup
- **Charts**: Chart.js

## Prerequisites

- Node.js (v18 or higher)
- npm
- Git

## Installation

1. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:

```env
# AI
DEEPSEEK_KEY=

# Auth0
AUTH0_SECRET=
AUTH0_BASE_URL=
AUTH0_ISSUER_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_REDIRECT_URI=
AUTH0_DOMAIN=
AUTH0_TRANSACTION_COOKIE_SAME_SITE=
AUTH0_COOKIE_DOMAIN=

# Supabase
SUPABASE_SERVICE_ROLE_KEY=
NEXT_SUPABASE_ANON_KEY=
NEXT_SUPABASE_URL=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
NEXT_PUBLIC_NODE_ENV=

# Push Notifications (APNS)
APNS_KEY_ID=
APNS_TEAM_ID=
APNS_BUNDLE_ID=
APNS_PRODUCTION=
APNS_KEY=

# Webhooks
PEKO_WEBHOOK_URL=
PEKO_WEBHOOK_TOKEN=

# LangSmith (optional for local dev)
LANGSMITH_TRACING=
LANGSMITH_ENDPOINT=
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=
LANGCHAIN_TRACING_V2=
```

## Running the Application

1. Start the development server:

```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── pages/
│   ├── api/
│   │   ├── auth/               # Auth0 callbacks
│   │   ├── database/v1/        # Active CRUD routes
│   │   ├── practice/translate/ # AI translation practice
│   │   ├── subscriptions/      # Stripe subscription management
│   │   ├── push/               # APNS push notifications
│   │   └── cron/               # SRS notification jobs
│   ├── learn/
│   │   ├── grammar/            # Grammar lessons & translation exercises
│   │   └── academy/            # SRS study interface
│   ├── admin/
│   └── blog/
├── components/
│   ├── SRS/                    # Spaced repetition UI
│   ├── Set/Features/           # Flashcard session (Quiz, SRS)
│   ├── Practice/               # Translation practice components
│   └── Sidebars/               # MainSidebar, AcademySidebar, AdminSidebar
├── contexts/
│   ├── PremiumContext.js       # Subscription state + session limits
│   └── ThemeContext.js         # Light/dark/system theme
└── lib/
    ├── langsmith.js            # LLM call tracing
    └── supabaseAdmin.js        # Shared Supabase admin client
```

## Commercial Use

ReBabel is free for personal, non-commercial use under MIT.

**Want to use ReBabel commercially?**

- Use [rebabel.org](https://rebabel.org) hosted service, OR
- Contact us for a commercial licensing agreement

[rebabel.development@gmail.com](mailto:rebabel.development@gmail.com)

## License

This software is licensed under TWO licenses:

1. MIT License — see the [LICENSE](./LICENSE) — for non-commercial use
2. Commercial License — for commercial use

## Acknowledgments

- Next.js team for the amazing framework
- Auth0 for authentication services
- Supabase for database services
- All contributors and users of the platform
- All my teachers and mentors who have guided me and fostered my passion for development and Japanese

## Support

If you encounter any issues or have questions, please open an issue in the GitHub repository.
