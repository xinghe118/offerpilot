import { prisma } from "@/lib/db/prisma";
import { asJson } from "@/lib/db/json";
import { requireUserId } from "@/lib/db/ownership";
import type { ResumeVersion } from "@/lib/domain/types";

export async function listResumeVersionsForUser(userId: string) {
  const scopedUserId = requireUserId(userId);
  return prisma.resumeVersion.findMany({
    where: {
      userId: scopedUserId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function createResumeWithVersionForUser(userId: string, version: ResumeVersion) {
  const scopedUserId = requireUserId(userId);
  return prisma.resume.create({
    data: {
      userId: scopedUserId,
      title: version.name,
      contentJson: asJson(version.content),
      versions: {
        create: {
          userId: scopedUserId,
          name: version.name,
          targetCompany: version.targetCompany,
          targetRole: version.targetRole,
          jdId: version.jdId,
          contentJson: asJson(version.content),
          matchScoreJson: asJson(version.matchScore),
        },
      },
    },
    include: {
      versions: true,
    },
  });
}
