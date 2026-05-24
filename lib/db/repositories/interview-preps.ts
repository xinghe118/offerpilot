import { prisma } from "@/lib/db/prisma";
import { asJson } from "@/lib/db/json";
import { requireUserId } from "@/lib/db/ownership";
import type { InterviewPrep } from "@/lib/domain/types";

export async function listInterviewPrepsForUser(userId: string) {
  const scopedUserId = requireUserId(userId);
  return prisma.interviewPrep.findMany({
    where: {
      userId: scopedUserId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function upsertInterviewPrepForUser(userId: string, prep: InterviewPrep) {
  const scopedUserId = requireUserId(userId);
  return prisma.interviewPrep.upsert({
    where: {
      id: prep.id,
    },
    create: {
      id: prep.id,
      userId: scopedUserId,
      jdId: prep.jdId,
      questionsJson: asJson({
        technicalQuestions: prep.technicalQuestions,
        projectQuestions: prep.projectQuestions,
        behaviorQuestions: prep.behaviorQuestions,
        englishQuestions: prep.englishQuestions,
        selfIntroduction: prep.selfIntroduction,
        questionsToAsk: prep.questionsToAsk,
      }),
      answersJson: asJson({
        technicalQuestions: prep.technicalQuestions.map((item) => ({
          id: item.id,
          answerDraft: item.answerDraft,
          practiced: item.practiced,
        })),
        projectQuestions: prep.projectQuestions.map((item) => ({
          id: item.id,
          answerDraft: item.answerDraft,
          practiced: item.practiced,
        })),
        behaviorQuestions: prep.behaviorQuestions.map((item) => ({
          id: item.id,
          answerDraft: item.answerDraft,
          practiced: item.practiced,
        })),
        englishQuestions: prep.englishQuestions.map((item) => ({
          id: item.id,
          answerDraft: item.answerDraft,
          practiced: item.practiced,
        })),
      }),
    },
    update: {
      questionsJson: asJson({
        technicalQuestions: prep.technicalQuestions,
        projectQuestions: prep.projectQuestions,
        behaviorQuestions: prep.behaviorQuestions,
        englishQuestions: prep.englishQuestions,
        selfIntroduction: prep.selfIntroduction,
        questionsToAsk: prep.questionsToAsk,
      }),
      answersJson: asJson({
        technicalQuestions: prep.technicalQuestions.map((item) => ({
          id: item.id,
          answerDraft: item.answerDraft,
          practiced: item.practiced,
        })),
        projectQuestions: prep.projectQuestions.map((item) => ({
          id: item.id,
          answerDraft: item.answerDraft,
          practiced: item.practiced,
        })),
        behaviorQuestions: prep.behaviorQuestions.map((item) => ({
          id: item.id,
          answerDraft: item.answerDraft,
          practiced: item.practiced,
        })),
        englishQuestions: prep.englishQuestions.map((item) => ({
          id: item.id,
          answerDraft: item.answerDraft,
          practiced: item.practiced,
        })),
      }),
    },
  });
}
