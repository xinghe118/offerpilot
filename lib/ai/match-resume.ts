import type { JobDescription, MatchScore, UserProfile } from "@/lib/domain/types";

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ");
}

function profileText(profile: UserProfile) {
  return [
    profile.targetRole,
    profile.summary,
    ...profile.skills,
    ...profile.experience.flatMap((item) => [item.company, item.role, ...item.highlights]),
    ...profile.projects.flatMap((project) => [
      project.name,
      project.role,
      project.rawDescription,
      ...project.techStack,
      ...project.features,
      ...project.resumeBullets,
      ...project.interviewTalkingPoints,
    ]),
  ].join(" ");
}

function ratioScore(matched: number, total: number, max: number) {
  return total === 0 ? 0 : Math.round((matched / total) * max);
}

export function matchResumeToJd(profile: UserProfile, jd: JobDescription): MatchScore {
  const text = normalize(profileText(profile));
  const allKeywords = Array.from(new Set([...jd.requiredSkills, ...jd.niceToHave, ...jd.keywords]));
  const matchedKeywords = allKeywords.filter((keyword) => text.includes(normalize(keyword)));
  const missingKeywords = allKeywords.filter((keyword) => !matchedKeywords.includes(keyword));
  const matchedRequired = jd.requiredSkills.filter((keyword) => matchedKeywords.includes(keyword));
  const projectKeywords = profile.projects.flatMap((project) => project.techStack);
  const relevantProjectKeywords = projectKeywords.filter((keyword) =>
    allKeywords.some((jdKeyword) => normalize(jdKeyword) === normalize(keyword)),
  );
  const hasActionBullets = profile.projects.some((project) =>
    project.resumeBullets.some((bullet) => /实现|设计|优化|集成|封装|提升|完成/.test(bullet)),
  );
  const atsReady = Boolean(profile.email && profile.phone && profile.targetRole && profile.skills.length && profile.projects.length);

  const skills = ratioScore(matchedRequired.length, jd.requiredSkills.length, 25);
  const projectRelevance = ratioScore(new Set(relevantProjectKeywords).size, Math.max(jd.requiredSkills.length, 1), 25);
  const keywordCoverage = ratioScore(matchedKeywords.length, allKeywords.length, 20);
  const expressionQuality = hasActionBullets ? 15 : 8;
  const atsFriendliness = atsReady ? 15 : 7;
  const total = Math.min(100, skills + projectRelevance + keywordCoverage + expressionQuality + atsFriendliness);

  const suggestions = [
    missingKeywords.includes("Testing") || missingKeywords.includes("Playwright")
      ? "项目经历中可以补充自动化测试、关键用例或质量保障结果。"
      : "",
    missingKeywords.includes("CI/CD") || missingKeywords.includes("Docker")
      ? "补充部署、CI/CD 或上线流程经验，说明项目如何交付到可用环境。"
      : "",
    missingKeywords.includes("REST API") || missingKeywords.includes("接口联调")
      ? "在工作或项目 bullet 中写清楚接口联调、错误处理和前后端协作。"
      : "",
    missingKeywords.length
      ? `如果经历真实覆盖 ${missingKeywords.slice(0, 3).join("、")}，建议加入技能列表或相关项目亮点。`
      : "当前关键词覆盖较好，下一步可以强化量化结果和面试讲解素材。",
  ].filter(Boolean);

  return {
    total,
    skills,
    projectRelevance,
    keywordCoverage,
    expressionQuality,
    atsFriendliness,
    matchedKeywords,
    missingKeywords,
    suggestions,
  };
}
