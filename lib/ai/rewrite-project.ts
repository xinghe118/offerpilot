import type { JobDescription, Project } from "@/lib/domain/types";

export type RewriteTone = "professional" | "impact" | "concise";
export type RewriteFocus = "frontend" | "fullstack" | "ai" | "ats";

export type RewriteProjectOptions = {
  tone?: RewriteTone;
  focus?: RewriteFocus;
  variant?: number;
};

const toneGuidance: Record<RewriteTone, string> = {
  professional: "表达稳健、专业，强调职责边界和交付完整性",
  impact: "表达更有冲击力，优先突出行动、结果和可衡量影响",
  concise: "表达更简洁，压缩为面试官可快速扫读的短句",
};

const focusGuidance: Record<RewriteFocus, string> = {
  frontend: "前端工程化、组件设计、交互体验和接口联调",
  fullstack: "数据模型、权限控制、接口设计和端到端交付",
  ai: "AI API、RAG 流程、语义检索和结果可信度",
  ats: "JD 关键词覆盖、ATS 可解析表达和岗位技能匹配",
};

const variantActions = [
  ["设计并落地", "围绕", "沉淀"],
  ["负责推进", "结合", "突出"],
  ["独立实现", "面向", "梳理"],
];

export function rewriteProjectForJd(project: Project, jd: JobDescription, options: RewriteProjectOptions = {}) {
  const stack = project.techStack.slice(0, 4).join("、");
  const features = project.features.slice(0, 4).join("、");
  const emphasis = jd.emphasis.slice(0, 2).join("和") || "岗位核心能力";
  const tone = options.tone ?? "professional";
  const focus = options.focus ?? "ats";
  const variant = Math.abs(options.variant ?? 0) % variantActions.length;
  const [actionA, actionB, actionC] = variantActions[variant];
  const focusText = focusGuidance[focus];
  const toneText = toneGuidance[tone];
  const jdKeywords = jd.keywords.slice(0, 4).join("、") || jd.role;

  return {
    bullets: [
      `${actionA} ${project.name}，基于 ${stack} 覆盖 ${features} 等核心流程，形成与 ${jd.role} 岗位匹配的项目闭环。`,
      `${actionB} ${emphasis} 和 ${focusText}，将项目经历重组为技术选型、功能落地和交付价值的简历表达。`,
      `${actionC} ${project.role} 角色中的实现细节与可复盘技术难点，在不虚构经历的前提下增强 ${jdKeywords} 等关键词覆盖。`,
    ],
    reasoning: [
      "保留原始项目事实，只重组表达方式。",
      `当前语气：${toneText}。`,
      `当前方向：${focusText}。`,
      "优先贴合目标 JD 的关键词和岗位重点，不新增虚构指标。",
    ],
  };
}
