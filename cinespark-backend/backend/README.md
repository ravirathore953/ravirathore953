# CineSpark Backend

A small Express + SQLite API that powers the CineSpark contact form: it validates
submissions, stores them in a local database, and (optionally) emails you a
notification for every new lead.

## What it does

- `POST /api/leads` — public endpoint the website's form submits to. Validates
  the fields, saves the lead to SQLite, and fires off an email notification
  (if SMTP is configured) without making the visitor wait on it.
- `GET /api/leads` — admin-only endpoint to view saved leads. Requires an
  `x-api-key` header matching `ADMIN_API_KEY`.
- `GET /api/health` — simple uptime check.
- Rate limiting (5 submissions / 15 min / IP) and a hidden honeypot field to
  cut down on spam.

## 1. Install

```bash
cd backend
npm install
```

## 2. Configure

```bash
cp .env.example .env
```

Open `.env` and set:

- `ALLOWED_ORIGIN` — the origin(s) your site is served from (where the HTML
  file will be hosted), comma-separated. This is a CORS allow-list.
- `ADMIN_API_KEY` — any long random string; this protects `GET /api/leads`.
- SMTP settings — optional. Leave `SMTP_HOST` blank and the API will still
  save every lead, it just won't email you. Most providers (Gmail, Resend,
  SendGrid, Mailgun, your own mail server) give you SMTP host/port/user/pass
  values to drop straight in.

## 3. Run

```bash
npm run dev     # auto-restarts on file changes (nodemon)
# or
npm start        # plain node
```

The API starts on `http://localhost:4000` by default (change with `PORT`).

## 4. Point the website at it

In `cinespark.html`, near the bottom `<script>` block, set:

```js
const API_BASE = "http://localhost:4000"; // change to your deployed URL
```

When you deploy the backend (Render, Railway, Fly.io, a VPS, etc.), update
`API_BASE` to that public URL and set `ALLOWED_ORIGIN` in `.env` to the
domain the HTML is actually served from.

## 5. View captured leads

```bash
curl -H "x-api-key: YOUR_ADMIN_API_KEY" http://localhost:4000/api/leads
```

Returns the most recent leads as JSON, newest first.

## Data storage

Leads are stored in `backend/data/leads.db` (SQLite, created automatically on
first run). This file is your database — back it up, and if you deploy to a
platform with an ephemeral filesystem (many free tiers), attach a persistent
volume/disk so the file survives restarts, or swap `db.js` for a hosted
Postgres/MySQL database later — the query surface is small (two prepared
statements) so that migration is straightforward.

## Deploying (quick options)

- **Render / Railway / Fly.io**: point them at this `backend/` folder, set
  the same environment variables from `.env`, add a persistent disk mounted
  at `backend/data` for the SQLite file, and expose the app's public URL.
- **A VPS**: `npm install --production`, run with `pm2 start server.js` (or
  a systemd service) behind Nginx/Caddy for HTTPS and set `ALLOWED_ORIGIN`
  to your real domain.

## Security notes

- Never commit your real `.env` file — only `.env.example` is meant to be
  shared.
- Rotate `ADMIN_API_KEY` if it's ever exposed.
- HTTPS is handled by whatever you put in front of this app (a platform's
  built-in TLS, or Nginx/Caddy) — this server itself speaks plain HTTP.
