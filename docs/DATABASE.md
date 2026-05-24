# Database Integration

OfferPilot currently runs as a local MVP without requiring a database. Database persistence is prepared behind repository functions and server actions.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL`.
3. Set `AUTH_SECRET`.
4. Configure GitHub or Google OAuth credentials.
5. Generate and apply Prisma schema.

```bash
npx prisma generate
npx prisma db push
```

Then set:

```env
AUTH_REQUIRED="true"
```

## Persistence Boundaries

- `profiles`: reusable user experience library.
- `job_descriptions`: raw JD text and extracted analysis.
- `resumes`: base resume snapshots.
- `resume_versions`: JD-specific resume snapshots and match scores.
- `interview_preps`: generated questions and user answer drafts.

All repository functions require `userId` and must scope reads/writes by that user.

## Server Actions

Initial server actions live in `app/actions/persistence.ts`:

- `saveProfileAction`
- `saveJobDescriptionAction`
- `saveResumeVersionAction`
- `saveInterviewPrepAction`

The current UI still uses local state so the product remains runnable without PostgreSQL. The next step is wiring these actions into the UI when authenticated persistence is enabled.
