## Learning Companion

Learning Companion is a web app I built to help students track their study tasks, build daily/weekly streaks, and share their progress with parents or teachers.  
It is built with **Next.js 16 (App Router)**, **React 19**, **Supabase**, **TypeScript**, and **Tailwind CSS**, and supports **offline usage** and **real‑time updates**.

This is my personal project and it’s already deployed to a **public URL** (see the *Live Demo* section below).

---

## Live Demo

**Deployed app (public URL):**

- **URL**: `https://learning-companion-alpha.vercel.app/`



The deployed site is built from the same code contained in this repository.

---

## Features

- **Authentication**
  - Email + password login and signup using **Supabase Auth**
  - Persistent session handling via a global `AuthContext`

- **Task Management**
  - Create study tasks marked as **daily** or **weekly**
  - Mark tasks as complete / incomplete
  - Delete tasks when no longer needed
  - Tasks are associated with the signed‑in user

- **Streaks & Dashboard**
  - Calculates a **current streak** (consecutive days with completed tasks)
  - Shows a **7‑day completion chart** using Recharts
  - Summary of weekly progress

- **Sharing Progress**
  - Generate a **share link** for parents or guardians
  - `/share?token={userId}` shows a **read‑only** view of a student’s tasks
  - Uses Supabase **Realtime** to update the shared view live as the student works

- **Offline‑First & Sync**
  - Local caching of tasks in `localStorage`
  - Queue of offline operations (insert/update/delete) that syncs when the user comes back online
  - Uses a simple service worker (`public/sw.js`) to cache key static assets

- **Backup & Restore**
  - Download a JSON backup of all current tasks
  - Restore tasks from a JSON backup file

- **PWA / Mobile‑Friendly**
  - Web App Manifest (`public/manifest.json`)
  - Custom icons, theme color, and standalone display mode
  - Service worker registration in `ServiceWorkerScript.tsx`

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, `src/app` directory)
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS 4
- **Backend as a Service**: Supabase (Auth, Postgres, Realtime)
- **Charts**: Recharts
- **Date Utilities**: date‑fns
- **Icons**: lucide‑react
- **Deployment**: Optimized for Vercel

---

## Project Structure (High‑Level)

- `src/app/layout.tsx`  
  Root layout: sets up HTML shell, metadata, and wraps the app with `AuthProvider` and service worker registration.

- `src/app/page.tsx`  
  Home page: shows a loading state, the auth form for unauthenticated users, or the main `App` view when signed in.

- `src/app/App.tsx`  
  Main authenticated view: header with user greeting + logout, and tabs to switch between **Tasks** and **Dashboard**.

- `src/components/AuthForm.tsx`  
  Email/password signup & login form powered by Supabase.

- `src/components/TaskManager.tsx`  
  UI for creating, listing, completing, and deleting tasks, plus **backup/restore** and **share link** generation.

- `src/components/Dashboard.tsx`  
  Streak card and weekly progress line chart for the current user.

- `src/components/ShareView.tsx`  
  Read‑only, shareable dashboard for a given `token` (user id) from the URL. Subscribes to Supabase realtime changes.

- `src/components/TaskContext.tsx`  
  React Context that:
  - Loads tasks from Supabase (when online) or from `localStorage` (offline)
  - Keeps a queue of pending operations for offline mode
  - Subscribes to realtime DB changes

- `src/context/AuthContext.tsx`  
  Handles authentication state, exposes `user`, `session`, `loading`, and `signOut`.

- `src/lib/supabaseClient.ts`  
  Supabase client initialization.

- `src/types/task.ts`  
  TypeScript interface describing the `Task` shape stored locally and in Supabase.

- `public/manifest.json` & `public/sw.js`  
  PWA manifest and service worker for caching.

---

## Prerequisites

- **Node.js**: v18 or later (recommended for Next.js 16)
- **npm** (or **pnpm** / **yarn** / **bun**) – this README uses `npm` commands
- A **Supabase project** with:
  - A table named `tasks` (see below)

### Supabase Table: `tasks`

Create a table named `tasks` with at least the following columns:

