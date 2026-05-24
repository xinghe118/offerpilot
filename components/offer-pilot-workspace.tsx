"use client";

import {
  BookOpenCheck,
  Brain,
  CheckCircle2,
  FileSearch,
  Gauge,
  Library,
  Lightbulb,
  ListChecks,
  PenLine,
  Sparkles,
  Target,
} from "lucide-react";
import { useMemo, useState } from "react";
import { analyzeJobDescription } from "@/lib/ai/analyze-jd";
import { generateInterviewPrep } from "@/lib/ai/interview-questions";
import { matchResumeToJd } from "@/lib/ai/match-resume";
import { createTailoredResumeVersion } from "@/lib/ai/resume-version";
import { rewriteProjectForJd } from "@/lib/ai/rewrite-project";
import { seedJobDescriptions, seedProfile } from "@/lib/domain/seed-data";
import type { InterviewPrep, JobDescription, Project, ResumeVersion, UserProfile } from "@/lib/domain/types";
import { ScoreCard } from "./ui/score-card";

type TabId = "dashboard" | "jd" | "optimizer" | "interview" | "profile";

const tabs: Array<{ id: TabId; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: "dashboard", label: "工作台", icon: Gauge },
  { id: "jd", label: "JD 分析", icon: FileSearch },
  { id: "optimizer", label: "简历优化", icon: PenLine },
  { id: "interview", label: "面试准备", icon: BookOpenCheck },
  { id: "profile", label: "经历库", icon: Library },
];

function cloneProfile(profile: UserProfile): UserProfile {
  return JSON.parse(JSON.stringify(profile)) as UserProfile;
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-muted">{label}</span>
      <input
        className="h-10 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function OfferPilotWorkspace() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [profile, setProfile] = useState(seedProfile);
  const [jobs, setJobs] = useState<JobDescription[]>(seedJobDescriptions);
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [prepDrafts, setPrepDrafts] = useState<Record<string, InterviewPrep>>({});
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
  const rewrite = useMemo(() => rewriteProjectForJd(activeProject, activeJob), [activeProject, activeJob]);
  const generatedPrep = useMemo(() => generateInterviewPrep(profile, activeJob), [profile, activeJob]);
  const prep = prepDrafts[activeJob.id] ?? generatedPrep;

  const averageMatch = Math.round(jobs.reduce((sum, job) => sum + matchResumeToJd(profile, job).total, 0) / jobs.length);
  const missingCount = match.missingKeywords.length;
  const relatedVersions = versions.filter((version) => version.jdId === activeJob.id);
  const prepCount =
    prep.technicalQuestions.length + prep.projectQuestions.length + prep.behaviorQuestions.length + prep.englishQuestions.length;

  function analyzeDraftJob() {
    const analyzed = analyzeJobDescription(draftJob);
    setJobs((current) => [analyzed, ...current]);
    setActiveJobId(analyzed.id);
    setActiveTab("jd");
  }

  function applyRewrite() {
    setProfile((current) => {
      const next = cloneProfile(current);
      next.projects = next.projects.map((project) =>
        project.id === activeProject.id
          ? {
              ...project,
              resumeBullets: rewrite.bullets,
            }
          : project,
      );
      return next;
    });
  }

  function createVersionFromRewrite() {
    const version = createTailoredResumeVersion({
      profile,
      jd: activeJob,
      project: activeProject,
      bullets: rewrite.bullets,
    });
    setVersions((current) => [version, ...current]);
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
            <Pill tone="green">本地 MVP</Pill>
            <Pill>真实 AI / 数据库在后续阶段接入</Pill>
            <a
              className="inline-flex h-9 items-center rounded-md border border-line bg-white px-3 text-xs font-semibold text-ink transition hover:border-accent"
              href="/resume/print"
              target="_blank"
            >
              打印简历
            </a>
          </div>
        </div>
      </header>

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
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-white transition hover:bg-accent/90"
                  onClick={analyzeDraftJob}
                >
                  <Sparkles size={16} />
                  分析 JD
                </button>
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
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-white transition hover:bg-accent/90"
                    onClick={applyRewrite}
                  >
                    <PenLine size={16} />
                    应用建议
                  </button>
                  <button
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-3 text-sm font-semibold text-white transition hover:bg-ink/90"
                    onClick={createVersionFromRewrite}
                  >
                    <Sparkles size={16} />
                    生成定制版
                  </button>
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
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
                  <div className="rounded-lg border border-accent/25 bg-accent/5 p-4">
                    <p className="text-xs font-semibold text-accent">建议改写</p>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-ink">
                      {rewrite.bullets.map((item) => (
                        <li className="flex gap-2" key={item}>
                          <Sparkles className="mt-1 shrink-0 text-accent" size={15} />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-xs font-semibold text-accent">为什么这样改</p>
                    <ul className="mt-2 space-y-1 text-sm leading-6 text-muted">
                      {rewrite.reasoning.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
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

          {activeTab === "profile" && (
            <div className="space-y-5">
              <Panel>
                <SectionHeader title="个人经历库" detail="这是 AI 改写和面试准备的事实来源。" />
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Input
                    label="姓名"
                    value={profile.name}
                    onChange={(value) => setProfile((current) => ({ ...current, name: value }))}
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
                <SectionHeader title="技能关键词" detail="后续真实 AI 会基于这些事实做重组，不应凭空增加经历。" />
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Pill tone={activeJob.keywords.includes(skill) ? "green" : "neutral"} key={skill}>
                      {skill}
                    </Pill>
                  ))}
                </div>
              </Panel>
              <Panel>
                <SectionHeader title="项目库" />
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {profile.projects.map((project) => (
                    <div className="rounded-lg border border-line p-4" key={project.id}>
                      <h3 className="text-sm font-bold text-ink">{project.name}</h3>
                      <p className="mt-1 text-xs text-muted">{project.role} · {project.techStack.join(" / ")}</p>
                      <p className="mt-3 text-sm leading-6 text-muted">{project.rawDescription}</p>
                    </div>
                  ))}
                </div>
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
