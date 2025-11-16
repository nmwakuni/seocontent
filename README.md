# SEO Content Cluster - AI-Powered SEO Content Generator

A production-ready SaaS application for generating SEO-optimized content clusters using AI. Built with Next.js, TypeScript, and modern web technologies.

## Features

- 🔐 **Authentication** - Email/password and Google OAuth with Better Auth
- 💾 **Database** - Neon Postgres with Drizzle ORM
- 🎨 **UI** - Beautiful components with shadcn/ui
- 🔄 **Data Fetching** - TanStack Query for efficient data management
- ✅ **Validation** - Zod for type-safe validation
- 📧 **Email** - Resend integration ready
- 🤖 **AI Integration** - Claude API for content generation
- 💳 **Payments** - Stripe integration ready

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Neon Postgres
- **ORM**: Drizzle
- **Auth**: Better Auth
- **UI**: shadcn/ui + Tailwind CSS
- **State**: TanStack Query
- **Validation**: Zod
- **Email**: Resend
- **AI**: Anthropic Claude
- **Payments**: Stripe

## Database Schema

### Tables

- **users** - User accounts
- **sessions** - User sessions
- **accounts** - OAuth accounts
- **verifications** - Email verifications
- **projects** - SEO projects
- **keywords** - Keyword research data
- **contentClusters** - Content cluster strategies
- **articles** - Generated content
- **subscriptions** - User subscriptions
- **usageTracking** - Usage metrics

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Neon Postgres database
- Google OAuth credentials (optional)
- Anthropic API key
- Stripe account (optional)
- Resend API key (optional)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd seocontent
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` file with the required credentials:
- `DATABASE_URL` - Your Neon Postgres connection string
- `BETTER_AUTH_SECRET` - Generate with `openssl rand -base64 32`
- `BETTER_AUTH_URL` - Your app URL (http://localhost:3000 for local)
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (optional)
- `ANTHROPIC_API_KEY` - Your Claude API key
- `STRIPE_SECRET_KEY` and other Stripe keys (optional)
- `RESEND_API_KEY` (optional)

5. Run database migrations:
```bash
npm run db:push
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
seocontent/
├── app/
│   ├── (auth)/
│   │   ├── login/          # Login page
│   │   └── signup/         # Signup page
│   ├── api/
│   │   └── auth/          # Auth API routes
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # shadcn/ui components
│   └── providers/         # React providers
├── lib/
│   ├── db/               # Database schema and connection
│   ├── auth.ts           # Auth configuration
│   ├── auth-client.ts    # Auth client
│   └── utils.ts          # Utility functions
├── hooks/
│   └── use-toast.ts      # Toast hook
└── public/               # Static files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio

## Features Implemented

✅ Beautiful landing page with hero, features, and pricing sections
✅ Authentication (login/signup with email and Google OAuth)
✅ Database schema with Drizzle ORM
✅ UI components with shadcn/ui
✅ TanStack Query setup
✅ Toast notifications

## Features to Implement

### Core Features
- [ ] Dashboard layout with navigation
- [ ] Project management (create, edit, delete projects)
- [ ] Keyword research interface
- [ ] Content cluster generation
- [ ] AI content writing with Claude
- [ ] Article management dashboard
- [ ] Profile management

### Additional Features
- [ ] Stripe payment integration
- [ ] Email notifications with Resend
- [ ] Usage tracking and limits
- [ ] Export content functionality
- [ ] Team collaboration
- [ ] Analytics dashboard

## Environment Variables

See `.env.example` for all required environment variables.

## Database Migrations

To create a new migration:
```bash
npx drizzle-kit generate
```

To apply migrations:
```bash
npx drizzle-kit push
```

To open Drizzle Studio:
```bash
npx drizzle-kit studio
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

This app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Render
- AWS
- Google Cloud

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
