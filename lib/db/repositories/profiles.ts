import { prisma } from "@/lib/db/prisma";
import { asJson } from "@/lib/db/json";
import { requireUserId } from "@/lib/db/ownership";
import type { UserProfile } from "@/lib/domain/types";

export async function getProfileForUser(userId: string) {
  const scopedUserId = requireUserId(userId);
  return prisma.profile.findUnique({
    where: {
      userId: scopedUserId,
    },
  });
}

export async function upsertProfileForUser(userId: string, profile: UserProfile) {
  const scopedUserId = requireUserId(userId);
  return prisma.profile.upsert({
    where: {
      userId: scopedUserId,
    },
    create: {
      userId: scopedUserId,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      targetRole: profile.targetRole,
      summary: profile.summary,
      skillsJson: asJson(profile.skills),
      educationJson: asJson(profile.education),
      projectsJson: asJson(profile.projects),
      experienceJson: asJson(profile.experience),
      linksJson: asJson(profile.links),
    },
    update: {
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      targetRole: profile.targetRole,
      summary: profile.summary,
      skillsJson: asJson(profile.skills),
      educationJson: asJson(profile.education),
      projectsJson: asJson(profile.projects),
      experienceJson: asJson(profile.experience),
      linksJson: asJson(profile.links),
    },
  });
}
