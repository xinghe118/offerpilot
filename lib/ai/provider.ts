import { analyzeJobDescription } from "@/lib/ai/analyze-jd";
import { generateInterviewPrep } from "@/lib/ai/interview-questions";
import { matchResumeToJd } from "@/lib/ai/match-resume";
import { createOpenAiCompatibleProvider, type RuntimeAiConfig } from "@/lib/ai/openai-compatible";
import { rewriteProjectForJd, type RewriteProjectOptions } from "@/lib/ai/rewrite-project";
import type { JobDescription, Project, UserProfile } from "@/lib/domain/types";

export type AnalyzeJdInput = Pick<JobDescription, "company" | "role" | "rawText">;

export type MatchResumeInput = {
  profile: UserProfile;
  jd: JobDescription;
};

export type RewriteProjectInput = {
  project: Project;
  jd: JobDescription;
  options?: RewriteProjectOptions;
};

export type InterviewPrepInput = {
  profile: UserProfile;
  jd: JobDescription;
};

export type AiProvider = {
  analyzeJd(input: AnalyzeJdInput): Promise<ReturnType<typeof analyzeJobDescription>>;
  matchResume(input: MatchResumeInput): Promise<ReturnType<typeof matchResumeToJd>>;
  rewriteProject(input: RewriteProjectInput): Promise<ReturnType<typeof rewriteProjectForJd>>;
  generateInterviewPrep(input: InterviewPrepInput): Promise<ReturnType<typeof generateInterviewPrep>>;
};

const localProvider: AiProvider = {
  async analyzeJd(input) {
    return analyzeJobDescription(input);
  },
  async matchResume({ profile, jd }) {
    return matchResumeToJd(profile, jd);
  },
  async rewriteProject({ project, jd, options }) {
    return rewriteProjectForJd(project, jd, options);
  },
  async generateInterviewPrep({ profile, jd }) {
    return generateInterviewPrep(profile, jd);
  },
};

export function getAiProvider(runtimeConfig?: RuntimeAiConfig): AiProvider {
  const provider = runtimeConfig?.provider || process.env.AI_PROVIDER || "local";

  if (provider === "local") {
    return localProvider;
  }

  if (provider === "openai") {
    return createOpenAiCompatibleProvider(localProvider, runtimeConfig);
  }

  return localProvider;
}
