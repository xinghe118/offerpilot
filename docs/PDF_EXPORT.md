# PDF Export

OfferPilot currently supports a print-ready resume page:

```text
/resume/print
```

The page is designed for browser print or "Save as PDF" and uses normal selectable text rather than screenshot-based output.

## Current Behavior

- The local MVP renders a sample resume from seed data.
- The app header links to the print preview.
- `POST /api/resume-versions/export-pdf` returns the print URL and marks the export as `print-ready`.

## Production Export Plan

After resume versions are persisted:

1. Render a version-specific route such as `/resume/:versionId/print`.
2. Use Playwright or Puppeteer server-side to open that route.
3. Export to PDF with selectable text.
4. Store the file in S3/Supabase Storage or stream it directly.

Requirements:

- Do not export screenshot-only PDFs.
- Preserve clear section headings.
- Avoid complex tables and image text.
- Keep contact information as selectable text.
