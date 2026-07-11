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

Backend goes on Railway or Render, just needs the env vars from `.env.example`. Frontend
goes on Vercel with `NEXT_PUBLIC_API_URL` pointed at wherever the backend ends up. Update
`CORS_ORIGIN` on the backend once you know the frontend's actual URL.
