import type { JobDescription, Project } from "@/lib/domain/types";

export function rewriteProjectForJd(project: Project, jd: JobDescription) {
  const stack = project.techStack.slice(0, 4).join("、");
  const features = project.features.slice(0, 4).join("、");
  const emphasis = jd.emphasis.slice(0, 2).join("和") || "岗位核心能力";

  return {
    bullets: [
      `基于 ${stack} 推进 ${project.name} 的核心功能开发，覆盖 ${features} 等关键流程，形成可演示的业务闭环。`,
      `围绕 ${jd.role} 岗位关注的 ${emphasis}，将项目能力表达为技术选型、功能落地和交付结果。`,
      `在不新增虚构经历的前提下，突出 ${project.role} 角色中的实现细节、协作边界和可复盘技术难点。`,
    ],
    reasoning: [
      "保留原始项目事实，只重组表达方式。",
      "把功能罗列改成“技术 + 行动 + 结果”的简历结构。",
      "优先贴合目标 JD 的关键词和岗位重点。",
    ],
  };
}
