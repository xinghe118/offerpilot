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

const softSkillKeywords = ["沟通能力", "ownership", "协作", "自驱", "学习能力", "问题排查", "独立推进", "负责"];

const responsibilitySignals = [
  { keyword: "组件", text: "设计和开发可复用前端组件" },
  { keyword: "接口", text: "与后端协作完成接口联调和异常处理" },
  { keyword: "性能", text: "优化页面性能、交互体验和关键链路稳定性" },
  { keyword: "数据", text: "参与数据模型、业务流程和页面状态设计" },
  { keyword: "AI", text: "集成 AI 能力并处理模型输出的产品化落地" },
  { keyword: "部署", text: "参与部署、上线和问题排查流程" },
  { keyword: "测试", text: "补充测试用例或质量保障流程" },
];

const seniorityRules = [
  { label: "高级", terms: ["高级", "资深", "Senior", "Lead", "5年以上", "5 年以上"] },
  { label: "中级", terms: ["中级", "3年以上", "3 年以上", "2年以上", "2 年以上"] },
  { label: "初级", terms: ["初级", "应届", "实习", "校招", "Junior"] },
];

function includesTerm(text: string, term: string) {
  return text.toLowerCase().includes(term.toLowerCase());
}

function inferSeniority(text: string) {
  return seniorityRules.find((rule) => rule.terms.some((term) => includesTerm(text, term)))?.label ?? "初中级";
}

function isNiceToHave(text: string, keyword: string) {
  const index = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (index < 0) {
    return false;
  }
  const windowText = text.slice(Math.max(0, index - 18), index + keyword.length + 24).toLowerCase();
  return ["优先", "加分", "nice", "plus", "preferred", "熟悉"].some((marker) => windowText.includes(marker));
}

export function analyzeJobDescription(input: Pick<JobDescription, "company" | "role" | "rawText">): JobDescription {
  const matched = skillKeywords.filter((keyword) => includesTerm(input.rawText, keyword));
  const requiredSkills = matched.filter((keyword) => !isNiceToHave(input.rawText, keyword)).slice(0, 7);
  const niceToHave = matched.filter((keyword) => !requiredSkills.includes(keyword)).slice(0, 6);
  const softSkills = softSkillKeywords.filter((keyword) => includesTerm(input.rawText, keyword)).slice(0, 5);
  const responsibilities = responsibilitySignals
    .filter((item) => includesTerm(input.rawText, item.keyword))
    .map((item) => item.text);

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
    seniority: inferSeniority(input.rawText),
    requiredSkills: requiredSkills.length ? requiredSkills : matched.slice(0, 4),
    niceToHave,
    softSkills: softSkills.length ? softSkills : ["沟通协作", "主动推进"],
    responsibilities: responsibilities.length
      ? responsibilities
      : [
          "围绕目标岗位交付核心业务功能",
          "与产品、设计和后端协作完成需求落地",
          "持续改进代码质量、性能和用户体验",
        ],
    keywords: Array.from(new Set([...matched, ...emphasis])).slice(0, 12),
    emphasis: emphasis.length ? emphasis : ["岗位关键词覆盖", "项目成果表达", "独立交付能力"],
    createdAt: new Date().toISOString().slice(0, 10),
  };
}
