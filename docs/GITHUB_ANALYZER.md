# GitHub Project Analyzer

OfferPilot includes a GitHub project analyzer for turning repositories into resume-ready project material.

## API

```http
POST /api/github/analyze-repo
```

Input:

```json
{
  "repoUrl": "https://github.com/user/repo"
}
```

Output:

- Repository owner/name.
- Description.
- Stars.
- Primary language.
- Inferred tech stack.
- README-derived feature clues.
- Architecture summary.
- README quality feedback.
- Resume bullets.
- Interview questions.

## GitHub Rate Limits

The analyzer works with public GitHub APIs. For higher rate limits, set:

```env
GITHUB_TOKEN=""
```

Security rules:

- The token is server-side only.
- Repository code is not executed.
- The first implementation fetches metadata, language stats, and README only.
