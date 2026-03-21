# OpenClaw Command Center

A small Next.js (App Router) dashboard intended to be deployed on **Netlify**.

## Features (MVP)

- Cookie-based password auth (`httpOnly` cookie)
- Dashboard layout with extension points
- Logs viewer (server-side route reads a configured log file)
- Placeholder panel for background processes (next step: wire to OpenClaw / a registry)

## Local dev

```bash
pnpm dev
```

## Environment variables

- `CC_PASSWORD` (required): password used for login + cookie value
- `OPENCLAW_LOG_PATH` (optional): path to the OpenClaw gateway log file

## Netlify deployment notes

This project uses Next.js API routes for auth + data.

On Netlify:
- Set `CC_PASSWORD` in Site settings → Environment variables.
- Make sure Next.js runtime support is enabled (Netlify Next.js adapter/plugin).

Security note:
- This is **shared-password** auth (no users). Good enough for a small private dashboard.
- For a team, switch to Netlify Identity / OAuth and sign cookies/JWTs.
