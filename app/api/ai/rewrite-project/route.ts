import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api/json";
import { getAiProvider, type RewriteProjectInput } from "@/lib/ai/provider";
import type { RuntimeAiConfig } from "@/lib/ai/openai-compatible";

type RewriteProjectRequest = RewriteProjectInput & {
  aiConfig?: RuntimeAiConfig;
};

export async function POST(request: Request) {
  try {
    const input = await readJson<RewriteProjectRequest>(request);
    if (!input.project || !input.jd) {
      return jsonError("project and jd are required.");
    }

    const result = await getAiProvider(input.aiConfig).rewriteProject(input);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to rewrite project.", 500);
  }
}