- **id**: `uuid` (primary key, default `uuid_generate_v4()` or `gen_random_uuid()`)
- **user_id**: `uuid` or `text` (references `auth.users.id` or stores the Supabase user id)
- **title**: `text`
- **type**: `text` (`'daily'` or `'weekly'`)
- **completed**: `boolean` (default `false`)
- **completed_at**: `timestamptz` (nullable)
- **created_at**: `timestamptz` (default `now()`)

Also ensure **Row Level Security (RLS)** is configured appropriately so that each user only sees their own tasks, and the anonymous share token (`user_id`) can read tasks for the shared user if desired.

---

## Environment Variables

This project reads the Supabase URL and anon key from `src/lib/supabaseClient.ts` directly.  
For a more secure setup in production, I would move these into environment variables, but for this demo it is acceptable to keep them here.

Current client initialization (in `src/lib/supabaseClient.ts`):

- **SUPABASE_URL** – your Supabase project URL  
- **SUPABASE_ANON_KEY** – your public anon key

If you refactor to use env vars, you would define (for example):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

and update `supabaseClient.ts` accordingly.

---

## Getting Started (Run Locally)

Follow these steps to set up and run the project on your own machine.

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/learning-companion.git
cd learning-companion
```

> Replace `YOUR-USERNAME` with the actual GitHub username or organization name.

### 2. Install Dependencies

```bash
npm install
```

This will install Next.js, React, Supabase, Tailwind, Recharts, and all other required dependencies.

### 3. Configure Supabase

1. Create a new project at `https://supabase.com/`.
2. Create the `tasks` table as described above.
3. Copy your **Supabase URL** and **anon key** from the Supabase dashboard.
4. Open `src/lib/supabaseClient.ts` and replace the placeholder values (if any) with your actual keys:
   - `supabaseUrl = 'https://YOUR-PROJECT-URL.supabase.co'`
   - `supabaseAnonKey = 'YOUR-ANON-KEY'`

> The committed project already includes working keys for my Supabase project so the demo works out of the box.  
> If you fork this repo, you should use your own Supabase project and keys.

### 4. Run the Development Server

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

You should see the **Learning Companion** login/sign‑up page.

### 5. Build for Production (Optional)

```bash
npm run build
npm start
```

This builds the optimized Next.js app and serves it in production mode.

---

## Using the App

- **Sign Up / Sign In**
  - Use the email/password form on the home page.
  - On first use, sign up with a valid email; Supabase can send a confirmation email depending on your project settings.

- **Create Tasks**
  - In the **Tasks** tab, type a task title (e.g. “Math practice 30 minutes”).
  - Choose **Daily** or **Weekly**.
  - Click **Add** to create the task.

- **Complete Tasks**
  - Click **Mark Done** on a task card to mark it complete.
  - The completion time is stored and used for streaks and charts.

- **View Dashboard**
  - Switch to the **Dashboard** tab.
  - See your current streak and a 7‑day line chart of task completions.

- **Share Progress**
  - In the **Tasks** tab, click **Share with Parent**.
  - A link is copied to your clipboard (e.g. `/share?token=<your-user-id>`).
  - Send this link to a parent/teacher; they will see a live, read‑only view of your progress.

- **Backup & Restore**
  - **Download Backup**: exports all tasks for the current user as a `.json` file.
  - **Restore Backup**: choose a previously exported `.json` file to restore tasks.

- **Offline Behavior**
  - If you go offline, the app:
    - Uses locally cached tasks from `localStorage`.
    - Queues changes (adds/completions/deletions).
  - When you come back online, it tries to sync the queue to Supabase.

---

## Deployment

This project is designed to be deployed on **Vercel** (the recommended platform for Next.js):

1. Push the repository to GitHub.
2. Go to Vercel and import the project from GitHub.
3. Configure any environment variables if you refactor Supabase keys to env vars.
4. Deploy – Vercel will build and host the app automatically.

This app is currently deployed to the public URL listed in the **Live Demo** section at the top of this README.

---

## Notes & Limitations

- This is a personal project, so the Supabase anon key is intentionally kept on the client for simplicity.
- For a production‑grade app, you would:
  - Move secrets into environment variables.
  - Tighten Supabase Row Level Security policies.
  - Add more robust error handling and input validation.

---

## License

I’m sharing this repository mainly for learning and portfolio purposes. If you reuse or modify it, please give credit and be careful not to ship it as‑is to production without tightening security and configuration.

