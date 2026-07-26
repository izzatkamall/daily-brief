# Daily Brief — a mini task tracker with an AI-generated summary

A small task-tracking system with three clients sharing **one backend**:

1. **Web app** (React) — create, edit, complete, delete, and filter tasks.
2. **Android app** (Kotlin + Jetpack Compose) — view the list, create a task, mark complete.
3. **AI Daily Brief** — an on-demand button that asks an LLM (Google Gemini) to summarize
   your open tasks (what's overdue, what's due today, and a suggested order). Shown on **both** clients.

Built as a technical assessment. The goal was sensible scope and clean, working end-to-end
integration rather than production polish.

## Architecture

```
   ┌────────────┐        ┌────────────┐
   │  Web (React│        │  Android   │
   │   + Vite)  │        │ (Compose)  │
   └─────┬──────┘        └─────┬──────┘
         │  REST/JSON (Bearer token) │
         └───────────┬───────────────┘
                     ▼
          ┌────────────────────┐
          │   Backend API      │
          │ Node/Express +     │
          │ SQLite (better-    │
          │ sqlite3)           │
          └─────────┬──────────┘
                    │ POST /api/brief
                    ▼
          ┌────────────────────┐
          │  Google Gemini API │  (falls back to a deterministic
          │ generativelanguage │   local summary if no key / on error)
          └────────────────────┘
```

- One backend is the single source of truth. Both clients hit the **same live API**, so a task
  created on the web appears on Android and vice-versa.
- The web dev server proxies `/api` to the backend. Android reaches the host machine's backend
  via `http://10.0.2.2:4000` (the emulator's alias for the host's `localhost`).

## Repository layout

```
test_task/
  backend/    Express + SQLite API (shared by web + android)
  web/        React (Vite) frontend
  android/    Kotlin app (Jetpack Compose)
  README.md   this file
```

---

## Prerequisites

- **Node.js 18+** (developed on v24) and npm — for the backend and web app.
- **Android Studio** (for the Android app) with an emulator or a physical device. The build uses
  JDK 17+ (the JDK bundled with Android Studio works) and Android SDK platform 35.
- A **Google Gemini API key** (free tier) for the real AI brief — optional; without one the app
  still works using a built-in deterministic summary.

---

## 1) Backend (start this first)

```bash
cd backend
npm install
cp .env.example .env      # then edit .env (see below)
npm start                 # serves http://localhost:4000
```

Run the tests:

```bash
npm test                  # 10 API tests (node:test), no network/key required
```

### Configuration (`backend/.env`)

`.env` is git-ignored. Copy `.env.example` and fill it in:

```ini
PORT=4000
AUTH_USERNAME=admin
AUTH_PASSWORD=password

# Leave AI_* blank to use the deterministic fallback brief.
AI_PROVIDER=gemini            # "gemini" | "openai" | "" (blank = fallback)
AI_API_KEY=your_key_here
GEMINI_MODEL=gemini-flash-latest
OPENAI_MODEL=gpt-4o-mini
```

