"use server";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { createJobDescriptionForUser } from "@/lib/db/repositories/job-descriptions";
import { upsertProfileForUser } from "@/lib/db/repositories/profiles";
import { createResumeWithVersionForUser } from "@/lib/db/repositories/resume-versions";
import { upsertInterviewPrepForUser } from "@/lib/db/repositories/interview-preps";
import { requireUserId } from "@/lib/db/ownership";
import type { InterviewPrep, JobDescription, ResumeVersion, UserProfile } from "@/lib/domain/types";

async function currentUserId() {
  const session = await getServerSession(authConfig);
  return requireUserId(session?.user?.id);
}

export async function saveProfileAction(profile: UserProfile) {
  const userId = await currentUserId();
  return upsertProfileForUser(userId, profile);
}

export async function saveJobDescriptionAction(jd: JobDescription) {
  const userId = await currentUserId();
  return createJobDescriptionForUser(userId, jd);
}

export async function saveResumeVersionAction(version: ResumeVersion) {
  const userId = await currentUserId();
  return createResumeWithVersionForUser(userId, version);
}

export async function saveInterviewPrepAction(prep: InterviewPrep) {
  const userId = await currentUserId();
  return upsertInterviewPrepForUser(userId, prep);
}
