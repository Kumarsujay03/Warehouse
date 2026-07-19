# Warehouse

A personal Research & Content Warehouse — Notion-inspired workspace for managing content pipelines, research resources, media assets, and projects. Built for single-admin use.

## Overview

Warehouse is a dark, monochrome, desktop-first web application designed to:

- **Manage content** — Create, edit, schedule, and publish posts with hooks, bodies, and metadata
- **Organize research** — Maintain a library of papers, videos, books, articles, and courses
- **Handle media** — Upload, browse, and manage files via Cloudinary
- **Import at scale** — Bulk-import content plans from HTML, JSON, or Markdown files with auto-resource linking
- **Track everything** — Calendar view, global search, tagging, and analytics
- **Analyze growth** — Track engagement metrics, posting consistency, and content performance over time
- **AI-powered insights** — Export data with pre-built prompts for AI content strategy analysis

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS + shadcn/ui components |
| Database | Supabase (Postgres + RLS) |
| Media | Cloudinary (DAM mode) |
| Auth | Custom JWT sessions + bcrypt |
| Charts | Recharts (ComposedChart, BarChart, AreaChart) |
| Hosting | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project ([supabase.com](https://supabase.com))
- Cloudinary account ([cloudinary.com](https://cloudinary.com))

### 1. Clone & Install

```bash
git clone <repo-url>
cd warehouse
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Fill in your credentials in `.env.local`:

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `SESSION_SECRET` | Any random 32+ char string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard → Cloud Name |
| `CLOUDINARY_API_KEY` | Cloudinary → Settings → API Keys |
| `CLOUDINARY_API_SECRET` | Cloudinary → Settings → API Keys |
| `ADMIN_EMAIL` | Email for the admin account |
| `ADMIN_PASSWORD` | Initial password (changed on first login) |

### 3. Set Up Database

Open Supabase SQL Editor and run the migration:

```sql
-- Paste contents of supabase/migrations/001_schema.sql
```

Then grant permissions:

```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
```

### 4. Seed Admin User

Start the dev server and visit the seed endpoint:

```bash
npm run dev
# Then open: http://localhost:3000/api/seed
```

### 5. Login

Navigate to `http://localhost:3000` and sign in. You'll be prompted to set new credentials on first login.

## Deployment (Vercel)

### Push to GitHub & Import

1. Push repo to GitHub
2. Import into Vercel (vercel.com/new)
3. Framework: Next.js, Build: `npm run build`

### Environment Variables

Add all variables from `.env.example` to Vercel Dashboard → Settings → Environment Variables.

Note: `NODE_ENV` is automatically set to `production` by Vercel.

### Connect Supabase

Your database is external — the same Supabase project works for both dev and production. If using a separate project for production:

1. Create a new Supabase project
2. Run the SQL migration
3. Run the GRANT statements
4. Visit `https://your-app.vercel.app/api/seed` to create the admin
5. Update Vercel env vars with the new project keys

### Connect Cloudinary

1. Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` to Vercel
2. Create folders in Cloudinary: one for uploads, one for avatars
3. The app uses signed server-side uploads — no upload preset needed

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated pages
│   │   ├── feed/           # LinkedIn-style post preview
│   │   ├── posts/          # Post management (CRUD, table, editor)
│   │   ├── library/        # Resources & projects
│   │   ├── cloud/          # Cloudinary media browser
│   │   ├── import/         # Import with templates
│   │   ├── export/         # Export analytics + AI prompt generator
│   │   ├── calendar/       # Schedule visualization
│   │   ├── search/         # Global cross-table search
│   │   ├── tags/           # Tag management
│   │   ├── analytics/      # Advanced analytics dashboard
│   │   ├── settings/       # Profile, avatar, credentials
│   │   └── dashboard/      # Overview & quick actions
│   ├── api/                # API routes (REST)
│   │   ├── analytics/      # Analytics, engagement, export, schedule APIs
│   │   ├── posts/          # Post CRUD
│   │   ├── resources/      # Resource CRUD
│   │   └── ...
│   ├── login/              # Auth pages
│   └── change-password/
├── components/
│   ├── layout/             # Sidebar, header, command palette
│   ├── confirm-dialog.tsx  # Custom themed confirmation modal
│   └── ui/                 # shadcn/ui primitives
├── lib/
│   ├── auth/               # Session & password utilities
│   ├── supabase/           # Database clients
│   ├── cloudinary.ts       # Cloudinary API wrapper
│   ├── types.ts            # TypeScript interfaces
│   └── utils.ts            # Shared utilities
└── middleware.ts           # Auth guard
```

## Features

### Core
- **Auth** — JWT sessions, bcrypt passwords, forced first-login credential change
- **Feed** — LinkedIn-style card preview with status filtering (Ready/Scheduled/Draft)
- **Posts** — Full CRUD with rich editor, media upload, resource linking, tagging
- **Library** — Resources (papers/videos/books/articles/courses) + Projects, grid/list views
- **Cloud** — Cloudinary browser with folder switching, view modes, download, upload
- **Import** — Parse HTML/JSON/Markdown → preview → validate → save with auto-resource creation
- **Calendar** — Monthly view of scheduled posts
- **Search** — Cross-table search (posts, resources, projects, media, tags)
- **Tags** — Many-to-many tagging with color coding
- **Settings** — Profile, avatar picker, email/password change, environment status
- **Command Palette** — Ctrl+K navigation
- **Responsive** — Desktop-first with mobile support

### Analytics (v2)
- **Growth Timeline** — Per-post chart showing individual performance + cumulative growth (impressions, likes, comments, engagement rate trend)
- **Engagement Metrics** — Total impressions, likes, comments, engagement rate, top performing posts
- **Contribution Calendar** — GitHub-style heatmap showing posting activity over 52 weeks
- **Posting Consistency** — Rhythm-based streak counting, average frequency, best day/time, gaps analysis
- **Smart Suggestions** — AI-like recommendations for when to post next, with "Apply" buttons
- **How It's Calculated** — Expandable explanation section showing the logic behind every metric
- **Manage Data** — Inline engagement editor (impressions, likes, comments per published post with date tracking)
- **Auto-Schedule** — Apply optimal timing to draft posts ("Apply Best Day & Time" or "Auto-Distribute")
- **Export & AI** — Export analytics as JSON/CSV + auto-generated AI prompt for content strategy analysis

### UX Polish (v2)
- **Custom Confirmation Dialog** — Themed modal with variants (destructive/warning/info), loading states, and progress animation. Replaces all native browser `confirm()` dialogs
- **Toast Notifications** — Themed notifications in top-right corner after every action
- **No Back Buttons** — Clean navigation via sidebar on top-level pages; back button only on detail/sub-pages

## Analytics Setup

After running the main schema migration, the posts table includes engagement columns:

```sql
-- Already included in 001_schema.sql:
-- likes_count INTEGER NOT NULL DEFAULT 0
-- comments_count INTEGER NOT NULL DEFAULT 0
-- impressions_count INTEGER NOT NULL DEFAULT 0
-- engagement_updated_at TIMESTAMPTZ
```

If upgrading from v1, run this in Supabase SQL Editor:

```sql
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impressions_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_updated_at TIMESTAMPTZ;
```

### Updating Engagement Data

1. Go to **Analytics → Manage Data** tab
2. Only published posts are shown, sorted by publish date
3. Click the edit icon to update impressions/likes/comments from your platform (e.g., LinkedIn Creator Mode)
4. Click "Save Changes" — timestamps are tracked per-post

### Exporting for AI Analysis

1. Go to **Export** page (sidebar)
2. Click "Export JSON + AI Prompt" to download your data
3. Copy the generated AI prompt
4. Paste into ChatGPT/Claude/Gemini for personalized content strategy analysis
5. The prompt asks for: content performance analysis, timing optimization, hook analysis, growth strategy, and title improvements

## Import Format

The import system supports three formats. Download sample templates from the Import page.

**JSON (recommended):**
```json
[
  {
    "title": "Post title",
    "category": "Research",
    "status": "draft",
    "publish_date": "2026-07-07",
    "goal": "Brand & Reach",
    "hook": "Opening hook text...",
    "resources": [
      { "type": "article", "title": "Resource name", "url": "https://..." }
    ]
  }
]
```

Resources are auto-created and linked. Duplicate URLs reuse existing resources.

## API Routes

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/posts` | GET, POST | List/create posts |
| `/api/posts/[id]` | GET, PUT, DELETE | Single post CRUD |
| `/api/resources` | GET, POST | List/create resources |
| `/api/projects` | GET, POST | List/create projects |
| `/api/tags` | GET, POST | List/create tags |
| `/api/media` | GET, POST | List/upload media |
| `/api/search` | GET | Cross-table search |
| `/api/analytics` | GET | Full analytics data (engagement, growth, calendar, consistency) |
| `/api/analytics/engagement` | PUT | Bulk update likes/comments/impressions |
| `/api/analytics/export` | GET | Export JSON/CSV with AI prompt |
| `/api/analytics/schedule` | GET, PUT | Fetch drafts + apply optimal scheduling |
| `/api/import/parse` | POST | Parse import files |
| `/api/import/save` | POST | Save parsed imports |
| `/api/auth/login` | POST | Authentication |
| `/api/seed` | GET | Create initial admin user |

## Architecture Notes

- All database access uses `service_role` key server-side (API routes/server components)
- Auth is handled at the middleware layer, not via Supabase Auth
- Cloudinary uses DAM mode (dynamic folders via `asset_folder`)
- RLS is enabled but permissive — security is enforced at the application layer
- Analytics streak uses rhythm-based counting (respects your natural posting frequency, not just consecutive days)
- All analytics filter to published posts only
- Custom `ConfirmProvider` wraps the app layout for themed confirmation dialogs
- Designed for future extensibility: AI summarization, semantic search, LinkedIn publishing

## Changelog

### v2.0.0
- Advanced analytics dashboard with tabbed navigation (Overview, Engagement, Activity, Consistency, Schedule, Manage Data)
- Growth timeline chart (per-post bars + cumulative growth lines using Recharts ComposedChart)
- GitHub-style contribution calendar (52-week posting heatmap)
- Engagement metrics with impressions, likes, comments, and engagement rate
- Smart suggestions with "Apply" buttons and "How it's calculated" explanations
- Auto-schedule feature (Apply Best Day & Time / Auto-Distribute based on optimal frequency)
- Export page with JSON/CSV download + AI-ready prompt generation
- Custom themed confirmation dialog replacing all native browser confirm() popups
- Toast notifications positioned at top-right corner
- Removed back buttons from top-level pages (cleaner sidebar-based navigation)
- Dashboard: "Clear All" button for imports, fixed date display using publish_date
- Added `recharts` dependency for professional chart rendering
- Database: added `likes_count`, `comments_count`, `impressions_count`, `engagement_updated_at` to posts table

### v1.0.0
- Initial release with posts, library, cloud, import/export, calendar, search, tags, analytics, settings, dashboard

## License

Private project. All rights reserved.
