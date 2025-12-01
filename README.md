Citia.ai Frontend
=================

Next.js 14 App Router experience for the citia.ai SaaS platform. It delivers the dashboard, topic manager, brand manager, and alerts center described in the spec, powered by mock API routes + TanStack Query so the UI can be exercised before the real backend ships.

## Tech stack

- Next.js 14.2 App Router + React 18.3
- Typescript + strict mode
- TailwindCSS + shadcn/ui (New York theme)
- TanStack Query for client data fetching + caching
- Chart.js / react-chartjs-2 for the citation share graph
- Auth0 provider wrapper (`@auth0/nextjs-auth0`) wired for future auth flows

## Getting started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to use the dashboard. The mock API routes are exposed under `/api/*` and return deterministic data sourced from `lib/mock-data.ts`.

Environment variables live in `env.local.sample`. Copy to `.env.local` and configure the Auth0 keys when ready:

```
cp env.local.sample .env.local
```

## Backend data sources

All API routes now run on the Node runtime and attempt to talk to Google Cloud when credentials are provided:

| Service | How to enable |
| --- | --- |
| BigQuery (`/api/citations`, `/api/citation-share`, `/api/competitors`, `/api/engine-breakdown`) | Set `GCP_PROJECT_ID`, `GCP_SERVICE_ACCOUNT_B64` (base64-encoded service-account JSON), `BIGQUERY_DATASET`, and optional table overrides (defaults: `ai_raw_answers`, `ai_mentions_normalized`, `citation_share_scores`). |
| Firestore (`/api/topics`, `/api/entities`, `/api/alerts`) | Set the same GCP env vars plus optional collection overrides (`FIRESTORE_TOPICS_COLLECTION`, etc.). |

If any of the required env vars are missing, the server gracefully falls back to the deterministic fixtures defined in `lib/mock-data.ts`, so local development keeps working without Google Cloud access.

## Frontend modules

| Page | Path | Highlights |
| --- | --- | --- |
| Dashboard | `/` | AI visibility score card, citation-share trend (Chart.js), engine comparison, competitor grid, alerts summary, latest citations table. |
| Topic Manager | `/topics` | Lists Firestore topics, displays seeds, and provides a dialog to seed new query batches (react-hook-form + zod). |
| Brand Manager | `/brands` | Entity inventory table w/ domains & synonyms, ability to add brands, and status toggles to pause mention tracking. |
| Alerts Center | `/alerts` | Activity feed for triggered alerts plus configurable thresholds + notification preferences. |
| Settings | `/settings` | Placeholder card explaining upcoming RBAC/billing controls. |

Shared UI primitives live in `components/ui/*` (shadcn). Layout shell is provided by `components/layout/sidebar.tsx`, `components/layout/top-nav.tsx`, and `components/providers/app-providers.tsx`.

## Mock API surface

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/citations` | GET/POST | Filterable list of normalized citations (topic, brand, engine). |
| `/api/citation-share` | GET | Time-series data for citation share per entity and engine. |
| `/api/competitors` | GET | Aggregated competitor metrics used by the dashboard cards. |
| `/api/engine-breakdown` | GET | Engine-by-engine share and mention counts. |
| `/api/topics` | GET/POST | Topic metadata + query seeds used by the topic manager. |
| `/api/entities` | GET/POST | Brand/domain/synonym mappings surfaced in the brand manager. |
| `/api/alerts` | GET/POST | Scheduler-driven alerts consumed by the alerts center. |

`lib/api.ts` centralizes fetch helpers and exposes CRUD helpers (e.g., `api.createTopic`). Client hooks in `hooks/*` wrap these endpoints with TanStack Query for cache-aware access.

## Auth + providers

`components/providers/app-providers.tsx` composes:

- Auth0 `UserProvider`
- `QueryClientProvider` (+ devtools)
- `ThemeProvider` (light/dark with next-themes)

The layout file (`app/layout.tsx`) wraps every page with these providers and renders the sidebar/top-nav shell so the experience feels like the final SaaS app.

## Testing & linting

- `npm run lint` — runs Next + ESLint against the repo
- `npm run dev` — development server with hot reload

> Note: the project currently uses mock data. Once the backend endpoints are available, update the API helpers/hooks to call the real services (BigQuery, Firestore, etc.) without changing the UI surface.
