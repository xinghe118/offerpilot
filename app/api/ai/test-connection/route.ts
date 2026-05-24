import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api/json";
import { getAiProvider } from "@/lib/ai/provider";
import type { RuntimeAiConfig } from "@/lib/ai/openai-compatible";

type TestConnectionRequest = {
  aiConfig?: RuntimeAiConfig;
};

export async function POST(request: Request) {
  try {
    const input = await readJson<TestConnectionRequest>(request);
    const result = await getAiProvider(input.aiConfig).analyzeJd({
      company: "OfferPilot Test",
      role: "Frontend Developer",
      rawText: "We need React, TypeScript, Next.js and REST API experience.",
    });

    return NextResponse.json({
      ok: true,
      provider: input.aiConfig?.provider ?? process.env.AI_PROVIDER ?? "local",
      mode: input.aiConfig?.provider === "openai" ? "openai-compatible-or-fallback" : "local",
      sampleKeywords: result.keywords,
      message:
        input.aiConfig?.provider === "openai"
          ? "测试请求已完成。如果远程接口不可用，系统会自动回退本地规则。"
          : "本地规则模式可用。",
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "AI connection test failed.", 500);
  }
}
