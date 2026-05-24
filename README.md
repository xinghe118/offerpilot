# OfferPilot

OfferPilot is an AI job assistant workspace for developers and job seekers.

It is designed around this workflow:

```text
Personal profile -> JD analysis -> resume/profile matching -> AI rewrite suggestions -> interview preparation
```

The first local MVP focuses on:

- Personal profile and project experience library.
- Job description analysis.
- Resume/profile match scoring.
- AI-style project bullet rewriting.
- Interview preparation question generation.

## Local Development

```bash
npm install
npm run dev
```

Authentication is optional for the local MVP. Copy `.env.example` to `.env.local` and set `AUTH_REQUIRED=true` only after configuring `DATABASE_URL`, `AUTH_SECRET`, and at least one OAuth provider.

Database persistence is prepared but not required for the local MVP. See `docs/DATABASE.md` for setup and repository boundaries.

AI API routes are prepared with a local rule-based provider by default. See `docs/AI.md` for provider and route details.

PDF export starts with a print-ready resume route. See `docs/PDF_EXPORT.md`.

Later productization stages include:

- Database login and multi-user saved data.
- Real AI API integration.
- PDF resume export.
- GitHub project analyzer.

See `DEVELOPMENT.md` for the full product plan and implementation roadmap.
