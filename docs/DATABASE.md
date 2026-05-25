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

For local development, the login page includes an email login form. It creates or updates a user by email and is intended for development/testing only. GitHub and Google OAuth remain supported when their credentials are configured.

## Persistence Boundaries

- `profiles`: reusable user experience library.
- `job_descriptions`: raw JD text and extracted analysis.
- `resumes`: base resume snapshots.
- `resume_versions`: JD-specific resume snapshots and match scores.
- `interview_preps`: generated questions and user answer drafts.

All repository functions require `userId` and must scope reads/writes by that user.

## Workspace API

The current UI loads and saves through:

```http
GET /api/workspace
PUT /api/workspace
```

The workspace snapshot includes:

- `profile`
- `jobs`
- `versions`
- `prepDrafts`

If the user is not logged in or the database is not configured, the UI keeps running with local state and shows a non-blocking status message.

## Server Actions

Initial server actions live in `app/actions/persistence.ts` and remain available for narrower future mutations:

- `saveProfileAction`
- `saveJobDescriptionAction`
- `saveResumeVersionAction`
- `saveInterviewPrepAction`

The UI now uses the workspace API for full snapshot save/load when authenticated persistence is enabled.
