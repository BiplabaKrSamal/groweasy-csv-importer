# GrowEasy CSV Importer

Upload any lead export (Facebook, Google Ads, another CRM, a plain spreadsheet) and it gets
mapped into GrowEasy's CRM schema, whatever the column layout looks like.

## Flow

1. Upload a `.csv` (drag and drop or file picker). Nothing hits the server yet.
2. Preview. Parsed in the browser into a scrollable table with sticky headers, no AI involved.
3. Confirm. This is what actually sends the file to the backend.
4. Extract. Backend batches the rows, maps each batch through an LLM, then re-validates
   everything against the actual business rules before it goes back to the client (the model's
   output isn't trusted blindly). Results stream back over SSE as each batch finishes.
5. Result. Imported/skipped tables fill in live while batches are still coming in.

## Layout

```
backend/    Express + TypeScript API
frontend/   Next.js + TypeScript UI
samples/    a few CSVs in different layouts to throw at it
```

## Running it

Needs Node 20+.

```bash
# backend
cd backend
cp .env.example .env   # set AI_PROVIDER and its key
npm install
npm run dev              # localhost:8080

# frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev               # localhost:3000
```

or just `docker compose up --build` after filling in `backend/.env`.

Then open localhost:3000 and upload one of the files from `samples/`.

## AI provider

`AI_PROVIDER=anthropic|openai|gemini` in `backend/.env` picks the model. Each adapter under
`backend/src/services/aiProviders` is just a `fetch` call to that provider's API, nothing
fancier, so swapping providers is a one-line change, not a rewrite.

There's a fourth option, `AI_PROVIDER=mock`, which skips the LLM call entirely and runs
`aiProviders/mock.ts` instead: plain header-name + keyword matching against the same CRM
schema, same batching/streaming/validation path, just no network call and no key. It's what
the hosted demo link runs by default so the app works without anyone needing to hand out an
API key. It handles the layouts in `samples/` well but won't generalize to arbitrary exports
the way the real thing does, that's the actual point of the assignment. The API response
includes an `engine` field (`"mock"` or the real provider name) and the UI shows a small
badge when it's running in mock mode, so it's never pretending to be doing more than it is.

## Rules

These come from the assignment brief and are checked twice: once in the prompt itself
(`utils/prompt.ts`) and again in code (`services/validator.ts`), so if the model drifts on
something the bad value gets caught rather than passed through.

- `crm_status` has to be one of GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE, or blank
- `data_source` has to be one of leads_on_demand, meridian_tower, eden_park, varah_swamy,
  sarjapur_plots, or blank
- `created_at` needs to parse with `new Date(...)`. if it doesn't, the date gets dropped, not
  the whole record
- extra emails/phone numbers on a row get appended into `crm_note`
- a row with no email and no mobile number gets skipped

## Other stuff in here

- batching with bounded concurrency and retry + backoff on failed batches (`utils/batching.ts`)
- results stream over SSE instead of one big blocking response at the end
- virtualized tables so a huge CSV doesn't choke the browser (`VirtualTable.tsx`)
- light/dark toggle, remembers your choice
- backend unit tests, `cd backend && npm run test`
- docker compose for both services

## Deploying

Both services deploy from `render.yaml` in the repo root — Render's "New Blueprint" reads it
and provisions the backend (Node web service) and the frontend (static site) together. The
blueprint defaults `AI_PROVIDER=mock` and `CORS_ORIGIN=*`, so the first deploy needs zero
manual input beyond one field: `NEXT_PUBLIC_API_URL` on the frontend service, set to the
backend's Render URL once it's live. To run the backend against a real model instead: set
`AI_PROVIDER` and the matching API key in Render's dashboard, and tighten `CORS_ORIGIN` from
`*` to the frontend's actual URL once both are stable.

The frontend deploys as a static site (`runtime: static`, `staticPublishPath: out`), not a
Node service, since the app has no API routes or server actions, everything talks to the
Express backend over `NEXT_PUBLIC_API_URL`. `next build` runs with `STATIC_EXPORT=true` set
only in this specific build command, not in `next.config.js` directly, since a plain export
build can't run `next start`, which the Dockerfile still needs for local/Docker use.

`frontend/vercel.json` is also still in the repo if Vercel is preferred instead, it works the
same way (`Add New Project`, no manual build config needed), but the live deployment here
runs entirely on Render.
