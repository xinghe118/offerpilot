import type { AiProvider, AnalyzeJdInput, InterviewPrepInput, MatchResumeInput, RewriteProjectInput } from "@/lib/ai/provider";
import type { InterviewQuestion, InterviewPrep, JobDescription, MatchScore } from "@/lib/domain/types";

type JsonObject = Record<string, unknown>;

function envOrDefault(name: string, fallback: string) {
  return process.env[name]?.trim() || fallback;
}

function asStringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : fallback;
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asQuestionArray(value: unknown, fallback: InterviewQuestion[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value
    .filter((item): item is JsonObject => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    .map((item, index) => ({
      id: typeof item.id === "string" ? item.id : `ai-q-${index + 1}`,
      question: typeof item.question === "string" ? item.question : fallback[index]?.question ?? "请补充面试问题。",
      answerDraft: typeof item.answerDraft === "string" ? item.answerDraft : "",
      practiced: typeof item.practiced === "boolean" ? item.practiced : false,
    }));
}

async function callOpenAiJson<T>(systemPrompt: string, userPayload: unknown): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;

  if (!apiKey || !model) {
    throw new Error("OPENAI_API_KEY and OPENAI_MODEL are required when AI_PROVIDER=openai.");
  }

  const baseUrl = envOrDefault("OPENAI_BASE_URL", "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify(userPayload),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI provider request failed with ${response.status}.`);
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI provider returned an empty response.");
  }

  return JSON.parse(content) as T;
}

function mergeJobDescription(input: AnalyzeJdInput, fallback: JobDescription, value: unknown): JobDescription {
  const result = (Boolean(value) && typeof value === "object" ? value : {}) as JsonObject;

  return {
    ...fallback,
    company: typeof result.company === "string" ? result.company : input.company || fallback.company,
    role: typeof result.role === "string" ? result.role : input.role || fallback.role,
    rawText: input.rawText,
    seniority: typeof result.seniority === "string" ? result.seniority : fallback.seniority,
    requiredSkills: asStringArray(result.requiredSkills, fallback.requiredSkills),
    niceToHave: asStringArray(result.niceToHave, fallback.niceToHave),
    softSkills: asStringArray(result.softSkills, fallback.softSkills),
    responsibilities: asStringArray(result.responsibilities, fallback.responsibilities),
    keywords: asStringArray(result.keywords, fallback.keywords),
    emphasis: asStringArray(result.emphasis, fallback.emphasis),
  };
}

function mergeMatchScore(fallback: MatchScore, value: unknown): MatchScore {
  const result = (Boolean(value) && typeof value === "object" ? value : {}) as JsonObject;

  return {
    ...fallback,
    total: asNumber(result.total, fallback.total),
    skills: asNumber(result.skills, fallback.skills),
    projectRelevance: asNumber(result.projectRelevance, fallback.projectRelevance),
    keywordCoverage: asNumber(result.keywordCoverage, fallback.keywordCoverage),
    expressionQuality: asNumber(result.expressionQuality, fallback.expressionQuality),
    atsFriendliness: asNumber(result.atsFriendliness, fallback.atsFriendliness),
    matchedKeywords: asStringArray(result.matchedKeywords, fallback.matchedKeywords),
    missingKeywords: asStringArray(result.missingKeywords, fallback.missingKeywords),
    suggestions: asStringArray(result.suggestions, fallback.suggestions),
  };
}

function mergeInterviewPrep(fallback: InterviewPrep, value: unknown): InterviewPrep {
  const result = (Boolean(value) && typeof value === "object" ? value : {}) as JsonObject;

  return {
    ...fallback,
    technicalQuestions: asQuestionArray(result.technicalQuestions, fallback.technicalQuestions),
    projectQuestions: asQuestionArray(result.projectQuestions, fallback.projectQuestions),
    behaviorQuestions: asQuestionArray(result.behaviorQuestions, fallback.behaviorQuestions),
    englishQuestions: asQuestionArray(result.englishQuestions, fallback.englishQuestions),
    selfIntroduction: typeof result.selfIntroduction === "string" ? result.selfIntroduction : fallback.selfIntroduction,
    questionsToAsk: asStringArray(result.questionsToAsk, fallback.questionsToAsk),
  };
}

export function createOpenAiCompatibleProvider(localProvider: AiProvider): AiProvider {
  return {
    async analyzeJd(input) {
      const fallback = await localProvider.analyzeJd(input);
      try {
        const result = await callOpenAiJson<JsonObject>(
          "Analyze the job description and return strict JSON with company, role, seniority, requiredSkills, niceToHave, softSkills, responsibilities, keywords, and emphasis. Do not add unsupported claims.",
          input,
        );
        return mergeJobDescription(input, fallback, result);
      } catch {
        return fallback;
      }
    },

    async matchResume(input: MatchResumeInput) {
      const fallback = await localProvider.matchResume(input);
      try {
        const result = await callOpenAiJson<JsonObject>(
          "Compare the profile against the JD. Return strict JSON with total, skills, projectRelevance, keywordCoverage, expressionQuality, atsFriendliness, matchedKeywords, missingKeywords, and suggestions. Do not fabricate experience.",
          input,
        );
        return mergeMatchScore(fallback, result);
      } catch {
        return fallback;
      }
    },

    async rewriteProject(input: RewriteProjectInput) {
      const fallback = await localProvider.rewriteProject(input);
      try {
        const result = await callOpenAiJson<JsonObject>(
          "Rewrite project resume bullets for the target JD. Return strict JSON with bullets and reasoning. Preserve facts and never invent metrics, dates, companies, or experience.",
          input,
        );
        return {
          bullets: asStringArray(result.bullets, fallback.bullets),
          reasoning: asStringArray(result.reasoning, fallback.reasoning),
        };
      } catch {
        return fallback;
      }
    },

    async generateInterviewPrep(input: InterviewPrepInput) {
      const fallback = await localProvider.generateInterviewPrep(input);
      try {
        const result = await callOpenAiJson<JsonObject>(
          "Generate interview preparation from the profile and JD. Return strict JSON with technicalQuestions, projectQuestions, behaviorQuestions, englishQuestions, selfIntroduction, and questionsToAsk. Each question item must include id and question.",
          input,
        );
        return mergeInterviewPrep(fallback, result);
      } catch {
        return fallback;
      }
    },
  };
}