**Getting a Gemini key:** create one at [Google AI Studio](https://aistudio.google.com/app/apikey)
(free tier). Paste it as `AI_API_KEY` and set `AI_PROVIDER=gemini`.

---

## 2) Web app

```bash
cd web
npm install
npm run dev               # serves http://localhost:5173
```

Open http://localhost:5173 and log in with **admin / password**. The dev server proxies `/api`
to the backend on port 4000, so make sure the backend is running.

Features: create / edit / complete / delete tasks, filter by status and priority, and a
**Generate** button for the AI Daily Brief. The login token is kept in `localStorage` so a
refresh stays signed in.

---

## 3) Android app

Open the `android/` folder in **Android Studio**, let it sync, then Run on an emulator.
Or build from the command line:

```bash
cd android
# Point at the JDK bundled with Android Studio and your SDK, e.g. on Windows:
#   JAVA_HOME="C:/Program Files/Android/Android Studio/jbr"
#   ANDROID_HOME="$HOME/AppData/Local/Android/Sdk"
./gradlew :app:assembleDebug

# Install and launch on a running emulator:
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.example.dailybrief/.MainActivity
```

- The app targets the backend at `http://10.0.2.2:4000/` (host `localhost` from the emulator).
  This is set via `API_BASE_URL` in `app/build.gradle.kts` — change it for a physical device
  (use your machine's LAN IP and ensure the phone can reach it).
- Cleartext HTTP is enabled (`usesCleartextTraffic="true"`) so the emulator can talk to the
  local backend over plain HTTP. For a real deployment you'd use HTTPS and drop this.
- Log in with **admin / password**, then view the shared task list, add a task with **+**, and
  mark tasks complete. Tap **Generate** for the AI brief.

**Stack:** Kotlin, Jetpack Compose (Material 3), Retrofit + Gson, Coroutines. Single `:app`
module, `compileSdk 35`, `minSdk 26`.

---

## The AI automation feature

### Which provider and why

**Google Gemini** (`gemini-flash-latest`), via the free tier. It was the fastest to get a
working free key for this task, the `flash` model is quick and cheap for short summaries, and the
REST API is a single unauthenticated-body POST that's easy to wrap. The code is written behind a
small provider abstraction (`backend/src/ai.js`) with an **OpenAI** implementation included too —
switch by setting `AI_PROVIDER=openai` and an OpenAI key, no other changes.

### How it's triggered

**On-demand, via a button** on both the web and Android clients (`POST /api/brief`).

I chose on-demand over a real scheduled daily job deliberately: for a time-boxed assessment it's
simpler to run and demo, needs no scheduler/cron infrastructure, and still exercises the exact
same code path a scheduled job would call. With more time I'd add a nightly cron that generates
and caches the brief (see below).

### How it works

`POST /api/brief` loads the open tasks, categorizes them (overdue / due today / upcoming), builds
a compact prompt, and asks Gemini for a 3–5 sentence brief. **It always degrades gracefully:** if
no key is configured or the API call fails, it returns a deterministic locally-generated summary
instead, so the feature never breaks the UI. The response is tagged with its `source`
(`gemini` or `fallback`) and the clients show which was used.

---

## API contract

Auth is a single hardcoded user; login returns an opaque bearer token (kept in memory).
All `/api/tasks*` and `/api/brief` routes require `Authorization: Bearer <token>`.

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/login` | `{ username, password }` | `{ token, username }` |
| GET | `/api/tasks?status=&priority=` | — | `[ Task ]` |
| POST | `/api/tasks` | `{ title, description, dueDate, priority }` | `Task` |
| GET | `/api/tasks/:id` | — | `Task` |
| PUT | `/api/tasks/:id` | partial task fields | `Task` |
| DELETE | `/api/tasks/:id` | — | `{ ok: true }` |
| POST | `/api/brief` | — | `{ brief, source, generatedAt }` |

```
Task = {
  id, title, description,
  dueDate: ISO date | null,
  priority: "low" | "medium" | "high",
  status:   "open" | "completed",
  createdAt, updatedAt
}
```

---

## Tradeoffs, shortcuts, and what I'd do with more time

**Deliberate scope choices (given the time box):**

- **Auth is intentionally minimal** — a single hardcoded user and an in-memory opaque token, as
  the brief allowed ("auth isn't the focus"). Tokens reset on server restart.
- **AI brief is on-demand**, not a scheduled job (explained above).
- **Android implements the required subset** — view list, create, mark complete, filter, and the
  brief. Edit and delete exist on the web but were left off Android since they weren't required.
- **Android due-date entry is a text field** (`YYYY-MM-DD`) rather than a date picker, to avoid
  extra UI dependencies.
- **SQLite** keeps setup to zero (a single file, no DB server to run).

**With more time I'd add:**

- Real JWT auth with signing, expiry, and refresh; multiple users.
- A scheduled nightly job that generates and **caches** the daily brief (so it's instant and
  doesn't call the LLM on every button press), while keeping the on-demand button for a refresh.
- Automated tests for the web and Android layers (only the backend has tests today).
- Edit/delete and a proper date picker on Android; pull-to-refresh.
- Priority filter on Android (web has it); pagination for large lists.
- Loading/skeleton states and nicer error surfaces throughout.

---

## Notes

- `.env` (backend secrets) and `android/local.properties` (machine SDK path) are git-ignored.
- Default login everywhere: **admin / password**.
