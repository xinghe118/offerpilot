import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api/json";
import { authConfig } from "@/lib/auth/config";
import { listInterviewPrepsForUser, upsertInterviewPrepForUser } from "@/lib/db/repositories/interview-preps";
import { createJobDescriptionForUser, listJobDescriptionsForUser } from "@/lib/db/repositories/job-descriptions";
import { getProfileForUser, upsertProfileForUser } from "@/lib/db/repositories/profiles";
import { createResumeWithVersionForUser, listResumeVersionsForUser } from "@/lib/db/repositories/resume-versions";
import { toDomainInterviewPrep, toDomainJobDescription, toDomainProfile, toDomainResumeVersion } from "@/lib/db/mappers";
import { requireUserId } from "@/lib/db/ownership";
import type { InterviewPrep, JobDescription, ResumeVersion, UserProfile } from "@/lib/domain/types";

type WorkspaceSnapshot = {
  profile: UserProfile;
  jobs: JobDescription[];
  versions: ResumeVersion[];
  prepDrafts: Record<string, InterviewPrep>;
};

async function currentUserId() {
  if (!process.env.AUTH_SECRET) {
    throw new Error("Authentication is required.");
  }

  const session = await getServerSession(authConfig);
  return requireUserId(session?.user?.id);
}

export async function GET() {
  try {
    const userId = await currentUserId();
    const [profile, jobs, versions, preps] = await Promise.all([
      getProfileForUser(userId),
      listJobDescriptionsForUser(userId),
      listResumeVersionsForUser(userId),
      listInterviewPrepsForUser(userId),
    ]);

    return NextResponse.json({
      profile: profile ? toDomainProfile(profile) : null,
      jobs: jobs.map(toDomainJobDescription),
      versions: versions.map(toDomainResumeVersion),
      prepDrafts: Object.fromEntries(preps.map((prep) => [prep.jdId, toDomainInterviewPrep(prep)])),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load workspace.";
    return jsonError(message, message === "Authentication is required." ? 401 : 500);
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await currentUserId();
    const snapshot = await readJson<WorkspaceSnapshot>(request);

    if (!snapshot.profile) {
      return jsonError("profile is required.");
    }

    await upsertProfileForUser(userId, snapshot.profile);
    await Promise.all(snapshot.jobs.map((job) => createJobDescriptionForUser(userId, job)));
    await Promise.all(snapshot.versions.map((version) => createResumeWithVersionForUser(userId, version)));
    await Promise.all(Object.values(snapshot.prepDrafts).map((prep) => upsertInterviewPrepForUser(userId, prep)));

    return NextResponse.json({
      ok: true,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save workspace.";
    return jsonError(message, message === "Authentication is required." ? 401 : 500);
  }
}
