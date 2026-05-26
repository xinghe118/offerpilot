"use client";

import {
  BookOpenCheck,
  Brain,
  CheckCircle2,
  FileSearch,
  Gauge,
  Github,
  Library,
  Lightbulb,
  ListChecks,
  PenLine,
  Settings,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { generateInterviewPrep } from "@/lib/ai/interview-questions";
import { matchResumeToJd } from "@/lib/ai/match-resume";
import { createTailoredResumeVersion } from "@/lib/ai/resume-version";
import { rewriteProjectForJd, type RewriteFocus, type RewriteProjectOptions, type RewriteTone } from "@/lib/ai/rewrite-project";
import { seedJobDescriptions, seedProfile } from "@/lib/domain/seed-data";
import type { GitHubRepoAnalysis, InterviewPrep, JobDescription, Project, ResumeVersion, UserProfile } from "@/lib/domain/types";
import { ScoreCard } from "./ui/score-card";

type TabId = "dashboard" | "jd" | "optimizer" | "interview" | "github" | "profile" | "settings";

const tabs: Array<{ id: TabId; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: "dashboard", label: "工作台", icon: Gauge },
  { id: "jd", label: "JD 分析", icon: FileSearch },
  { id: "optimizer", label: "简历优化", icon: PenLine },
  { id: "interview", label: "面试准备", icon: BookOpenCheck },
  { id: "github", label: "GitHub 分析", icon: Github },
  { id: "profile", label: "经历库", icon: Library },
  { id: "settings", label: "设置", icon: Settings },
];

type WebAiConfig = {
  provider: "local" | "openai";
  baseUrl: string;
  apiKey: string;
  model: string;
};

type WorkspaceSnapshot = {
  profile: UserProfile | null;
  jobs: JobDescription[];
  versions: ResumeVersion[];
  prepDrafts: Record<string, InterviewPrep>;
};

type RewriteDraft = ReturnType<typeof rewriteProjectForJd>;

type RewriteCandidate = RewriteDraft & {
  id: string;
  label: string;
};

const defaultWebAiConfig: WebAiConfig = {
  provider: "local",
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "",
};

function loadWebAiConfig(): WebAiConfig {
  if (typeof window === "undefined") {
    return defaultWebAiConfig;
  }

  try {
    const raw = window.localStorage.getItem("offerpilot.aiConfig");
    if (!raw) {
      return defaultWebAiConfig;
    }
    return {
      ...defaultWebAiConfig,
      ...(JSON.parse(raw) as Partial<WebAiConfig>),
    };
  } catch {
    return defaultWebAiConfig;
  }
}

function isJobDescription(value: JobDescription | { error?: string }): value is JobDescription {
  return "id" in value && "company" in value && "rawText" in value;
}

function cloneProfile(profile: UserProfile): UserProfile {
  return JSON.parse(JSON.stringify(profile)) as UserProfile;
}

