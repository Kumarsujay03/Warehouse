# Warehouse

A personal Research & Content Warehouse — Notion-inspired workspace for managing content pipelines, research resources, media assets, and projects. Built for single-admin use.

## Overview

Warehouse is a dark, monochrome, desktop-first web application designed to:

- **Manage content** — Create, edit, schedule, and publish posts with hooks, bodies, and metadata
- **Organize research** — Maintain a library of papers, videos, books, articles, and courses
- **Handle media** — Upload, browse, and manage files via Cloudinary
- **Import at scale** — Bulk-import content plans from HTML, JSON, or Markdown files with auto-resource linking
- **Track everything** — Calendar view, global search, tagging, and analytics

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS + shadcn/ui components |
| Database | Supabase (Postgres + RLS) |
| Media | Cloudinary (DAM mode) |
| Auth | Custom JWT sessions + bcrypt |
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
│   │   ├── import/         # Import/Export with templates
│   │   ├── calendar/       # Schedule visualization
│   │   ├── search/         # Global cross-table search
│   │   ├── tags/           # Tag management
│   │   ├── analytics/      # Usage statistics
│   │   ├── settings/       # Profile, avatar, credentials
│   │   └── dashboard/      # Overview & quick actions
│   ├── api/                # API routes (REST)
│   ├── login/              # Auth pages
│   └── change-password/
├── components/
│   ├── layout/             # Sidebar, header, command palette
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

- **Auth** — JWT sessions, bcrypt passwords, forced first-login credential change
- **Feed** — LinkedIn-style card preview with status filtering (Ready/Scheduled/Draft)
- **Posts** — Full CRUD with rich editor, media upload, resource linking, tagging
- **Library** — Resources (papers/videos/books/articles/courses) + Projects, grid/list views
- **Cloud** — Cloudinary browser with folder switching, view modes, download, upload
- **Import** — Parse HTML/JSON/Markdown → preview → validate → save with auto-resource creation
- **Export** — Full JSON backup of all data
- **Calendar** — Monthly view of scheduled posts
- **Search** — Cross-table search (posts, resources, projects, media, tags)
- **Tags** — Many-to-many tagging with color coding
- **Analytics** — Content statistics and category breakdown
- **Settings** — Profile, avatar picker, email/password change, environment status
- **Command Palette** — Ctrl+K navigation
- **Responsive** — Desktop-first with mobile support

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

## Architecture Notes

- All database access uses `service_role` key server-side (API routes/server components)
- Auth is handled at the middleware layer, not via Supabase Auth
- Cloudinary uses DAM mode (dynamic folders via `asset_folder`)
- RLS is enabled but permissive — security is enforced at the application layer
- Designed for future extensibility: AI summarization, semantic search, LinkedIn publishing

## License

Private project. All rights reserved.
