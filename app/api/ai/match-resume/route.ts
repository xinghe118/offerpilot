import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api/json";
import { getAiProvider, type MatchResumeInput } from "@/lib/ai/provider";
import type { RuntimeAiConfig } from "@/lib/ai/openai-compatible";

type MatchResumeRequest = MatchResumeInput & {
  aiConfig?: RuntimeAiConfig;
};

export async function POST(request: Request) {
  try {
    const input = await readJson<MatchResumeRequest>(request);
    if (!input.profile || !input.jd) {
      return jsonError("profile and jd are required.");
    }

    const result = await getAiProvider(input.aiConfig).matchResume(input);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to match resume.", 500);
  }
}
