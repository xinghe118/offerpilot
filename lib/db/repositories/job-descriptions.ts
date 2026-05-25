import { prisma } from "@/lib/db/prisma";
import { asJson } from "@/lib/db/json";
import { assertUserScopedRecord, requireUserId } from "@/lib/db/ownership";
import type { JobDescription } from "@/lib/domain/types";

export async function listJobDescriptionsForUser(userId: string) {
  const scopedUserId = requireUserId(userId);
  return prisma.jobDescription.findMany({
    where: {
      userId: scopedUserId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function createJobDescriptionForUser(userId: string, jd: JobDescription) {
  const scopedUserId = requireUserId(userId);
  const existing = await prisma.jobDescription.findUnique({
    where: {
      id: jd.id,
    },
  });

  if (existing) {
    assertUserScopedRecord(existing.userId, scopedUserId);
  }

  return prisma.jobDescription.upsert({
    where: {
      id: jd.id,
    },
    create: {
      id: jd.id,
      userId: scopedUserId,
      company: jd.company,
      role: jd.role,
      rawText: jd.rawText,
      seniority: jd.seniority,
      extractedKeywordsJson: asJson(jd.keywords),
      requiredSkillsJson: asJson(jd.requiredSkills),
      niceToHaveJson: asJson(jd.niceToHave),
      softSkillsJson: asJson(jd.softSkills),
      responsibilitiesJson: asJson(jd.responsibilities),
      emphasisJson: asJson(jd.emphasis),
    },
    update: {
      company: jd.company,
      role: jd.role,
      rawText: jd.rawText,
      seniority: jd.seniority,
      extractedKeywordsJson: asJson(jd.keywords),
      requiredSkillsJson: asJson(jd.requiredSkills),
      niceToHaveJson: asJson(jd.niceToHave),
      softSkillsJson: asJson(jd.softSkills),
      responsibilitiesJson: asJson(jd.responsibilities),
      emphasisJson: asJson(jd.emphasis),
    },
  });
}
