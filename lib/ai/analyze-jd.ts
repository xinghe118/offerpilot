import type { JobDescription } from "@/lib/domain/types";

const skillKeywords = [
  "React",
  "Vue",
  "TypeScript",
  "JavaScript",
  "Next.js",
  "Node.js",
  "REST API",
  "GraphQL",
  "PostgreSQL",
  "MySQL",
  "Prisma",
  "Redis",
  "OpenAI API",
  "Gemini",
  "Claude",
  "pgvector",
  "RAG",
  "AI Agent",
  "Testing",
  "Jest",
  "Playwright",
  "CI/CD",
  "Docker",
  "Vercel",
  "性能优化",
  "权限控制",
  "接口联调",
];

const niceToHaveMarkers = ["优先", "加分", "nice", "plus", "preferred", "熟悉"];

function includesTerm(text: string, term: string) {
  return text.toLowerCase().includes(term.toLowerCase());
}

export function analyzeJobDescription(input: Pick<JobDescription, "company" | "role" | "rawText">): JobDescription {
  const matched = skillKeywords.filter((keyword) => includesTerm(input.rawText, keyword));
  const requiredSkills = matched.filter((keyword) => !niceToHaveMarkers.some((marker) => includesTerm(input.rawText, `${keyword}${marker}`))).slice(0, 6);
  const niceToHave = matched.filter((keyword) => !requiredSkills.includes(keyword)).slice(0, 6);

  const emphasis = [
    includesTerm(input.rawText, "组件") ? "组件化开发" : "",
    includesTerm(input.rawText, "性能") ? "性能优化" : "",
    includesTerm(input.rawText, "后端") || includesTerm(input.rawText, "接口") ? "前后端协作" : "",
    includesTerm(input.rawText, "部署") || includesTerm(input.rawText, "CI/CD") ? "工程化与部署" : "",
    includesTerm(input.rawText, "AI") || includesTerm(input.rawText, "RAG") ? "AI 应用经验" : "",
  ].filter(Boolean);

  return {
    id: `jd-${Date.now()}`,
    company: input.company || "目标公司",
    role: input.role || "目标岗位",
    rawText: input.rawText,
    seniority: includesTerm(input.rawText, "高级") || includesTerm(input.rawText, "Senior") ? "高级" : "初中级",
    requiredSkills: requiredSkills.length ? requiredSkills : matched.slice(0, 4),
    niceToHave,
    responsibilities: [
      "围绕目标岗位交付核心业务功能",
      "与产品、设计和后端协作完成需求落地",
      "持续改进代码质量、性能和用户体验",
    ],
    keywords: Array.from(new Set([...matched, ...emphasis])).slice(0, 12),
    emphasis: emphasis.length ? emphasis : ["岗位关键词覆盖", "项目成果表达", "独立交付能力"],
    createdAt: new Date().toISOString().slice(0, 10),
  };
}
