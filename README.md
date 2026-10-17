# CrunchyCast — Crunchyroll Simulcast Release Calendar & Schedule Tracker

A modern React + TypeScript + Tailwind CSS web application that tracks Crunchyroll anime simulcast episode releases, weekly showing times, and projected future schedules from **Today through March 27, 2027** and beyond.

## Features

- **Weekly Simulcast Schedule Grid**: Interactive 7-day calendar starting from today, equipped with a future time-scrubber slider, date picker, and milestone jump pills.
- **Chronological Release Timeline (Today → Mar 27+)**: Day-by-day stream of upcoming episode drops with filters for specific months and **Premieres & Finales Only**.
- **What's On Show Directory**: Full catalog of active and upcoming simulcasts with weekly showing times, run dates, and a dedicated section for upcoming 2027 shows with TBA broadcast times.
- **Confirmed + Projected Weekly Cadence Engine**: Distinguishes confirmed airing timestamps from projected weekly slots.
- **Simulcast Offset & Per-Show Fine-Tuning**: Toggle between `+1h Estimated Crunchyroll Drop` and `Raw JP Broadcast Time`, plus per-show custom hour offsets.
- **Watchlist & Calendar Export**: Save favorite shows locally and export `.ics` calendar files or add individual episodes to Google Calendar.

## Deploying to Vercel

This repository is pre-configured with [`vercel.json`](./vercel.json) for zero-configuration deployment on Vercel:

1. Go to [vercel.com/new](https://vercel.com/new) and import `mirrorsedgepro-stack/CR-Watcher`.
2. Vercel will automatically detect **Vite** (`npm run build`, output directory `dist`).
3. Click **Deploy** — no environment variables or API keys are required.

## Local Development

```bash
npm install
npm run dev
```
