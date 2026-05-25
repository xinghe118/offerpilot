import type { InterviewPrep as PrismaInterviewPrep, JobDescription as PrismaJobDescription, Profile as PrismaProfile, ResumeVersion as PrismaResumeVersion } from "@prisma/client";
import type { InterviewPrep, JobDescription, MatchScore, ResumeVersion, UserProfile } from "@/lib/domain/types";

function asArray<T>(value: unknown, fallback: T[] = []): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function asObject<T>(value: unknown, fallback: T): T {
  return value && typeof value === "object" ? (value as T) : fallback;
}

export function toDomainProfile(record: PrismaProfile): UserProfile {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone,
    location: record.location,
    targetRole: record.targetRole,
    summary: record.summary,
    skills: asArray<string>(record.skillsJson),
    education: asArray<UserProfile["education"][number]>(record.educationJson),
    projects: asArray<UserProfile["projects"][number]>(record.projectsJson),
    experience: asArray<UserProfile["experience"][number]>(record.experienceJson),
    links: asArray<UserProfile["links"][number]>(record.linksJson),
  };
}

export function toDomainJobDescription(record: PrismaJobDescription): JobDescription {
  return {
    id: record.id,
    company: record.company,
    role: record.role,
    rawText: record.rawText,
    seniority: record.seniority ?? undefined,
    keywords: asArray<string>(record.extractedKeywordsJson),
    requiredSkills: asArray<string>(record.requiredSkillsJson),
    niceToHave: asArray<string>(record.niceToHaveJson),
    softSkills: asArray<string>(record.softSkillsJson),
    responsibilities: asArray<string>(record.responsibilitiesJson),
    emphasis: asArray<string>(record.emphasisJson),
    createdAt: record.createdAt.toISOString().slice(0, 10),
  };
}

export function toDomainResumeVersion(record: PrismaResumeVersion): ResumeVersion {
  return {
    id: record.id,
    name: record.name,
    targetCompany: record.targetCompany,
    targetRole: record.targetRole,
    jdId: record.jdId ?? undefined,
    content: asObject<UserProfile>(record.contentJson, {} as UserProfile),
    matchScore: asObject<MatchScore>(record.matchScoreJson, {} as MatchScore),
    createdAt: record.createdAt.toISOString().slice(0, 10),
    updatedAt: record.updatedAt.toISOString().slice(0, 10),
  };
}

export function toDomainInterviewPrep(record: PrismaInterviewPrep): InterviewPrep {
  const questions = asObject<Partial<InterviewPrep>>(record.questionsJson, {});
  return {
    id: record.id,
    jdId: record.jdId,
    technicalQuestions: asArray(questions.technicalQuestions),
    projectQuestions: asArray(questions.projectQuestions),
    behaviorQuestions: asArray(questions.behaviorQuestions),
    englishQuestions: asArray(questions.englishQuestions),
    selfIntroduction: typeof questions.selfIntroduction === "string" ? questions.selfIntroduction : "",
    questionsToAsk: asArray<string>(questions.questionsToAsk),
    createdAt: record.createdAt.toISOString().slice(0, 10),
  };
}
