# CrunchyCast — Crunchyroll Simulcast Release Calendar & Schedule Tracker

A modern, mobile-ready React + TypeScript + Tailwind CSS web application (and installable PWA) that tracks Crunchyroll anime simulcast episode releases, weekly showing times, and projected future schedules from **Today through March 27, 2027** and beyond.

## Features

- **Weekly Simulcast Schedule Grid**: Interactive 7-day calendar starting from today, equipped with a future time-scrubber slider, date picker, milestone jump pills, and a mobile day-of-week quick selector.
- **Chronological Release Timeline (Today → Mar 27+)**: Day-by-day stream of upcoming episode drops with filters for specific months and **Premieres & Finales Only**.
- **What's On Show Directory**: Full catalog of active and upcoming simulcasts with weekly showing times, run dates, and a dedicated section for upcoming 2027 shows with TBA broadcast times.
- **Release Density Heatmap & Binge-Ready Finale Finder**: Monthly release density heatmap (Oct 2026 → Mar 27, 2027) plus a Finale Finder showing season progress bars and the exact date each series completes its run.
- **Episode "Watched" Progress Tracker & Backlog Drawer**: Mark episodes as watched (`✓`) across all views and manage unwatched aired episodes from your Watchlist in a slide-out Backlog drawer.
- **Multi-Device Sync, AniList Import & Live Webcal Subscription**:
  - Generate a shareable `?wl=...` URL to sync your Watchlist across PC and phone.
  - Import your *Watching* and *Planning* anime directly from any public **AniList username**.
  - Subscribe to a live auto-updating `webcal://` calendar feed powered by the Vercel Serverless Function at [`/api/calendar`](./api/calendar.js).
- **Sub / English Dub Estimator & Timezone Switcher**: Switch between `Sub: CR Drop (+1h Est.)`, `Sub: JP TV Broadcast`, and `Dub: Est. Simuldub (+2w)`, and view times in your Local Timezone, JST, PT, ET, UK, or UTC.
- **Mobile & PWA Ready**: Thumb-friendly bottom navigation bar, horizontal swipeable carousels, collapsible mobile filter drawer, native-style bottom-sheet modals, and a Web App Manifest for "Add to Home Screen" installation on iOS & Android.

## Deploying to Vercel

This repository is pre-configured with [`vercel.json`](./vercel.json) and [`api/calendar.js`](./api/calendar.js) for zero-configuration deployment on Vercel:

1. Go to [vercel.com/new](https://vercel.com/new) and import `mirrorsedgepro-stack/CR-Watcher`.
2. Vercel will automatically detect **Vite** (`npm run build`, output directory `dist`) and deploy `/api/calendar` as a Serverless Function.
3. Click **Deploy** — no environment variables or API keys are required.

## Local Development

```bash
npm install
npm run dev
```
