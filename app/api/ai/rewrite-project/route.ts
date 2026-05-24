import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api/json";
import { getAiProvider, type RewriteProjectInput } from "@/lib/ai/provider";

export async function POST(request: Request) {
  try {
    const input = await readJson<RewriteProjectInput>(request);
    if (!input.project || !input.jd) {
      return jsonError("project and jd are required.");
    }

    const result = await getAiProvider().rewriteProject(input);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to rewrite project.", 500);
  }
}
