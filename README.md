# ProAct

A React Native mobile app that helps you build healthy habits by tracking daily meals and workouts — and showing you how much money you save by cooking at home.

## Features

- **Today's Plan** — Daily meal and workout cards with an animated calendar view
- **Workout Picker** — Browse and filter 15 workouts by category (Cardio, Strength, Core, Flexibility, Full Body)
- **Fridge** — Search ingredients and generate recipe ideas using the Spoonacular API
- **Progress Dashboard** — Weekly tracker, streak counter, and money saved breakdown
- **Push Notifications** — Customisable daily reminders for meals and workouts
- **Onboarding** — First-launch flow to personalise the experience
- **Authentication** — Email/password sign up and login with Supabase Auth
- **Persistent Sessions** — Stay logged in across app restarts via SecureStore
- **Data Persistence** — All activity syncs to Supabase (PostgreSQL)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (SDK 55) |
| Navigation | React Navigation (Bottom Tabs) |
| Backend / Auth | Supabase (REST API) |
| Recipes | Spoonacular API |
| Notifications | expo-notifications |
| Storage | expo-secure-store + AsyncStorage |
| Haptics | expo-haptics |
| State | React Context API |

## Getting Started

### Prerequisites

- Node.js 20+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio with an emulator, or a physical Android device with USB debugging enabled
- A [Supabase](https://supabase.com) project
- A [Spoonacular](https://spoonacular.com/food-api) API key

### Supabase Setup

Create two tables in your Supabase project:

**`daily_logs`**
```sql
create table daily_logs (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  date date not null,
  meal_completed boolean default false,
  workout_completed boolean default false,
  meal_name text,
  workout_name text,
  money_saved numeric default 0,
  updated_at timestamptz default now()
);
```

**`user_stats`**
```sql
create table user_stats (
  id uuid default gen_random_uuid() primary key,
  user_id text not null unique,
  total_money_saved numeric default 0,
  total_meals integer default 0,
  total_workouts integer default 0,
  best_streak integer default 0,
  updated_at timestamptz default now()
);
```

### Installation

```bash
git clone https://github.com/your-username/proact.git
cd proact

npm install

cp .env.example .env
# Fill in your keys in .env

npx expo run:android
```

### Environment Variables

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `EXPO_PUBLIC_SPOONACULAR_KEY` | Your Spoonacular API key |

## Project Structure

```
src/
├── api/          # Spoonacular API calls
├── components/   # MealCard, WorkoutCard
├── context/      # AppContext — global state
├── data/         # workouts.json
├── lib/          # auth, supabase, notifications, onboarding
├── navigation/   # Bottom tab navigator
├── screens/      # Auth, Calendar, Fridge, Dashboard, Onboarding
└── theme/        # colors.js
```

## Screenshots

_Coming soon_

## License

MIT
