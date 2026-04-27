# Capek-Web — New Project Context for AI Assistants

> **How to use this file:** Paste it as context at the start of a conversation with your AI assistant before asking it to scaffold or build a website. It tells the AI exactly what technologies and conventions to use so the finished project can be deployed to Capek-Web without changes.

---

## 1. What is Capek-Web?

Capek-Web is a production Linux server that hosts multiple websites. It runs:

- **nginx** as the public-facing reverse proxy (handles TLS, ports 80/443)
- **PM2** to manage Node.js applications as persistent processes
- **Node.js v20** and **npm**
- **systemd** for any non-Node services (Python/Gunicorn, etc.)

Every app runs on an **internal port** (e.g. 3010, 3006, 5010). nginx receives public traffic and forwards it to that internal port. The developer never deals with TLS, nginx config, or port assignment — that is handled by the server operator (Angel) at deploy time.

---

## 2. Preferred Tech Stack

Use this stack unless there is a specific reason not to. It matches the existing apps already running on Capek-Web and makes deployment straightforward.

| Layer | Choice | Notes |
|---|---|---|
| Language | **TypeScript** (strict) | All source files `.ts` / `.tsx` |
| Runtime | **Node.js v20** | Already installed on server |
| Framework | **Next.js** (App Router) | SSR, SSG, API routes — all supported |
| Package manager | **npm** | Do not use yarn or pnpm |
| Database (optional) | **Prisma + SQLite** | Default choice; see §5 |
| Styling | **Tailwind CSS** | Recommended; not required |
| Auth (if needed) | **NextAuth.js** | Integrates cleanly with Next.js |

**Do not** use Docker, Bun, Deno, or any runtime other than Node.js v20 without prior discussion.

---

## 3. Required `package.json` Scripts

Your `package.json` **must** include the following scripts. PM2 calls `npm run build` once, then `npm start` to keep the process alive.

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start -p ${PORT:-3000}",
    "lint": "next lint"
  }
}
```

**Key rules:**
- `start` **must** respect the `PORT` environment variable. Next.js does this with `-p ${PORT:-3000}`. The `3000` here is only a local fallback — the server operator assigns the real port at deploy time.
- Never hardcode the production port anywhere in the codebase.
- `build` must complete without errors before the app can be deployed.

---

## 4. Project Structure Conventions

```
my-app/
├── app/                  ← Next.js App Router pages and layouts
├── components/           ← Shared React components
├── lib/                  ← Utility functions, DB client, helpers
├── prisma/               ← (if using DB) schema + migrations
│   ├── schema.prisma
│   ├── migrations/
│   └── data/             ← SQLite .db files live here (gitignored)
├── public/               ← Static assets
├── .env.example          ← REQUIRED — committed to repo, no real secrets
├── .gitignore            ← REQUIRED — see rules below
├── next.config.ts
├── package.json
└── tsconfig.json
```

### `.gitignore` — required entries

```gitignore
# Environment
.env
.env.local
.env.*.local

# Database files — NEVER commit these
prisma/data/*.db
prisma/data/*.db-journal
prisma/data/*.db-shm
prisma/data/*.db-wal

# Build output
.next/
node_modules/
```

---

## 5. Environment Variables

All configuration and secrets go in `.env`. **Never hardcode** API keys, database paths, passwords, or URLs in source code.

### Rules

1. Commit a complete `.env.example` with every variable the app needs, using placeholder values and a comment explaining each one.
2. `.env` itself is always in `.gitignore`.
3. The real `.env` is created manually on the server by the operator after deploy.
4. When asking the AI to generate code that reads env vars, always use `process.env.VARIABLE_NAME`.

### Example `.env.example`

```env
# Application
NODE_ENV=production
PORT=3000                         # Overridden by the server at deploy time

# Database (Prisma + SQLite)
DATABASE_URL="file:./prisma/data/app.db"

# Auth (NextAuth.js)
NEXTAUTH_SECRET="replace-with-a-strong-random-string"
NEXTAUTH_URL="https://yourdomain.com"

# Example third-party API key
SOME_API_KEY="your-api-key-here"
```

---

## 6. Database — Prisma + SQLite

If the app needs persistent data, use **Prisma with SQLite** by default. It requires no separate database service and works perfectly on Capek-Web.

### Setup (local development)

```bash
npm install prisma @prisma/client
npx prisma init --datasource-provider sqlite
# Edit prisma/schema.prisma, then:
npx prisma migrate dev --name init
```

### Deployment rules (critical)

| Command | On server? | Notes |
|---|---|---|
| `npx prisma migrate deploy` | ✅ Yes | Safe; applies pending migrations; no-op if none |
| `npx prisma generate` | ✅ Yes | Regenerates client after `npm install` |
| `npx prisma migrate dev` | ❌ Never | Dev-only; creates shadow DB |
| `npx prisma migrate reset` | ❌ Never | Drops all data |
| `npm run db:seed` | ❌ Never | Seed data is local-only |

- The `.db` file lives in `prisma/data/` and is **never committed to git**.
- The operator creates or migrates the database file on first deploy using `prisma migrate deploy`.

---

## 7. Existing Projects as Examples

These apps already run on Capek-Web using the same conventions. Use them as a reference for the expected pattern.

| App | Domain | Stack | Notes |
|---|---|---|---|
| **Launchpad** | ignite.deals | Next.js + Prisma + SQLite | Full-stack; best reference for this stack |
| **bartonprints3d** | bartonprints3d.com | Next.js | Frontend-focused site |
| **CSA** | stik.dog | Node.js (frontend + backend) | Separate frontend and backend processes |
| **portfolio** | thehomelab.dev | Next.js | Simple portfolio site |

If your project is purely a **static site** (no server-side logic, no API), it can be served directly by nginx with no Node.js process. Discuss this with the operator first.

---

## 8. Developer Handoff Checklist

When the project is ready to deploy, provide the operator (Angel: angel@thehomelab.dev) with:

- [ ] **Git repository URL** — public or shared access
- [ ] **`.env.example`** — must be committed to the repo; list every variable with a description
- [ ] **Required `.env` values** — the actual secrets/values for production (send securely, not in the repo)
- [ ] **One-time local setup steps** — anything that only runs locally (seeding, fixtures, etc.) — clearly mark these as local-only
- [ ] **Domain name** (if already known)
- [ ] **Any external services** the app depends on (email provider, payment gateway, etc.)

---

## 9. What the Operator Handles (not your concern)

The following are handled by Angel at deploy time. You do not need to configure or document these:

- Assigning the internal port
- Starting the app with PM2 and saving the process list
- Writing the nginx reverse proxy configuration
- Obtaining and renewing the TLS certificate (Let's Encrypt / Certbot)
- Registering the domain with DDNS
- Creating the `.env` file on the server
- Running `npm install`, `npm run build`, and `npx prisma migrate deploy` on the server

---

## 10. Out of Scope — Do Not Do These

| Rule | Why |
|---|---|
| No Docker or containers | Not used on Capek-Web |
| No hardcoded ports | Port is assigned by the operator at deploy time |
| No `yarn` or `pnpm` | Use `npm` only |
| No PostgreSQL without discussion | Requires a separate service; SQLite is preferred |
| No `prisma migrate reset` in any script | Destroys production data |
| No `db:seed` script that runs on start | Only seed locally |
| No committing `.env` or `.db` files | Must be in `.gitignore` |
| No self-signed TLS or custom cert setup | TLS is handled by Certbot on the server |
| No Bun, Deno, or non-Node runtimes | Node.js v20 only |

---

*This document describes the Capek-Web deployment environment as of April 2026.*
