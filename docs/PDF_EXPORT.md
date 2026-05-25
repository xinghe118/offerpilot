# PDF Export

OfferPilot currently supports a print-ready resume page:

```text
/resume/print
```

The page is designed for browser print or "Save as PDF" and uses normal selectable text rather than screenshot-based output.

## Current Behavior

- The print page renders the current workspace profile snapshot from browser storage and falls back to seed data if no snapshot exists.
- The app header stores the current profile before opening the print preview.
- Each JD-tailored resume version has a preview/print action that stores that version snapshot before opening the same print route.
- The template is a single-column ATS-friendly layout with selectable text for summary, skills, experience, projects, education, and interview talking points.
- `POST /api/resume-versions/export-pdf` returns the print URL and marks the export as `print-ready`.

## Production Export Plan

For production server-side export:

1. Render a version-specific route such as `/resume/:versionId/print`.
2. Load the version from the database instead of browser storage.
3. Use Playwright or Puppeteer server-side to open that route.
4. Export to PDF with selectable text.
5. Store the file in S3/Supabase Storage or stream it directly.

Requirements:

- Do not export screenshot-only PDFs.
- Preserve clear section headings.
- Avoid complex tables and image text.
- Keep contact information as selectable text.