function csvToList(value: string) {
  return value
    .split(/[,\n，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToCsv(value: string[]) {
  return value.join("，");
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "amber" }) {
  const classes =
    tone === "green"
      ? "border-accent/25 bg-accent/10 text-accent"
      : tone === "amber"
        ? "border-amber/25 bg-amber/10 text-amber"
        : "border-line bg-white text-muted";
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}>{children}</span>;
}

function PriorityPill({ priority }: { priority: "high" | "medium" | "low" }) {
  const label = priority === "high" ? "高优先级" : priority === "medium" ? "中优先级" : "低优先级";
  return <Pill tone={priority === "high" ? "amber" : priority === "medium" ? "green" : "neutral"}>{label}</Pill>;
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-line bg-white p-5 ${className}`}>{children}</section>;
}

function SectionHeader({ title, detail }: { title: string; detail?: string }) {
  return (
    <div>
      <h2 className="text-base font-bold text-ink">{title}</h2>
      {detail ? <p className="mt-1 text-sm leading-6 text-muted">{detail}</p> : null}
    </div>
  );
}

function TextArea({
  label,
  value,
  rows = 5,
  onChange,
}: {
  label: string;
  value: string;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <textarea
        className="resize-none rounded-md border border-line bg-white px-3 py-2 text-sm leading-6 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <input
        className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function OfferPilotWorkspace() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [profile, setProfile] = useState(seedProfile);
  const [aiConfig, setAiConfig] = useState<WebAiConfig>(defaultWebAiConfig);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [aiTestResult, setAiTestResult] = useState("");
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [isAnalyzingJd, setIsAnalyzingJd] = useState(false);
  const [jdAnalysisError, setJdAnalysisError] = useState("");
  const [rewriteOptions, setRewriteOptions] = useState<Required<RewriteProjectOptions>>({
    tone: "professional",
    focus: "ats",
    variant: 0,
  });
  const [rewriteCandidates, setRewriteCandidates] = useState<RewriteCandidate[]>([]);
  const [selectedRewriteId, setSelectedRewriteId] = useState("");
  const [isRegeneratingRewrite, setIsRegeneratingRewrite] = useState(false);
  const [rewriteError, setRewriteError] = useState("");
  const [versionNotice, setVersionNotice] = useState("");
  const [workspaceStatus, setWorkspaceStatus] = useState("本地状态");
  const [workspaceError, setWorkspaceError] = useState("");
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const [jobs, setJobs] = useState<JobDescription[]>(seedJobDescriptions);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [prepDrafts, setPrepDrafts] = useState<Record<string, InterviewPrep>>({});
  const [repoUrl, setRepoUrl] = useState("https://github.com/xinghe118/offerpilot");
  const [repoAnalysis, setRepoAnalysis] = useState<GitHubRepoAnalysis | null>(null);
  const [repoAnalysisError, setRepoAnalysisError] = useState("");
  const [isAnalyzingRepo, setIsAnalyzingRepo] = useState(false);
  const [activeJobId, setActiveJobId] = useState(seedJobDescriptions[0].id);
  const [draftJob, setDraftJob] = useState({
    company: "Acme AI",
    role: "前端开发工程师",
    rawText: seedJobDescriptions[0].rawText,
  });
  const [activeProjectId, setActiveProjectId] = useState(profile.projects[0].id);

  const activeJob = jobs.find((job) => job.id === activeJobId) ?? jobs[0];
  const activeProject = profile.projects.find((project) => project.id === activeProjectId) ?? profile.projects[0];
  const match = useMemo(() => matchResumeToJd(profile, activeJob), [profile, activeJob]);
  const fallbackRewrite = useMemo(() => rewriteProjectForJd(activeProject, activeJob, rewriteOptions), [activeProject, activeJob, rewriteOptions]);
  const defaultRewriteCandidate = useMemo<RewriteCandidate>(
    () => ({
      ...fallbackRewrite,
      id: "default",
      label: "默认建议",
    }),
    [fallbackRewrite],
  );
  const allRewriteCandidates = useMemo(
    () => [defaultRewriteCandidate, ...rewriteCandidates],
    [defaultRewriteCandidate, rewriteCandidates],
  );
  const rewrite = allRewriteCandidates.find((candidate) => candidate.id === selectedRewriteId) ?? allRewriteCandidates[0];
  const generatedPrep = useMemo(() => generateInterviewPrep(profile, activeJob), [profile, activeJob]);
  const prep = prepDrafts[activeJob.id] ?? generatedPrep;

  const averageMatch = Math.round(jobs.reduce((sum, job) => sum + matchResumeToJd(profile, job).total, 0) / jobs.length);
  const missingCount = match.missingKeywords.length;
  const relatedVersions = versions.filter((version) => version.jdId === activeJob.id);
  const prepCount =
    prep.technicalQuestions.length + prep.projectQuestions.length + prep.behaviorQuestions.length + prep.englishQuestions.length;

  useEffect(() => {
    setAiConfig(loadWebAiConfig());
  }, []);

  useEffect(() => {
    setRewriteCandidates([]);
    setSelectedRewriteId("default");
    setRewriteError("");
  }, [activeProject.id, activeJob.id, rewriteOptions]);

  useEffect(() => {
    let ignore = false;

    async function loadWorkspace() {
      setIsLoadingWorkspace(true);
      setWorkspaceError("");
      try {
        const response = await fetch("/api/workspace", {
          cache: "no-store",
        });
        const data = (await response.json()) as WorkspaceSnapshot | { error?: string };
        if (!response.ok) {
          throw new Error("error" in data ? data.error : "未登录或数据库未配置，继续使用本地状态。");
        }
        if (ignore) {
          return;
        }
        if ("profile" in data) {
          if (data.profile) {
            setProfile(data.profile);
            setActiveProjectId(data.profile.projects[0]?.id ?? "");
          }
          if (data.jobs.length) {
            setJobs(data.jobs);
            setActiveJobId(data.jobs[0].id);
          }
          setVersions(data.versions);
          setPrepDrafts(data.prepDrafts);
          setWorkspaceStatus(data.profile || data.jobs.length ? "已加载云端工作区" : "云端工作区为空");
        }
      } catch (error) {
        if (!ignore) {
          setWorkspaceStatus("本地状态");
          setWorkspaceError(error instanceof Error ? error.message : "未登录或数据库未配置，继续使用本地状态。");
        }
      } finally {
        if (!ignore) {
          setIsLoadingWorkspace(false);
        }
      }
    }

    loadWorkspace();

    return () => {
      ignore = true;
    };
  }, []);

  function saveAiConfig(nextConfig = aiConfig) {
    window.localStorage.setItem("offerpilot.aiConfig", JSON.stringify(nextConfig));
    setSettingsSaved(true);
    window.setTimeout(() => setSettingsSaved(false), 1800);
  }

  async function saveWorkspace() {
    setIsSavingWorkspace(true);
    setWorkspaceError("");
    try {
      const response = await fetch("/api/workspace", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile,
          jobs,
          versions,
          prepDrafts,
        }),
      });
      const result = (await response.json()) as { ok?: boolean; savedAt?: string; error?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "保存失败。");
      }
      setWorkspaceStatus(`已保存 ${new Date(result.savedAt ?? Date.now()).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`);
    } catch (error) {
      setWorkspaceStatus("本地状态");
      setWorkspaceError(error instanceof Error ? error.message : "保存失败。");
    } finally {
      setIsSavingWorkspace(false);
    }
  }

  function preparePrintProfile() {
    window.localStorage.setItem(
      "offerpilot.printProfile",
      JSON.stringify({
        profile,
        sourceLabel: "基础经历库",
      }),
    );
  }

  function prepareVersionPrint(version: ResumeVersion) {
    window.localStorage.setItem(
      "offerpilot.printProfile",
      JSON.stringify({
        profile: version.content,
        sourceLabel: version.name,
        targetCompany: version.targetCompany,
        targetRole: version.targetRole,
        matchScore: version.matchScore.total,
      }),
    );
  }

  async function testAiConnection() {
    setIsTestingAi(true);
    setAiTestResult("");
    try {
      const response = await fetch("/api/ai/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ aiConfig }),
      });
      const result = (await response.json()) as { ok?: boolean; message?: string; sampleKeywords?: string[]; error?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "测试失败。");
      }
      setAiTestResult(`${result.message ?? "测试成功。"} 关键词：${result.sampleKeywords?.join("、") ?? "无"}`);
    } catch (error) {
      setAiTestResult(error instanceof Error ? error.message : "测试失败。");
    } finally {
      setIsTestingAi(false);
    }
  }

  async function analyzeDraftJob() {
    setIsAnalyzingJd(true);
    setJdAnalysisError("");
    try {
      const response = await fetch("/api/ai/analyze-jd", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...draftJob,
          aiConfig,
        }),
      });
      const analyzed = (await response.json()) as JobDescription | { error?: string };
      if (!response.ok || !isJobDescription(analyzed)) {
        throw new Error("error" in analyzed ? analyzed.error : "JD 分析失败。");
      }

      setJobs((current) => [analyzed, ...current]);
      setActiveJobId(analyzed.id);
      setActiveTab("jd");
    } catch (error) {
      setJdAnalysisError(error instanceof Error ? error.message : "JD 分析失败。");
    } finally {
      setIsAnalyzingJd(false);
    }
  }

  async function regenerateRewrite() {
    setIsRegeneratingRewrite(true);
    setRewriteError("");
    try {
      const response = await fetch("/api/ai/rewrite-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project: activeProject,
          jd: activeJob,
          options: {
            ...rewriteOptions,
            variant: rewriteOptions.variant + 1,
          },
          aiConfig,
        }),
      });
      const result = (await response.json()) as RewriteDraft | { error?: string };
      if (!response.ok || !("bullets" in result)) {
        throw new Error("error" in result ? result.error : "重新生成失败。");
      }

      const candidate: RewriteCandidate = {
        ...result,
        id: createId("rewrite"),
        label: `候选 ${rewriteCandidates.length + 2}`,
      };
      setRewriteCandidates((current) => [candidate, ...current].slice(0, 4));
      setSelectedRewriteId(candidate.id);
    } catch (error) {
      setRewriteError(error instanceof Error ? error.message : "重新生成失败。");
    } finally {
      setIsRegeneratingRewrite(false);
    }
  }

  function applyRewrite(candidate = rewrite) {
    setProfile((current) => {
      const next = cloneProfile(current);
      next.projects = next.projects.map((project) =>
        project.id === activeProject.id
          ? {
              ...project,
              resumeBullets: candidate.bullets,
            }
          : project,
      );
      return next;
    });
  }

  function createVersionFromRewrite(candidate = rewrite) {
    const version = createTailoredResumeVersion({
      profile,
      jd: activeJob,
      project: activeProject,
      bullets: candidate.bullets,
    });
    setVersions((current) => [version, ...current]);
    setVersionNotice(`已生成：${version.name}`);
    window.setTimeout(() => setVersionNotice(""), 2200);
  }

  function addSkill() {
    setProfile((current) => ({
      ...current,
      skills: [...current.skills, "新技能"],
    }));
  }

  function updateSkill(index: number, value: string) {
    setProfile((current) => ({
      ...current,
      skills: current.skills.map((skill, skillIndex) => (skillIndex === index ? value : skill)),
    }));
  }

  function removeSkill(index: number) {
    setProfile((current) => ({
      ...current,
      skills: current.skills.filter((_, skillIndex) => skillIndex !== index),
    }));
  }

  function addEducation() {
    setProfile((current) => ({
      ...current,
      education: [
        ...current.education,
        {
          id: createId("edu"),
          school: "学校名称",
          degree: "学历",
          major: "专业",
          startDate: "2022.09",
          endDate: "2026.06",
          highlights: ["补充课程、项目或荣誉。"],
        },
      ],
    }));
  }

  function updateEducation(id: string, patch: Partial<UserProfile["education"][number]>) {
    setProfile((current) => ({
      ...current,
      education: current.education.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }

  function removeEducation(id: string) {
    setProfile((current) => ({
      ...current,
      education: current.education.filter((item) => item.id !== id),
    }));
  }

  function addWorkExperience() {
    setProfile((current) => ({
      ...current,
      experience: [
        ...current.experience,
        {
          id: createId("work"),
          company: "公司名称",
          role: "岗位名称",
          startDate: "2025.01",
          endDate: "2025.06",
          highlights: ["补充职责、技术动作和结果。"],
        },
      ],
    }));
  }

  function updateWorkExperience(id: string, patch: Partial<UserProfile["experience"][number]>) {
    setProfile((current) => ({
      ...current,
      experience: current.experience.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }

  function removeWorkExperience(id: string) {
    setProfile((current) => ({
      ...current,
      experience: current.experience.filter((item) => item.id !== id),
    }));
  }

  function addProject() {
    const projectId = createId("project");
    setProfile((current) => ({
      ...current,
      projects: [
        ...current.projects,
        {
          id: projectId,
          name: "新项目",
          role: "开发者",
          techStack: ["TypeScript"],
          features: ["核心功能"],
          rawDescription: "描述项目背景、你负责的内容和业务结果。",
          resumeBullets: ["补充可写进简历的项目 bullet。"],
          interviewTalkingPoints: ["补充可能被问到的技术点。"],
        },
      ],
    }));
    setActiveProjectId(projectId);
  }

  function updateProject(id: string, patch: Partial<UserProfile["projects"][number]>) {
    setProfile((current) => ({
      ...current,
      projects: current.projects.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }

  function removeProject(id: string) {
    setProfile((current) => {
      const projects = current.projects.filter((item) => item.id !== id);
      if (activeProjectId === id) {
        setActiveProjectId(projects[0]?.id ?? "");
      }
      return {
        ...current,
        projects,
      };
    });
  }

  function ensurePrepDraft() {
    setPrepDrafts((current) => (current[activeJob.id] ? current : { ...current, [activeJob.id]: generatedPrep }));
  }

  function updateQuestionDraft(questionId: string, answerDraft: string) {
    setPrepDrafts((current) => {
      const base = current[activeJob.id] ?? generatedPrep;
      const updateGroup = (items: typeof base.technicalQuestions) =>
        items.map((item) => (item.id === questionId ? { ...item, answerDraft } : item));
      return {
        ...current,
        [activeJob.id]: {
          ...base,
          technicalQuestions: updateGroup(base.technicalQuestions),
          projectQuestions: updateGroup(base.projectQuestions),
          behaviorQuestions: updateGroup(base.behaviorQuestions),
          englishQuestions: updateGroup(base.englishQuestions),
        },
      };
    });
  }

  function togglePracticed(questionId: string) {
    setPrepDrafts((current) => {
      const base = current[activeJob.id] ?? generatedPrep;
      const updateGroup = (items: typeof base.technicalQuestions) =>
        items.map((item) => (item.id === questionId ? { ...item, practiced: !item.practiced } : item));
      return {
        ...current,
        [activeJob.id]: {
          ...base,
          technicalQuestions: updateGroup(base.technicalQuestions),
          projectQuestions: updateGroup(base.projectQuestions),
          behaviorQuestions: updateGroup(base.behaviorQuestions),
          englishQuestions: updateGroup(base.englishQuestions),
        },
      };
    });
  }

  async function analyzeRepo() {
    setIsAnalyzingRepo(true);
    setRepoAnalysisError("");
    try {
      const response = await fetch("/api/github/analyze-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl }),
      });

      const data = (await response.json()) as GitHubRepoAnalysis | { error?: string };
      if (!response.ok) {
        throw new Error("error" in data ? data.error : "仓库分析失败。");
      }

      setRepoAnalysis(data as GitHubRepoAnalysis);
    } catch (error) {
      setRepoAnalysisError(error instanceof Error ? error.message : "仓库分析失败。");
    } finally {
      setIsAnalyzingRepo(false);
    }
  }

  const allPrepQuestions = [
    ...prep.technicalQuestions,
    ...prep.projectQuestions,
    ...prep.behaviorQuestions,
    ...prep.englishQuestions,
  ];
  const practicedCount = allPrepQuestions.filter((item) => item.practiced).length;
  const draftedCount = allPrepQuestions.filter((item) => item.answerDraft.trim().length > 0).length;

  return (
    <main className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-0 text-accent">OfferPilot</p>
            <h1 className="text-xl font-bold text-ink">AI 求职工作台</h1>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone={workspaceStatus.includes("保存") || workspaceStatus.includes("加载") ? "green" : "neutral"}>
              {isLoadingWorkspace ? "加载中" : workspaceStatus}
            </Pill>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md bg-accent px-3 text-xs font-semibold text-white transition hover:bg-accent/90 disabled:opacity-60"
              onClick={saveWorkspace}
              disabled={isSavingWorkspace}
            >
              <CheckCircle2 size={14} />
              {isSavingWorkspace ? "保存中" : "保存工作区"}
            </button>
            <a
              className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-accent"
              href="/resume/print"
              onClick={preparePrintProfile}
              target="_blank"
            >
              打印简历
            </a>
          </div>
        </div>
      </header>
      {workspaceError ? (
        <div className="border-b border-line bg-amber/10">
          <div className="mx-auto max-w-[1440px] px-5 py-2 text-sm leading-6 text-amber">{workspaceError}</div>
        </div>
      ) : null}

      <nav className="border-b border-line bg-white/80">
        <div className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-5 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
                  active ? "bg-ink text-white" : "text-muted hover:bg-canvas hover:text-ink"
                }`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 px-5 py-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0">
          {activeTab === "dashboard" && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-4">
                <ScoreCard label="已分析 JD" value={jobs.length} detail="当前保存在本地状态中的岗位描述" tone="blue" />
                <ScoreCard label="平均匹配度" value={averageMatch} detail="基于经历库和全部 JD 的规则评分" />
                <ScoreCard label="待补关键词" value={missingCount} detail="当前选中 JD 中尚未覆盖的关键词" tone="amber" />
                <ScoreCard label="定制版本" value={versions.length} detail="已基于 JD 生成的本地简历版本" tone="blue" />
              </div>

              <Panel>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <SectionHeader title="当前目标岗位" detail={`${activeJob.company} · ${activeJob.role}`} />
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-white transition hover:bg-accent/90"
                    onClick={() => setActiveTab("jd")}
                  >
                    <FileSearch size={16} />
                    分析新 JD
                  </button>
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  {jobs.map((job) => {
                    const jobMatch = matchResumeToJd(profile, job);
                    return (
                      <button
                        className={`rounded-lg border p-4 text-left transition ${
                          activeJobId === job.id ? "border-accent bg-accent/5" : "border-line bg-white hover:border-accent"
                        }`}
                        key={job.id}
                        onClick={() => setActiveJobId(job.id)}
                      >
                        <h3 className="text-sm font-bold text-ink">{job.company}</h3>
                        <p className="mt-1 text-sm text-muted">{job.role}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Pill tone={jobMatch.total >= 75 ? "green" : "amber"}>匹配 {jobMatch.total}</Pill>
                          <Pill>{job.keywords.slice(0, 3).join(" / ")}</Pill>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Panel>

              <div className="grid gap-4 lg:grid-cols-2">
                <Panel>
                  <SectionHeader title="下一步动作" detail="第一版聚焦优化材料，不做投递 Kanban。" />
                  <div className="mt-4 space-y-3">
                    {match.suggestedActions.slice(0, 3).map((action) => (
                      <div className="rounded-md border border-line p-3" key={action.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-bold text-ink">{action.target}</p>
                          <PriorityPill priority={action.priority} />
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted">{action.reason}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel>
                  <SectionHeader title="岗位重点" detail="从 JD 中提取，后续接入真实 AI 后会更精细。" />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {activeJob.emphasis.map((item) => (
                      <Pill tone="green" key={item}>
                        {item}
                      </Pill>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {activeTab === "jd" && (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <Panel>
                <SectionHeader title="粘贴岗位 JD" detail="本地规则会先提取技能、关键词和岗位强调点。" />
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Input label="公司" value={draftJob.company} onChange={(value) => setDraftJob((current) => ({ ...current, company: value }))} />
                  <Input label="岗位" value={draftJob.role} onChange={(value) => setDraftJob((current) => ({ ...current, role: value }))} />
                </div>
                <div className="mt-4">
                  <TextArea
                    label="JD 原文"
                    rows={13}
                    value={draftJob.rawText}
                    onChange={(value) => setDraftJob((current) => ({ ...current, rawText: value }))}
                  />
                </div>
                <button
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-60"
                  onClick={analyzeDraftJob}
                  disabled={isAnalyzingJd}
                >
                  <Sparkles size={16} />
                  {isAnalyzingJd ? "分析中" : "分析 JD"}
                </button>
                {jdAnalysisError ? (
                  <div className="mt-4 rounded-md border border-danger/20 bg-danger/5 p-3 text-sm leading-6 text-danger">
                    {jdAnalysisError}
                  </div>
                ) : null}
              </Panel>

              <Panel>
                <SectionHeader title="结构化分析结果" detail={`${activeJob.company} · ${activeJob.role} · ${activeJob.seniority ?? "未知等级"}`} />
                <div className="mt-5 grid gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted">必备技能</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activeJob.requiredSkills.map((keyword) => (
                        <Pill tone="green" key={keyword}>
                          {keyword}
                        </Pill>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted">加分项</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activeJob.niceToHave.map((keyword) => (
                        <Pill key={keyword}>{keyword}</Pill>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted">软技能 / 工作方式</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activeJob.softSkills.map((keyword) => (
                        <Pill key={keyword}>{keyword}</Pill>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted">职责总结</p>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
                      {activeJob.responsibilities.map((item) => (
                        <li className="flex gap-2" key={item}>
                          <ListChecks className="mt-1 shrink-0 text-accent" size={15} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted">简历应强调</p>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
                      {activeJob.emphasis.map((item) => (
                        <li className="flex gap-2" key={item}>
                          <Target className="mt-1 shrink-0 text-accent" size={15} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "optimizer" && (
            <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
              <Panel>
                <SectionHeader title="选择项目" detail="AI 改写只能基于已有项目事实。" />
                <div className="mt-4 grid gap-3">
                  {profile.projects.map((project) => (
                    <button
                      className={`rounded-lg border p-4 text-left transition ${
                        activeProjectId === project.id ? "border-accent bg-accent/5" : "border-line hover:border-accent"
                      }`}
                      key={project.id}
                      onClick={() => setActiveProjectId(project.id)}
                    >
                      <h3 className="text-sm font-bold text-ink">{project.name}</h3>
                      <p className="mt-1 text-xs text-muted">{project.techStack.join(" / ")}</p>
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <SectionHeader title="AI 项目描述改写" detail={`${activeProject.name} -> ${activeJob.company} ${activeJob.role}`} />
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:border-accent disabled:opacity-60"
                    onClick={regenerateRewrite}
                    disabled={isRegeneratingRewrite}
                  >
                    <Sparkles size={16} />
                    {isRegeneratingRewrite ? "生成中" : "重新生成"}
                  </button>
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-white transition hover:bg-accent/90"
                    onClick={() => applyRewrite()}
                  >
                    <PenLine size={16} />
                    应用建议
                  </button>
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-3 text-sm font-semibold text-white transition hover:bg-ink/90"
                    onClick={() => createVersionFromRewrite()}
                  >
                    <Sparkles size={16} />
                    生成定制版
                  </button>
                </div>
                <div className="mt-4 grid gap-3 rounded-lg border border-line bg-canvas p-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold text-muted">表达语气</span>
                    <select
                      className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                      value={rewriteOptions.tone}
                      onChange={(event) =>
                        setRewriteOptions((current) => ({ ...current, tone: event.target.value as RewriteTone }))
                      }
                    >
                      <option value="professional">专业稳健</option>
                      <option value="impact">成果冲击</option>
                      <option value="concise">简洁扫读</option>
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold text-muted">优化方向</span>
                    <select
                      className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                      value={rewriteOptions.focus}
                      onChange={(event) =>
                        setRewriteOptions((current) => ({ ...current, focus: event.target.value as RewriteFocus }))
                      }
                    >
                      <option value="ats">JD 关键词 / ATS</option>
                      <option value="frontend">前端岗位</option>
                      <option value="fullstack">全栈岗位</option>
                      <option value="ai">AI 应用岗位</option>
                    </select>
                  </label>
                </div>
                {versionNotice ? (
                  <div className="mt-4 rounded-md border border-accent/20 bg-accent/5 p-3 text-sm font-semibold text-accent">
                    {versionNotice}
                  </div>
                ) : null}
                {rewriteError ? (
                  <div className="mt-4 rounded-md border border-danger/20 bg-danger/5 p-3 text-sm leading-6 text-danger">
                    {rewriteError}
                  </div>
                ) : null}
                <div className="mt-5 grid gap-4">
                  <div className="rounded-lg border border-line p-4">
                    <p className="text-xs font-semibold text-muted">原始描述</p>
                    <p className="mt-2 text-sm leading-6 text-ink">{activeProject.rawDescription}</p>
                    <p className="mt-4 text-xs font-semibold text-muted">当前简历 bullet</p>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
                      {activeProject.resumeBullets.map((item) => (
                        <li className="flex gap-2" key={item}>
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-ink">改写候选对比</p>
                        <p className="mt-1 text-xs text-muted">选择一个候选后，可应用到项目或生成定制简历版本。</p>
                      </div>
                      <Pill tone={allRewriteCandidates.length > 1 ? "green" : "neutral"}>{allRewriteCandidates.length} 个候选</Pill>
                    </div>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      {allRewriteCandidates.map((candidate) => {
                        const active = rewrite.id === candidate.id;
                        return (
                          <div
                            className={`rounded-lg border p-4 transition ${
                              active ? "border-accent bg-accent/5" : "border-line bg-white"
                            }`}
                            key={candidate.id}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className={`text-xs font-semibold ${active ? "text-accent" : "text-muted"}`}>
                                {candidate.label}
                              </p>
                              <button
                                className={`h-8 rounded-md border px-3 text-xs font-semibold transition ${
                                  active
                                    ? "border-accent bg-accent text-white"
                                    : "border-line bg-white text-ink hover:border-accent"
                                }`}
                                onClick={() => setSelectedRewriteId(candidate.id)}
                              >
                                {active ? "已选择" : "选择"}
                              </button>
                            </div>
                            <ul className="mt-3 space-y-2 text-sm leading-6 text-ink">
                              {candidate.bullets.map((item) => (
                                <li className="flex gap-2" key={item}>
                                  <Sparkles className="mt-1 shrink-0 text-accent" size={15} />
                                  {item}
                                </li>
                              ))}
                            </ul>
                            <p className="mt-4 text-xs font-semibold text-muted">为什么这样改</p>
                            <ul className="mt-2 space-y-1 text-sm leading-6 text-muted">
                              {candidate.reasoning.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                className="h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-accent"
                                onClick={() => {
                                  setSelectedRewriteId(candidate.id);
                                  applyRewrite(candidate);
                                }}
                              >
                                应用此候选
                              </button>
                              <button
                                className="h-9 rounded-md bg-ink px-3 text-xs font-semibold text-white transition hover:bg-ink/90"
                                onClick={() => {
                                  setSelectedRewriteId(candidate.id);
                                  createVersionFromRewrite(candidate);
                                }}
                              >
                                生成版本
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="mt-5 rounded-lg border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-ink">当前 JD 的定制版本</p>
                      <p className="mt-1 text-xs text-muted">生成版本会保存为本地状态，后续阶段接入数据库持久化。</p>
                    </div>
                    <Pill tone={relatedVersions.length ? "green" : "neutral"}>{relatedVersions.length} 个版本</Pill>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {relatedVersions.length ? (
                      relatedVersions.map((version) => (
                        <div className="rounded-md border border-line bg-white p-3" key={version.id}>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-bold text-ink">{version.name}</p>
                              <p className="mt-1 text-xs text-muted">
                                {version.targetCompany} · {version.targetRole} · {version.updatedAt}
                              </p>
                            </div>
                            <Pill tone={version.matchScore.total >= 75 ? "green" : "amber"}>
                              匹配 {version.matchScore.total}
                            </Pill>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-muted">{version.content.summary}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <a
                              className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-accent"
                              href="/resume/print"
                              onClick={() => prepareVersionPrint(version)}
                              target="_blank"
                            >
                              预览打印
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted">还没有为当前 JD 生成定制版本。</p>
                    )}
                  </div>
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "interview" && (
            <div className="space-y-5">
              <Panel>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <SectionHeader title="面试准备" detail={`基于 ${activeJob.company} ${activeJob.role} 和当前经历库生成。`} />
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-white transition hover:bg-accent/90"
                    onClick={ensurePrepDraft}
                  >
                    <BookOpenCheck size={16} />
                    保存为草稿
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <ScoreCard label="问题总数" value={allPrepQuestions.length} detail="技术、项目、行为和英文问题" tone="blue" />
                  <ScoreCard label="已写草稿" value={draftedCount} detail="已有答案草稿的问题" tone={draftedCount ? "green" : "amber"} />
                  <ScoreCard label="已练习" value={practicedCount} detail="标记为已练习的问题" tone={practicedCount ? "green" : "amber"} />
                </div>
                <p className="mt-4 rounded-md border border-line bg-canvas p-4 text-sm leading-6 text-ink">{prep.selfIntroduction}</p>
              </Panel>
              <div className="grid gap-4">
                {[
                  ["技术问题", prep.technicalQuestions],
                  ["项目追问", prep.projectQuestions],
                  ["行为面试", prep.behaviorQuestions],
                  ["英文问题", prep.englishQuestions],
                ].map(([title, questions]) => (
                  <Panel key={title as string}>
                    <SectionHeader title={title as string} />
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      {(questions as typeof prep.technicalQuestions).map((item) => (
                        <div className="rounded-lg border border-line p-4" key={item.id}>
                          <div className="flex items-start gap-2">
                            <Brain className="mt-1 shrink-0 text-accent" size={15} />
                            <p className="text-sm font-semibold leading-6 text-ink">{item.question}</p>
                          </div>
                          <textarea
                            className="mt-3 min-h-24 w-full resize-none rounded-md border border-line bg-white px-3 py-2 text-sm leading-6 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                            placeholder="写下你的回答要点、项目例子或需要补充的数据..."
                            value={item.answerDraft}
                            onChange={(event) => updateQuestionDraft(item.id, event.target.value)}
                          />
                          <button
                            className={`mt-3 inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${
                              item.practiced
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-line bg-white text-muted hover:border-accent hover:text-ink"
                            }`}
                            onClick={() => togglePracticed(item.id)}
                          >
                            <CheckCircle2 size={14} />
                            {item.practiced ? "已练习" : "标记已练习"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </Panel>
                ))}
              </div>
              <Panel>
                <SectionHeader title="反问面试官" />
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {prep.questionsToAsk.map((item) => (
                    <div className="rounded-md border border-line p-3 text-sm leading-6 text-muted" key={item}>
                      {item}
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "github" && (
            <div className="space-y-5">
              <Panel>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <SectionHeader
                    title="GitHub 项目分析器"
                    detail="输入公开仓库 URL，生成技术栈、README 质量反馈、简历亮点和面试问题。"
                  />
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-60"
                    onClick={analyzeRepo}
                    disabled={isAnalyzingRepo}
                  >
                    <Github size={16} />
                    {isAnalyzingRepo ? "分析中" : "分析仓库"}
                  </button>
                </div>
                <div className="mt-4">
                  <Input label="GitHub 仓库 URL" value={repoUrl} onChange={setRepoUrl} />
                </div>
                {repoAnalysisError ? (
                  <div className="mt-4 rounded-md border border-danger/20 bg-danger/5 p-3 text-sm leading-6 text-danger">
                    {repoAnalysisError}
                  </div>
                ) : null}
              </Panel>

              {repoAnalysis ? (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <ScoreCard label="Stars" value={repoAnalysis.stars} detail={repoAnalysis.name} tone="blue" />
                    <ScoreCard label="技术栈" value={repoAnalysis.techStack.length} detail={repoAnalysis.primaryLanguage} tone="green" />
                    <ScoreCard label="功能线索" value={repoAnalysis.features.length} detail="来自 README 摘要" tone="amber" />
                    <ScoreCard label="面试题" value={repoAnalysis.interviewQuestions.length} detail="仓库定制问题" tone="blue" />
                  </div>

                  <Panel>
                    <SectionHeader title={`${repoAnalysis.owner}/${repoAnalysis.name}`} detail={repoAnalysis.description} />
                    <div className="mt-4 flex flex-wrap gap-2">
                      {repoAnalysis.techStack.map((item) => (
                        <Pill tone="green" key={item}>
                          {item}
                        </Pill>
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted">{repoAnalysis.architectureSummary}</p>
                    <p className="mt-3 rounded-md border border-line bg-canvas p-3 text-sm leading-6 text-muted">{repoAnalysis.readmeQuality}</p>
                  </Panel>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Panel>
                      <SectionHeader title="可写进简历的亮点" />
                      <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
                        {repoAnalysis.resumeBullets.map((item) => (
                          <li className="flex gap-2" key={item}>
                            <Sparkles className="mt-1 shrink-0 text-accent" size={15} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </Panel>
                    <Panel>
                      <SectionHeader title="可能被问的问题" />
                      <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
                        {repoAnalysis.interviewQuestions.map((item) => (
                          <li className="flex gap-2" key={item}>
                            <Brain className="mt-1 shrink-0 text-accent" size={15} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </Panel>
                  </div>
                </>
              ) : (
                <Panel>
                  <SectionHeader title="等待分析" detail="分析结果会展示技术栈、项目结构摘要、README 质量、简历 bullet 和面试题。" />
                </Panel>
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-5">
              <Panel>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <SectionHeader title="个人经历库" detail="这是 AI 改写、JD 匹配和面试准备的事实来源。" />
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-white transition hover:bg-accent/90"
                    onClick={saveWorkspace}
                    disabled={isSavingWorkspace}
                  >
                    <CheckCircle2 size={16} />
                    {isSavingWorkspace ? "保存中" : "保存经历库"}
                  </button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Input
                    label="姓名"
                    value={profile.name}
                    onChange={(value) => setProfile((current) => ({ ...current, name: value }))}
                  />
                  <Input
                    label="邮箱"
                    value={profile.email}
                    onChange={(value) => setProfile((current) => ({ ...current, email: value }))}
                  />
                  <Input
                    label="电话"
                    value={profile.phone}
                    onChange={(value) => setProfile((current) => ({ ...current, phone: value }))}
                  />
                  <Input
                    label="城市"
                    value={profile.location}
                    onChange={(value) => setProfile((current) => ({ ...current, location: value }))}
                  />
                  <Input
                    label="目标岗位"
                    value={profile.targetRole}
                    onChange={(value) => setProfile((current) => ({ ...current, targetRole: value }))}
                  />
                </div>
                <div className="mt-4">
                  <TextArea
                    label="个人概要"
                    rows={4}
                    value={profile.summary}
                    onChange={(value) => setProfile((current) => ({ ...current, summary: value }))}
                  />
                </div>
              </Panel>
              <Panel>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <SectionHeader title="技能关键词" detail="技能会参与 JD 匹配和简历版本生成。" />
                  <button
                    className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-accent"
                    onClick={addSkill}
                  >
                    新增技能
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {profile.skills.map((skill, index) => (
                    <div className="flex gap-2" key={`${skill}-${index}`}>
                      <input
                        className={`h-10 min-w-0 flex-1 rounded-md border px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 ${
                          activeJob.keywords.includes(skill) ? "border-accent bg-accent/5 text-accent" : "border-line bg-white text-ink"
                        }`}
                        value={skill}
                        onChange={(event) => updateSkill(index, event.target.value)}
                      />
                      <button
                        className="h-10 rounded-md border border-line bg-white px-3 text-xs font-semibold text-muted transition hover:border-danger hover:text-danger"
                        onClick={() => removeSkill(index)}
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <SectionHeader title="教育经历" />
                  <button
                    className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-accent"
                    onClick={addEducation}
                  >
                    新增教育
                  </button>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {profile.education.map((item) => (
                    <div className="rounded-lg border border-line p-4" key={item.id}>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input label="学校" value={item.school} onChange={(value) => updateEducation(item.id, { school: value })} />
                        <Input label="学历" value={item.degree} onChange={(value) => updateEducation(item.id, { degree: value })} />
                        <Input label="专业" value={item.major} onChange={(value) => updateEducation(item.id, { major: value })} />
                        <Input label="时间" value={`${item.startDate} - ${item.endDate ?? "至今"}`} onChange={(value) => {
                          const [startDate, endDate] = value.split("-").map((part) => part.trim());
                          updateEducation(item.id, { startDate: startDate || item.startDate, endDate: endDate || undefined });
                        }} />
                      </div>
                      <div className="mt-3">
                        <TextArea
                          label="亮点，逗号或换行分隔"
                          rows={3}
                          value={listToCsv(item.highlights)}
                          onChange={(value) => updateEducation(item.id, { highlights: csvToList(value) })}
                        />
                      </div>
                      <button
                        className="mt-3 h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-muted transition hover:border-danger hover:text-danger"
                        onClick={() => removeEducation(item.id)}
                      >
                        删除教育
                      </button>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <SectionHeader title="工作经历" />
                  <button
                    className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-accent"
                    onClick={addWorkExperience}
                  >
                    新增工作
                  </button>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {profile.experience.map((item) => (
                    <div className="rounded-lg border border-line p-4" key={item.id}>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input label="公司" value={item.company} onChange={(value) => updateWorkExperience(item.id, { company: value })} />
                        <Input label="岗位" value={item.role} onChange={(value) => updateWorkExperience(item.id, { role: value })} />
                        <Input label="开始时间" value={item.startDate} onChange={(value) => updateWorkExperience(item.id, { startDate: value })} />
                        <Input label="结束时间" value={item.endDate ?? ""} onChange={(value) => updateWorkExperience(item.id, { endDate: value || undefined })} />
                      </div>
                      <div className="mt-3">
                        <TextArea
                          label="经历亮点，逗号或换行分隔"
                          rows={4}
                          value={listToCsv(item.highlights)}
                          onChange={(value) => updateWorkExperience(item.id, { highlights: csvToList(value) })}
                        />
                      </div>
                      <button
                        className="mt-3 h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-muted transition hover:border-danger hover:text-danger"
                        onClick={() => removeWorkExperience(item.id)}
                      >
                        删除工作
                      </button>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <SectionHeader title="项目库" detail="项目内容会直接影响 AI 改写、JD 匹配和面试问题。" />
                  <button
                    className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-accent"
                    onClick={addProject}
                  >
                    新增项目
                  </button>
                </div>
                <div className="mt-4 grid gap-4">
                  {profile.projects.map((project) => (
                    <div className="rounded-lg border border-line p-4" key={project.id}>
                      <div className="grid gap-3 lg:grid-cols-2">
                        <Input label="项目名称" value={project.name} onChange={(value) => updateProject(project.id, { name: value })} />
                        <Input label="角色" value={project.role} onChange={(value) => updateProject(project.id, { role: value })} />
                        <Input
                          label="技术栈，逗号分隔"
                          value={listToCsv(project.techStack)}
                          onChange={(value) => updateProject(project.id, { techStack: csvToList(value) })}
                        />
                        <Input
                          label="功能点，逗号分隔"
                          value={listToCsv(project.features)}
                          onChange={(value) => updateProject(project.id, { features: csvToList(value) })}
                        />
                      </div>
                      <div className="mt-3 grid gap-3 lg:grid-cols-3">
                        <TextArea
                          label="原始描述"
                          rows={5}
                          value={project.rawDescription}
                          onChange={(value) => updateProject(project.id, { rawDescription: value })}
                        />
                        <TextArea
                          label="简历 bullet，逗号或换行分隔"
                          rows={5}
                          value={listToCsv(project.resumeBullets)}
                          onChange={(value) => updateProject(project.id, { resumeBullets: csvToList(value) })}
                        />
                        <TextArea
                          label="面试讲解点，逗号或换行分隔"
                          rows={5}
                          value={listToCsv(project.interviewTalkingPoints)}
                          onChange={(value) => updateProject(project.id, { interviewTalkingPoints: csvToList(value) })}
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-accent"
                          onClick={() => {
                            setActiveProjectId(project.id);
                            setActiveTab("optimizer");
                          }}
                        >
                          去优化
                        </button>
                        <button
                          className="h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-muted transition hover:border-danger hover:text-danger"
                          onClick={() => removeProject(project.id)}
                        >
                          删除项目
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-5">
              <Panel>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <SectionHeader
                    title="AI 接口设置"
                    detail="本地 MVP 会把配置保存在浏览器 localStorage。后续多用户版应改为服务端加密保存。"
                  />
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-white transition hover:bg-accent/90"
                    onClick={() => saveAiConfig()}
                  >
                    <Settings size={16} />
                    保存设置
                  </button>
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:border-accent disabled:opacity-60"
                    onClick={testAiConnection}
                    disabled={isTestingAi}
                  >
                    <Sparkles size={16} />
                    {isTestingAi ? "测试中" : "测试连接"}
                  </button>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold text-muted">Provider</span>
                    <select
                      className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
                      value={aiConfig.provider}
                      onChange={(event) => setAiConfig((current) => ({ ...current, provider: event.target.value as WebAiConfig["provider"] }))}
                    >
                      <option value="local">Local rules</option>
                      <option value="openai">OpenAI-compatible</option>
                    </select>
                  </label>
                  <Input
                    label="Model"
                    value={aiConfig.model}
                    onChange={(value) => setAiConfig((current) => ({ ...current, model: value }))}
                  />
                  <Input
                    label="Base URL"
                    value={aiConfig.baseUrl}
                    onChange={(value) => setAiConfig((current) => ({ ...current, baseUrl: value }))}
                  />
                  <Input
                    label="API Key"
                    value={aiConfig.apiKey}
                    type="password"
                    onChange={(value) => setAiConfig((current) => ({ ...current, apiKey: value }))}
                  />
                </div>
                <div className="mt-5 rounded-md border border-line bg-canvas p-4 text-sm leading-6 text-muted">
                  当前模式：{aiConfig.provider === "local" ? "本地规则，不需要 API Key。" : "OpenAI-compatible，请填写 Base URL、API Key 和 Model。远程失败会回退本地规则。"}
                </div>
                {settingsSaved ? <p className="mt-3 text-sm font-semibold text-accent">设置已保存到当前浏览器。</p> : null}
                {aiTestResult ? (
                  <div className="mt-3 rounded-md border border-line bg-white p-3 text-sm leading-6 text-muted">
                    {aiTestResult}
                  </div>
                ) : null}
              </Panel>
            </div>
          )}
        </section>

        <aside className="min-w-0">
          <div className="sticky top-5 space-y-5">
            <Panel>
              <SectionHeader title="当前上下文" detail={`${activeJob.company} · ${activeJob.role}`} />
              <div className="mt-4 grid gap-3">
                <ScoreCard label="总匹配度" value={match.total} detail="规则评分，后续接入 AI 评估" tone={match.total >= 75 ? "green" : "amber"} />
                <div className="grid grid-cols-2 gap-2 text-xs text-muted">
                  <div className="rounded-md border border-line p-3">技能 {match.skills}/25</div>
                  <div className="rounded-md border border-line p-3">项目 {match.projectRelevance}/25</div>
                  <div className="rounded-md border border-line p-3">关键词 {match.keywordCoverage}/20</div>
                  <div className="rounded-md border border-line p-3">ATS {match.atsFriendliness}/15</div>
                </div>
                <div className="rounded-md border border-line p-3 text-xs text-muted">
                  当前 JD 已生成 {relatedVersions.length} 个定制简历版本。
                </div>
              </div>
            </Panel>
            <Panel>
              <SectionHeader title="关键词覆盖" />
              <p className="mt-4 text-xs font-semibold text-muted">已覆盖</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {match.matchedKeywords.map((keyword) => (
                  <Pill tone="green" key={keyword}>
                    {keyword}
                  </Pill>
                ))}
              </div>
              <p className="mt-4 text-xs font-semibold text-muted">待补充</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {match.missingKeywords.length ? (
                  match.missingKeywords.map((keyword) => (
                    <Pill tone="amber" key={keyword}>
                      {keyword}
                    </Pill>
                  ))
                ) : (
                  <p className="text-sm text-muted">当前 JD 关键词覆盖较完整。</p>
                )}
              </div>
            </Panel>
            <Panel>
              <SectionHeader title="具体修改建议" />
              <div className="mt-4 space-y-3">
                {match.suggestedActions.map((action) => (
                  <div className="rounded-md border border-line p-3" key={action.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-ink">{action.target}</p>
                      <PriorityPill priority={action.priority} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted">{action.recommendedText}</p>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel>
              <SectionHeader title="ATS 友好检查" />
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
                {match.atsChecks.map((check) => (
                  <li className="flex gap-2" key={check.id}>
                    <CheckCircle2 className={`mt-1 shrink-0 ${check.passed ? "text-accent" : "text-amber"}`} size={15} />
                    <span>
                      <span className="font-semibold text-ink">{check.label}</span>
                      <br />
                      {check.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel>
              <SectionHeader title="产品化阶段" />
              <ul className="mt-4 space-y-2 text-sm leading-6 text-muted">
                <li className="flex gap-2"><ListChecks className="mt-1 shrink-0 text-accent" size={15} />数据库登录与多用户保存</li>
                <li className="flex gap-2"><Sparkles className="mt-1 shrink-0 text-accent" size={15} />真实 AI API</li>
                <li className="flex gap-2"><FileSearch className="mt-1 shrink-0 text-accent" size={15} />PDF 导出与 GitHub 项目分析器</li>
              </ul>
            </Panel>
          </div>
        </aside>
      </div>
    </main>
  );
}
