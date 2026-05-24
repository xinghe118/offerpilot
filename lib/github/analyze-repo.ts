import type { GitHubRepoAnalysis } from "@/lib/domain/types";

type GitHubRepoResponse = {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  html_url: string;
  default_branch: string;
};

function parseGitHubUrl(repoUrl: string) {
  const match = repoUrl.match(/^https?:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+)\/?$/i);
  if (!match) {
    throw new Error("请输入标准 GitHub 仓库地址，例如 https://github.com/user/repo");
  }

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, ""),
  };
}

async function fetchGitHubJson<T>(url: string): Promise<T> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "OfferPilot",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url, {
    headers,
    next: {
      revalidate: 300,
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}

async function fetchReadme(owner: string, repo: string) {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.raw",
    "User-Agent": "OfferPilot",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers,
    next: {
      revalidate: 300,
    },
  });

  if (!response.ok) {
    return "";
  }

  return response.text();
}

function inferTechStack(languages: Record<string, number>, readme: string) {
  const languageNames = Object.keys(languages);
  const knownTerms = [
    "Next.js",
    "React",
    "TypeScript",
    "Tailwind",
    "Prisma",
    "PostgreSQL",
    "OpenAI",
    "Gemini",
    "Claude",
    "Playwright",
    "Docker",
    "Vercel",
  ];
  const readmeLower = readme.toLowerCase();
  const fromReadme = knownTerms.filter((term) => readmeLower.includes(term.toLowerCase()));

  return Array.from(new Set([...languageNames.slice(0, 5), ...fromReadme])).slice(0, 10);
}

function inferFeatures(readme: string) {
  const lines = readme
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*#\s]+/, "").trim())
    .filter((line) => line.length >= 8 && line.length <= 90);

  return lines.slice(0, 6);
}

function readmeQuality(readme: string) {
  if (!readme.trim()) {
    return "README 缺失，建议补充项目目标、功能截图、技术栈、运行方式和核心亮点。";
  }

  const checks = [
    readme.length > 600,
    /install|安装|setup|运行|usage|使用/i.test(readme),
    /feature|功能|亮点/i.test(readme),
    /tech|stack|技术|架构/i.test(readme),
  ];
  const score = checks.filter(Boolean).length;

  if (score >= 3) {
    return "README 信息较完整，适合继续补充架构图、演示截图和面试讲解重点。";
  }

  return "README 基础可用，但建议补充运行方式、核心功能、技术架构和项目亮点。";
}

export async function analyzeGitHubRepo(repoUrl: string): Promise<GitHubRepoAnalysis> {
  const { owner, repo } = parseGitHubUrl(repoUrl);
  const repository = await fetchGitHubJson<GitHubRepoResponse>(`https://api.github.com/repos/${owner}/${repo}`);
  const languages = await fetchGitHubJson<Record<string, number>>(`https://api.github.com/repos/${owner}/${repo}/languages`);
  const readme = await fetchReadme(owner, repo);
  const techStack = inferTechStack(languages, readme);
  const features = inferFeatures(readme);
  const primaryLanguage = repository.language ?? Object.keys(languages)[0] ?? "Unknown";
  const projectName = repository.name;

  return {
    repoUrl: repository.html_url,
    owner,
    name: projectName,
    description: repository.description ?? "暂无仓库描述",
    stars: repository.stargazers_count,
    primaryLanguage,
    techStack,
    features,
    architectureSummary: `该项目主要使用 ${techStack.slice(0, 5).join("、") || primaryLanguage} 构建，可从功能闭环、数据流、工程化和部署方式四个角度包装。`,
    readmeQuality: readmeQuality(readme),
    resumeBullets: [
      `基于 ${techStack.slice(0, 4).join("、") || primaryLanguage} 构建 ${projectName}，围绕核心业务流程完成可运行项目闭环。`,
      `梳理项目 README、技术栈和功能模块，将仓库能力转化为可用于简历和面试讲解的项目亮点。`,
      `结合代码语言统计和文档信息，总结项目架构、主要功能和可进一步强化的工程化方向。`,
    ],
    interviewQuestions: [
      `你为什么选择 ${primaryLanguage} 作为 ${projectName} 的主要技术？`,
      "这个项目的核心数据流或业务流程是怎样的？",
      "如果要把这个项目部署给真实用户，还需要补哪些稳定性和安全能力？",
      "README 中最能体现项目价值的部分是什么，还可以怎么改进？",
    ],
    analyzedAt: new Date().toISOString().slice(0, 10),
  };
}
