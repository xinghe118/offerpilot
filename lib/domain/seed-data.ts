import type { JobDescription, UserProfile } from "./types";

export const seedProfile: UserProfile = {
  id: "profile-main",
  name: "林澈",
  email: "lin.chen@example.com",
  phone: "138-0000-2026",
  location: "上海",
  targetRole: "前端开发工程师",
  summary:
    "软件工程背景，具备 React、TypeScript、Next.js 与 AI 应用项目经验，关注可维护组件设计、接口联调、性能优化和从需求到上线的完整交付。",
  skills: [
    "React",
    "TypeScript",
    "Next.js",
    "Tailwind CSS",
    "Zustand",
    "Node.js",
    "REST API",
    "PostgreSQL",
    "Prisma",
    "OpenAI API",
    "pgvector",
    "Testing",
    "CI/CD",
  ],
  education: [
    {
      id: "edu-1",
      school: "华东理工大学",
      degree: "本科",
      major: "软件工程",
      startDate: "2021.09",
      endDate: "2025.06",
      highlights: ["主修数据结构、数据库系统、Web 开发、软件工程实践。"],
    },
  ],
  experience: [
    {
      id: "work-1",
      company: "星河科技",
      role: "前端开发实习生",
      startDate: "2024.06",
      endDate: "2024.10",
      highlights: [
        "参与企业后台组件重构，使用 React 和 TypeScript 抽象表格筛选、批量操作和权限控制能力。",
        "与后端协作完成 REST API 联调，补充异常状态和空状态，减少运营同学重复反馈。",
      ],
    },
  ],
  projects: [
    {
      id: "project-kb",
      name: "AI 知识库问答系统",
      role: "全栈开发",
      techStack: ["Next.js", "TypeScript", "PostgreSQL", "OpenAI API", "pgvector"],
      features: ["文档上传", "向量检索", "AI 问答", "引用来源", "流式响应"],
      rawDescription: "做了一个 AI 知识库问答系统，可以上传文档，然后基于文档内容问问题。",
      resumeBullets: [
        "基于 Next.js 和 PostgreSQL 设计知识库、文档、分块和会话模型，完成从上传到问答的完整业务闭环。",
        "集成 OpenAI API 与 pgvector 实现语义检索，将回答限定在用户上传内容范围内并展示来源引用。",
        "实现流式响应和错误状态处理，提升问答反馈速度和文档处理流程的可观测性。",
      ],
      interviewTalkingPoints: [
        "为什么选择 pgvector 而不是单独的向量数据库。",
        "如何设计 RAG 流程来降低模型幻觉。",
        "如何处理文档解析失败、无匹配上下文和流式中断。",
      ],
    },
    {
      id: "project-commerce",
      name: "电商管理后台",
      role: "前端开发",
      techStack: ["React", "TypeScript", "Zustand", "Tailwind CSS", "REST API"],
      features: ["商品管理", "订单处理", "库存预警", "权限控制", "表格筛选"],
      rawDescription: "做了一个电商后台，有商品、订单、库存和权限功能。",
      resumeBullets: [
        "封装可复用表单和数据表格组件，支持筛选、分页、批量上下架和库存预警。",
        "使用 Zustand 管理订单编辑状态，降低跨页面状态传递复杂度。",
        "补充接口失败、权限不足和空列表场景，提高后台操作稳定性。",
      ],
      interviewTalkingPoints: [
        "复杂表格组件如何拆分状态和交互。",
        "为什么使用 Zustand 管理局部业务状态。",
        "后台权限和异常状态如何设计更可维护。",
      ],
    },
  ],
  links: [
    { label: "GitHub", url: "github.com/linchen" },
    { label: "Portfolio", url: "linchen.dev" },
  ],
};

export const seedJobDescriptions: JobDescription[] = [
  {
    id: "jd-frontend",
    company: "Acme AI",
    role: "前端开发工程师",
    rawText:
      "我们正在招聘前端开发工程师，要求熟悉 React、TypeScript、Next.js，能够与后端协作完成 REST API 联调。熟悉 PostgreSQL、自动化测试、CI/CD 和性能优化者优先。需要具备良好的沟通能力和 ownership，能够独立推进功能上线。",
    seniority: "初中级",
    requiredSkills: ["React", "TypeScript", "Next.js", "REST API"],
    niceToHave: ["PostgreSQL", "Testing", "CI/CD", "性能优化"],
    softSkills: ["沟通能力", "ownership", "独立推进"],
    responsibilities: ["构建前端业务功能", "与后端完成接口联调", "维护组件和页面质量"],
    keywords: ["React", "TypeScript", "Next.js", "REST API", "PostgreSQL", "Testing", "CI/CD", "性能优化"],
    emphasis: ["组件化开发", "前后端协作", "工程化能力", "独立交付"],
    createdAt: "2026-05-24",
  },
  {
    id: "jd-fullstack",
    company: "Northstar Labs",
    role: "全栈开发工程师",
    rawText:
      "负责 AI 应用产品从前端到后端的功能开发，要求掌握 TypeScript、Next.js、Node.js、PostgreSQL、Prisma，理解 AI API 调用、权限控制和部署流程。有 RAG、向量检索或 AI Agent 项目经验优先。",
    seniority: "初中级",
    requiredSkills: ["TypeScript", "Next.js", "Node.js", "PostgreSQL", "Prisma"],
    niceToHave: ["OpenAI API", "pgvector", "RAG", "AI Agent", "部署"],
    softSkills: ["产品理解", "问题排查", "独立交付"],
    responsibilities: ["开发 AI 应用功能", "设计数据模型", "完成部署和问题排查"],
    keywords: ["TypeScript", "Next.js", "Node.js", "PostgreSQL", "Prisma", "OpenAI API", "pgvector", "RAG"],
    emphasis: ["全栈闭环", "AI 应用经验", "数据建模", "部署能力"],
    createdAt: "2026-05-24",
  },
];
