# SGD-MYR Exchange Rates Platform

Express-powered API plus Python Playwright scraper that tracks SGD to MYR exchange rates from CIMB Clicks, Wise, and Western Union, sending each snapshot straight to Supabase.

## What It Does
- Launches Chromium via Playwright with light anti-bot hardening.
- Scrapes CIMB Clicks, Wise, and Western Union for the current rate.
- Sends each run straight to your Supabase table (defaults to `exchange_rates`).
- Exposes an Express API (`/api/v1/rates`, `/api/v1/rates/latest`, `/api/v1/health`) that serves the stored readings directly from Supabase and a token-gated `/auth/verify` helper route.

## Requirements
- Node.js 18+
- npm 9+ (ships with Node 18)
- Python 3.10+ (for the optional scraper)
- Playwright browser binaries (`playwright install`) if you plan to run the scraper
- Supabase project (optional but recommended for persistence)

## Environment Variables
Create a `.env` file in the repository root (or supply the variables through your deployment platform):

```ini
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_KEY=YOUR_SERVICE_ROLE_OR_ANON_KEY
SUPABASE_TABLE=exchange_rates   # optional override
BASE_CURRENCY=SGD               # optional override
TARGET_CURRENCY=MYR             # optional override
API_BEARER_TOKEN=super-secure   # optional auth token for /auth routes
CORS_ALLOWED_ORIGINS=https://example.com,https://app.example.com
PORT=5000
```

Omit `API_BEARER_TOKEN` to disable auth checks for the helper routes.

## Running the Express API
```bash
npm install              # installs dependencies for the server workspace
npm run build            # builds the Vite client into client/dist (required before start/deploy)
npm run dev              # starts the Express server with nodemon
# or
npm start                # runs the server with Node
```

Key endpoints (served from `server/`):
- `GET /api/v1/rates` - most recent rows (optional `?limit=10`).
- `GET /api/v1/rates/latest` - the freshest rate per platform.
- `GET /api/v1/health` - simple health status plus Supabase configuration flag.
- `GET /auth/verify` - requires `API_BEARER_TOKEN`; responds with `{ authenticated: true }` on success.

### Deploying to Vercel
The included `vercel.json` directs all requests to `server/server.js`, which exports the Express app for `@vercel/node`. After configuring environment variables in Vercel, run:
```bash
vercel deploy
```
Vercel should use `npm run build` as the Build Command so the client bundle exists before the serverless function boots.

## Frontend (Vite + React)
The client app lives in `client/` and is scaffolded with Vite.

```bash
npm run client:dev       # start the Vite dev server
npm run client:build     # produce production assets in client/dist
```

During local or hosted runs, the Express server serves the prebuilt assets from `client/dist`. If the folder is missing, rebuild the client before starting the API.

## Python Tooling & Scraper
- Install dependencies: `python -m pip install -r scripts/requirements.txt`
- Scrape and insert latest rates: `python -m scripts.deploy --scrape`
- Preview without inserting: `python -m scripts.deploy --scrape --dry-run`
- Logs show which provider selectors matched, making it easier to adjust scrapers when a page changes. Core scraper logic lives in `scripts/utils/rates_scraper.py`.

## Automation
- `.github/workflows/update_exchange_rates.yml` schedules the scraper to run in GitHub Actions. Ensure repository secrets `SUPABASE_URL` and `SUPABASE_KEY` are configured before enabling the workflow.

## Troubleshooting
- **Selectors failing:** review the scraper logs and update the CSS selectors in `scripts/utils/rates_scraper.py` when necessary.
- **Supabase insert skipped:** confirm `.env` is loaded (handled through `server/utils/config.js`), and verify credentials are correct and have insert permissions.
- **Playwright issues:** rerun `playwright install` after dependency upgrades, and ensure headless mode is allowed in your environment (CI uses headless automatically).
- **API returns 503:** Supabase credentials are missing or still set to the placeholder values.

## License
MIT. See `LICENSE` if provided, otherwise assume standard MIT usage rights.
