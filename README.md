# HikingBuddy

A web app for planning hiking gear: keep a personal **Gear Vault** of everything you own, build **gearlists** for each trip from it, and see the weight breakdown (Base / Worn / Consumable / Total). Inspired by lighterpack.com, but built so that editing your gear never silently changes old gearlists.

## Status
MVP, single user, no server: data stays in your browser, optionally auto-saved to a local file (Chrome/Edge). Live at **https://hikingbuddy.mmalinek.workers.dev**. See [`PRDRequirements/build-status.md`](PRDRequirements/build-status.md).

## Docs
- [`PRDRequirements/PRD-MVP.md`](PRDRequirements/PRD-MVP.md) — product requirements (current scope)
- [`PRDRequirements/build-status.md`](PRDRequirements/build-status.md) — what's built and decided
- [`CLAUDE.md`](CLAUDE.md) — working rules for Claude Code

## Run locally
Requires [Node.js](https://nodejs.org/) (LTS).

```bash
cd app
npm install
npm run dev
```

Then open the address shown in the terminal (usually http://localhost:5173).

## Deployment
Every push to `main` is built and deployed automatically by Cloudflare (Workers, static assets): `npm run build` in `app/`, then `npx wrangler deploy` using `app/wrangler.jsonc`.
