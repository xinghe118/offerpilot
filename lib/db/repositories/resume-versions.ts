import { prisma } from "@/lib/db/prisma";
import { asJson } from "@/lib/db/json";
import { assertUserScopedRecord, requireUserId } from "@/lib/db/ownership";
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
  const existing = await prisma.resumeVersion.findUnique({
    where: {
      id: version.id,
    },
  });

  if (existing) {
    assertUserScopedRecord(existing.userId, scopedUserId);
    return prisma.resumeVersion.update({
      where: {
        id: version.id,
      },
      data: {
        name: version.name,
        targetCompany: version.targetCompany,
        targetRole: version.targetRole,
        jdId: version.jdId,
        contentJson: asJson(version.content),
        matchScoreJson: asJson(version.matchScore),
      },
    });
  }

  return prisma.resume.create({
    data: {
      userId: scopedUserId,
      title: version.name,
      contentJson: asJson(version.content),
      versions: {
        create: {
          id: version.id,
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
