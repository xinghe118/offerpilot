import type { AtsCheck, JobDescription, MatchScore, MatchSuggestion, Project, UserProfile } from "@/lib/domain/types";

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

function projectText(project: Project) {
  return normalize([project.name, project.role, project.rawDescription, ...project.techStack, ...project.features, ...project.resumeBullets].join(" "));
}

function findBestProject(profile: UserProfile, keywords: string[]) {
  return profile.projects
    .map((project) => ({
      project,
      hits: keywords.filter((keyword) => projectText(project).includes(normalize(keyword))).length,
    }))
    .sort((a, b) => b.hits - a.hits)[0]?.project ?? profile.projects[0];
}

function buildAtsChecks(profile: UserProfile, matchedKeywords: string[], jd: JobDescription): AtsCheck[] {
  return [
    {
      id: "contact_email",
      label: "包含邮箱",
      passed: /\S+@\S+\.\S+/.test(profile.email),
      detail: "邮箱应是可复制文本，方便 ATS 和招聘方解析。",
    },
    {
      id: "contact_phone",
      label: "包含手机号",
      passed: profile.phone.trim().length >= 6,
      detail: "建议保留文本手机号，不要只放在图片里。",
    },
    {
      id: "target_role",
      label: "目标岗位明确",
      passed: profile.targetRole.trim().length > 0,
      detail: "目标岗位有助于招聘方快速判断匹配方向。",
    },
    {
      id: "skills",
      label: "技能模块完整",
      passed: profile.skills.length >= 6,
      detail: "技能关键词集中展示能提升可扫描性。",
    },
    {
      id: "project_bullets",
      label: "项目 bullet 清晰",
      passed: profile.projects.some((project) => project.resumeBullets.length >= 3),
      detail: "项目经历应使用清晰 bullet，而不是纯段落。",
    },
    {
      id: "keyword_coverage",
      label: "JD 关键词覆盖",
      passed: matchedKeywords.length >= Math.ceil(jd.keywords.length * 0.6),
      detail: "关键词必须建立在真实经历上，不要为了匹配而堆砌。",
    },
  ];
}

function buildSuggestedActions(profile: UserProfile, jd: JobDescription, missingKeywords: string[]): MatchSuggestion[] {
  const bestProject = findBestProject(profile, jd.requiredSkills);
  const firstMissing = missingKeywords[0] ?? jd.niceToHave[0] ?? jd.requiredSkills[0] ?? "岗位关键词";
  const actions: MatchSuggestion[] = [];

  if (missingKeywords.length > 0) {
    actions.push({
      id: "missing-keywords",
      priority: "high",
      target: `项目：${bestProject.name}`,
      reason: `当前 JD 缺少 ${missingKeywords.slice(0, 4).join("、")} 的明确表达。`,
      recommendedText: `如果经历真实覆盖，可在 ${bestProject.name} 中补充 ${firstMissing} 相关的技术动作、协作过程或交付结果。`,
    });
  }

  if (missingKeywords.some((keyword) => ["Testing", "Jest", "Playwright", "自动化测试"].includes(keyword))) {
    actions.push({
      id: "testing",
      priority: "medium",
      target: `项目：${bestProject.name}`,
      reason: "JD 提到测试或质量保障，但当前项目 bullet 中证据不足。",
      recommendedText: "补充你如何验证关键流程，例如接口异常、表单校验、权限边界或端到端用例；没有真实实践则不要虚构。",
    });
  }

  if (missingKeywords.some((keyword) => ["CI/CD", "Docker", "Vercel", "部署"].includes(keyword))) {
    actions.push({
      id: "delivery",
      priority: "medium",
      target: "工程化经历",
      reason: "JD 关注部署或工程化，但当前简历中交付链路表达偏少。",
      recommendedText: "补充项目如何运行、构建、部署和排查线上问题，能显著提升作品集项目可信度。",
    });
  }

  actions.push({
    id: "summary-alignment",
    priority: "low",
    target: "个人概要",
    reason: "个人概要应在前两行回应目标岗位，而不是泛泛介绍技术栈。",
    recommendedText: `将概要改成“${profile.targetRole} 候选人，具备 ${jd.requiredSkills.slice(0, 3).join("、")} 实践经验，重点项目覆盖 ${jd.emphasis.slice(0, 2).join("、")}。”`,
  });

  return actions;
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
  const atsChecks = buildAtsChecks(profile, matchedKeywords, jd);
  const suggestedActions = buildSuggestedActions(profile, jd, missingKeywords);

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
    suggestedActions,
    atsChecks,
  };
}
