import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api/json";
import { analyzeGitHubRepo } from "@/lib/github/analyze-repo";

type AnalyzeRepoInput = {
  repoUrl?: string;
};

export async function POST(request: Request) {
  try {
    const input = await readJson<AnalyzeRepoInput>(request);
    if (!input.repoUrl?.trim()) {
      return jsonError("repoUrl is required.");
    }

    const result = await analyzeGitHubRepo(input.repoUrl);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to analyze GitHub repository.", 500);
  }
}
