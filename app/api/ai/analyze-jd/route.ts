import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api/json";
import { getAiProvider, type AnalyzeJdInput } from "@/lib/ai/provider";
import type { RuntimeAiConfig } from "@/lib/ai/openai-compatible";

type AnalyzeJdRequest = AnalyzeJdInput & {
  aiConfig?: RuntimeAiConfig;
};

export async function POST(request: Request) {
  try {
    const input = await readJson<AnalyzeJdRequest>(request);
    if (!input.rawText?.trim()) {
      return jsonError("jd rawText is required.");
    }

    const result = await getAiProvider(input.aiConfig).analyzeJd(input);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to analyze JD.", 500);
  }
}
