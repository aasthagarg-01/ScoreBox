# ScoreBox

A full-stack sports tracking app where users can search teams across football, cricket, basketball, and more, save the ones they follow, and view results, upcoming fixtures, and squad info — all in one personal dashboard.

**Live demo:** [scorebox-brown.vercel.app](https://scorebox-brown.vercel.app)

Built as a portfolio project to demonstrate full-stack engineering skills (authentication, database design, external API integration, caching strategy) for SDE roles.

---

## Features

- **Authentication** — email/password signup and login via Supabase Auth, with email confirmation
- **Multi-sport team search** — autocomplete-style search across football, cricket, basketball, and more, with a sport filter
- **Save teams** — logged-in users can save any team to a personal dashboard
- **Personal dashboard** — scoreboard-style cards showing each saved team's most recent result
- **Team profile pages** — club history, stadium, founding year, recent match results, upcoming fixture, and a sample squad roster
- **Caching layer** — match data is cached in Postgres with a 60-second freshness window, so repeat requests are served from the database instead of hitting the external API on every load

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Database | PostgreSQL (Supabase) |
| Authentication | Supabase Auth |
| External Data | [TheSportsDB](https://www.thesportsdb.com/) API |
| Deployment | Vercel |

---

## Architecture

**Auth flow:** Supabase Auth handles signup/login and issues a session, managed via cookies through Next.js middleware (`utils/supabase/`). Row Level Security (RLS) policies on every table ensure users can only read/write their own saved teams, while team and match data remain publicly readable.

**Caching strategy:** TheSportsDB's free tier is rate-limited, so match data is not fetched from the external API on every page load. Instead, each request first checks a Postgres `games_cache` table:
- If a cached row exists and is under 60 seconds old, it's served directly from the database.
- If the cache is stale or missing, fresh data is fetched from the API, written to the cache, and returned.

This significantly reduces external API calls under repeated/concurrent use, while keeping the data close to real-time.

**Database schema:**
\```
teams          — id, external_id, name, league, badge_url
saved_teams    — id, user_id (FK → auth.users), team_id (FK → teams), created_at
games_cache    — id, external_game_id, team_id, opponent, score_home,
                 score_away, status, start_time, last_updated
\```

---

## Known Limitations

This project uses TheSportsDB's **free-tier** API, which comes with real constraints, documented here rather than hidden:
- Search returns limited/exact matches rather than a broad fuzzy suggestion list
- "Last matches" typically returns only the single most recent match, not a full match history
- Squad rosters are capped at a small sample of players, not the full current squad
- No true in-play live scores (last-played / next-fixture data only)

These are data-source limitations, not application bugs — a paid API tier would remove them without any changes to the app's architecture.

---

## Getting Started

\```bash
git clone https://github.com/aasthagarg-01/ScoreBox.git
cd ScoreBox
npm install
\```

Create a `.env.local` file with:
\```
SPORTS_API_KEY=123
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
\```

Run the dev server:
\```bash
npm run dev
\```

---

## Roadmap

- [ ] Automated email notifications on match result changes (scheduled job + email service)
- [ ] Expanded match history beyond the free-tier limit
- [ ] League standings view

---

## Author

Built by [Aastha Garg](https://github.com/aasthagarg-01)
