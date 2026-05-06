# RxNorm Taiwan — Drug Identification System

Group 6 · NTHU EECS Rural Smart Healthcare Studio · 2026

## Features

- **Drug Search** — Search NHI drug dictionary (25 sample drugs) by name (EN/中文), ingredient, NHI code, or ATC code. Confidence scoring on all results.
- **Scan Rx** — Simulate OCR prescription scanning. Upload a photo or run demo to see drug matching in action.
- **My Medications** — Personal medication list with reminder toggles. Staff can export as CSV.
- **Admin Dashboard** — Dataset quality metrics, review queue (confirm/reject unknown drugs), dataset refresh pipeline simulation. Admin-only.

## Role-Based Access

| Account | Password | Role | Extra access |
|---|---|---|---|
| `admin` | `admin123` | Admin | Admin Dashboard + all Staff features |
| `staff` | `staff123` | Hospital Staff | Routing trace, scan history export |
| `doctor` | `doctor123` | Hospital Staff | Same as staff |
| *(no login)* | — | Guest / Public | Drug search + OCR scan only |

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Deploy to Vercel

Option A — Vercel CLI:
```bash
npm install -g vercel
vercel
```

Option B — GitHub:
1. Push this repo to GitHub
2. Go to vercel.com → New Project → Import your repo
3. Click Deploy (Vercel auto-detects Vite — no config needed)

## Tech Stack

- React 18 + Vite
- No external UI library (pure inline styles)
- Auth: in-memory JWT simulation (replace with FastAPI JWT in production)
- Drug data: 25 hardcoded NHI sample drugs (replace with full NHI CSV via papaparse)

## Production TODO

- [ ] Connect to FastAPI backend (POST /auth/login → real JWT)
- [ ] Load full NHI CSV (95MB) via papaparse + Web Worker
- [ ] Add real Tesseract.js OCR on image upload
- [ ] Connect RxNorm API for live drug matching
- [ ] PostgreSQL for scan history and review queue persistence
