import type { InterviewPrep, JobDescription, UserProfile } from "@/lib/domain/types";

function question(id: string, value: string) {
  return {
    id,
    question: value,
    answerDraft: "",
    practiced: false,
  };
}

export function generateInterviewPrep(profile: UserProfile, jd: JobDescription): InterviewPrep {
  const primaryProject = profile.projects[0];
  const skill = jd.requiredSkills[0] ?? profile.skills[0] ?? "目标技术栈";

  return {
    id: `prep-${jd.id}`,
    jdId: jd.id,
    technicalQuestions: [
      question("tech-1", `你在项目中如何使用 ${skill} 解决实际业务问题？`),
      question("tech-2", "如果接口响应变慢，你会如何定位并优化？"),
      question("tech-3", "你如何设计一个可维护的前端组件或页面模块？"),
      question("tech-4", "你如何处理接口异常、权限不足和空状态？"),
    ],
    projectQuestions: [
      question("project-1", `${primaryProject.name} 的核心架构和数据流是怎样的？`),
      question("project-2", `这个项目中最能体现 ${jd.role} 能力的一点是什么？`),
      question("project-3", "如果让你把这个项目上线给真实用户使用，还需要补哪些工程能力？"),
    ],
    behaviorQuestions: [
      question("behavior-1", "讲一个你独立拆解需求并推进完成的例子。"),
      question("behavior-2", "讲一个你和后端或产品协作解决问题的例子。"),
      question("behavior-3", "遇到不熟悉的技术栈时，你通常如何快速学习并交付？"),
    ],
    englishQuestions: [
      question("english-1", "Please introduce one project that best matches this role."),
      question("english-2", "How do you handle technical challenges under time pressure?"),
    ],
    selfIntroduction: `我叫 ${profile.name}，目标岗位是 ${jd.role}。我具备 ${profile.skills
      .slice(0, 5)
      .join("、")} 等技术经验，重点项目是 ${primaryProject.name}，可以结合该岗位需要的 ${jd.keywords
      .slice(0, 4)
      .join("、")} 展开介绍。`,
    questionsToAsk: [
      "这个岗位入职前三个月最重要的交付目标是什么？",
      "团队当前在工程化或业务迭代上最大的挑战是什么？",
      "如果加入团队，我会主要负责哪类业务模块？",
    ],
    createdAt: new Date().toISOString().slice(0, 10),
  };
}
