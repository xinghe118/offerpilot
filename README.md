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
- Web AI settings with a connection test button.
- Print-ready resume export.
- GitHub repository analysis for resume bullets and interview prep.

## Current Progress

Completed:

- Local OfferPilot workspace with dashboard, JD analysis, resume optimization, interview prep, GitHub analysis, profile, and settings pages.
- Optional database/auth foundation with Prisma and Auth.js boundaries.
- OpenAI-compatible AI route layer with local fallback.
- Browser-based AI provider configuration and connection testing.
- Print-ready resume page and export API foundation.
- First production polish pass for loading, error, and success feedback in key flows.

Next planned stage:

- Persist the profile, analyzed JDs, resume versions, and interview prep drafts through the database service layer.

## Local Development

```bash
npm install
npm run dev
```

Authentication is optional for the local MVP. Copy `.env.example` to `.env.local` and set `AUTH_REQUIRED=true` only after configuring `DATABASE_URL`, `AUTH_SECRET`, and at least one OAuth provider.

Database persistence is prepared but not required for the local MVP. See `docs/DATABASE.md` for setup and repository boundaries.

AI API routes are prepared with a local rule-based provider by default. The web Settings tab can configure an OpenAI-compatible endpoint for local testing. See `docs/AI.md` for provider and route details.

PDF export starts with a print-ready resume route. See `docs/PDF_EXPORT.md`.

GitHub repository analysis is available through the workspace and `POST /api/github/analyze-repo`. See `docs/GITHUB_ANALYZER.md`.

Later productization stages include:

- Multi-user saved data wired into the current UI.
- Server-side encrypted AI provider settings.
- Playwright/Puppeteer PDF rendering for production-grade exports.
- Deeper GitHub project analysis with repository file inspection.

See `DEVELOPMENT.md` for the full product plan and implementation roadmap.
