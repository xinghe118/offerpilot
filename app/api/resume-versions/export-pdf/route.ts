import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api/json";

type ExportPdfInput = {
  versionId?: string;
};

export async function POST(request: Request) {
  try {
    const input = await readJson<ExportPdfInput>(request);

    return NextResponse.json({
      status: "print-ready",
      versionId: input.versionId ?? null,
      printUrl: "/resume/print",
      message:
        "Server-side PDF export is prepared as a route boundary. Use the print URL now; Playwright/Puppeteer generation can be enabled after persisted resume versions are wired.",
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to prepare PDF export.", 500);
  }
}
