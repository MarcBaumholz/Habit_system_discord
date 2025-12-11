# HabitOS Dashboard

A beautiful, PrivateOS-inspired web dashboard for viewing and tracking your habits from the Discord Habit System.

## Features

- **Simple Authentication**: Email/password signup and login
- **Beautiful UI**: Dark theme with PrivateOS-style design
- **Habit Tracking**: Visual board view of all your habits
- **Progress Visualization**:
  - Progress rings showing weekly completion
  - Streak counters with fire icons
  - Domain-based color coding
- **Real-time Stats**: Dashboard shows total habits, streaks, and more
- **Notion Integration**: Pulls data directly from your existing Notion databases

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `JWT_SECRET`: A secure random string for JWT tokens
- `NOTION_TOKEN`: Your Notion integration token
- `NOTION_DATABASE_*`: IDs of your Notion databases

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## User Flow

1. **Sign Up**: Users create an account with email, password, and display name
2. **Dashboard**: After login, users see their personal HabitOS dashboard
3. **Habit Cards**: Each habit is displayed as a card showing:
   - Domain badge (Health, Mind, Career, etc.)
   - Progress ring (weekly completion percentage)
   - Current streak
   - Weekly progress (e.g., 5/7 days)
   - Last proof date
   - "Why" statement (shown on hover)

## Architecture

### Authentication
- Email/password authentication with bcrypt hashing
- JWT tokens stored in httpOnly cookies
- Simple JSON file-based user storage (upgrade to database in production)

### Data Flow
1. User logs in → JWT token created
2. Dashboard fetches user's Notion data via API routes
3. API routes query Notion databases for habits and proofs
4. Frontend displays data with beautiful visualizations

### File Structure

```
src/
├── app/
│   ├── login/           # Login page
│   ├── signup/          # Signup page
│   ├── dashboard/       # Main dashboard page
│   └── api/
│       ├── auth/        # Auth endpoints
│       └── dashboard/   # Dashboard data endpoints
├── components/
│   ├── dashboard/       # Dashboard-specific components
│   │   ├── DashboardHeader.tsx
│   │   ├── HabitBoard.tsx
│   │   ├── HabitCard.tsx
│   │   ├── ProgressRing.tsx
│   │   └── StreakCounter.tsx
│   └── ui/              # Reusable UI components
├── lib/
│   ├── auth.ts          # Authentication utilities
│   ├── users-db.ts      # User database layer
│   └── notion-dashboard.ts  # Notion integration
├── hooks/
│   └── useAuth.ts       # Authentication hook
└── types/
    ├── auth.ts          # Auth types
    └── dashboard.ts     # Dashboard types
```

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add environment variables in Vercel dashboard

### Environment Setup

Make sure to set these environment variables in your deployment platform:
- All `NOTION_` variables from your Discord bot setup
- `JWT_SECRET` (generate a secure random string)

## Security Notes

- Passwords are hashed with bcrypt (12 rounds)
- JWT tokens in httpOnly cookies (not accessible via JavaScript)
- HTTPS enforced in production
- Rate limiting recommended for production (add middleware)
- User data isolated (users can only see their own data)

## Future Enhancements

- Weekly calendar heat map
- Detailed habit analytics
- Goal setting and tracking
- Social features (share progress)
- Mobile app
- Push notifications
- Export data functionality

## Tech Stack

- **Framework**: Next.js 15 + React 19
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Auth**: JWT + bcrypt
- **Data**: Notion API + SWR for caching
- **Components**: Radix UI primitives

## License

Part of the Discord Habit System project.
