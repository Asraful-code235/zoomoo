# Zoomies Database Setup

## Supabase Configuration

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key

### 2. Run Database Schema
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Run the script to create all tables, indexes, and seed data

### 3. Environment Variables
Add to your environment files:

**Backend (.env):**
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Frontend (.env):**
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Row Level Security (RLS)
The schema includes RLS policies for:
- Users can only see their own sensitive data
- Positions are private to each user
- Orders are private to each user
- Public read access for markets, streams, leaderboards

### 5. Database Structure

#### Core Tables
- **users** - User profiles linked to Privy authentication
- **admin_roles** - Super admin and regular admin permissions
- **streams** - Hamster live stream configurations
- **markets** - Prediction markets for each stream
- **positions** - User bets/holdings in markets
- **orders** - Order book for trading

#### Supporting Tables
- **market_templates** - Reusable bet templates for admins
- **referrals** - Referral tracking and commissions
- **achievements** - Gamification badges
- **price_history** - Market price charts
- **daily_stats** - Platform analytics

### 6. Seeded Data
The schema includes default:
- 7 market templates (drinking, wheel, eating, etc.)
- 10 achievement badges
- Proper indexes for performance

### 7. API Integration
- User model handles Privy authentication sync
- Market model manages prediction markets
- Real-time subscriptions for live updates
- Leaderboard queries with time filters

Ready for hamster prediction markets! 🐹💰
