# AI Provider Integration

OfferPilot exposes the AI workflow behind route handlers while keeping the local MVP usable without external API keys.

## Provider Mode

Default:

```env
AI_PROVIDER="local"
```

The local provider calls deterministic rule-based functions:

- JD analysis
- Resume/JD matching
- Project rewrite suggestions
- Interview prep generation

Future remote providers will be added behind the same `AiProvider` interface in `lib/ai/provider.ts`.

OpenAI-compatible mode:

```env
AI_PROVIDER="openai"
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_API_KEY="..."
OPENAI_MODEL="..."
```

The OpenAI-compatible provider uses chat completions with JSON output. If the remote call fails or required environment variables are missing, the provider falls back to the local deterministic result so the app remains usable.

## API Routes

```http
POST /api/ai/analyze-jd
POST /api/ai/match-resume
POST /api/ai/rewrite-project
POST /api/ai/interview-prep
```

These routes currently use the local provider unless `AI_PROVIDER` is changed. Remote provider support must preserve the same output shapes and must not fabricate user experience, dates, companies, degrees, or metrics.

## Remote Provider Safety Rules

- Keep API keys server-side only.
- Validate model output before saving it.
- Preserve the original user-provided facts.
- If a metric is missing, ask for the metric instead of inventing one.
- Store model metadata with saved suggestions when persistence is enabled.
