import { analyzeJobDescription } from "@/lib/ai/analyze-jd";
import { generateInterviewPrep } from "@/lib/ai/interview-questions";
import { matchResumeToJd } from "@/lib/ai/match-resume";
import { rewriteProjectForJd } from "@/lib/ai/rewrite-project";
import type { JobDescription, Project, UserProfile } from "@/lib/domain/types";

export type AnalyzeJdInput = Pick<JobDescription, "company" | "role" | "rawText">;

export type MatchResumeInput = {
  profile: UserProfile;
  jd: JobDescription;
};

export type RewriteProjectInput = {
  project: Project;
  jd: JobDescription;
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
  async rewriteProject({ project, jd }) {
    return rewriteProjectForJd(project, jd);
  },
  async generateInterviewPrep({ profile, jd }) {
    return generateInterviewPrep(profile, jd);
  },
};

const unsupportedRemoteProvider: AiProvider = {
  async analyzeJd(input) {
    return localProvider.analyzeJd(input);
  },
  async matchResume(input) {
    return localProvider.matchResume(input);
  },
  async rewriteProject(input) {
    return localProvider.rewriteProject(input);
  },
  async generateInterviewPrep(input) {
    return localProvider.generateInterviewPrep(input);
  },
};

export function getAiProvider(): AiProvider {
  const provider = process.env.AI_PROVIDER ?? "local";

  if (provider === "local") {
    return localProvider;
  }

  return unsupportedRemoteProvider;
}
