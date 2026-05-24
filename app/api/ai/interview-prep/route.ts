import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api/json";
import { getAiProvider, type InterviewPrepInput } from "@/lib/ai/provider";
import type { RuntimeAiConfig } from "@/lib/ai/openai-compatible";

type InterviewPrepRequest = InterviewPrepInput & {
  aiConfig?: RuntimeAiConfig;
};

export async function POST(request: Request) {
  try {
    const input = await readJson<InterviewPrepRequest>(request);
    if (!input.profile || !input.jd) {
      return jsonError("profile and jd are required.");
    }

    const result = await getAiProvider(input.aiConfig).generateInterviewPrep(input);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to generate interview prep.", 500);
  }
}
