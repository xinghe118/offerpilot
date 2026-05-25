"use client";

import { Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { seedProfile } from "@/lib/domain/seed-data";
import type { UserProfile } from "@/lib/domain/types";
import { defaultResumePrintOptions, type ResumePrintOptions } from "@/lib/resume/print-options";
import { ResumePrintView } from "@/components/resume-print-view";

type PrintSnapshot = {
  profile: UserProfile;
  sourceLabel: string;
  targetCompany?: string;
  targetRole?: string;
  matchScore?: number;
};

const fallbackSnapshot: PrintSnapshot = {
  profile: seedProfile,
  sourceLabel: "基础经历库",
};

function loadPrintSnapshot() {
  try {
    const raw = window.localStorage.getItem("offerpilot.printProfile");
    if (!raw) {
      return fallbackSnapshot;
    }
    const parsed = JSON.parse(raw) as Partial<PrintSnapshot> | Partial<UserProfile>;
    if ("profile" in parsed && parsed.profile) {
      return {
        ...fallbackSnapshot,
        ...parsed,
        profile: {
          ...seedProfile,
          ...parsed.profile,
        },
      };
    }

    return {
      ...fallbackSnapshot,
      profile: {
        ...seedProfile,
        ...(parsed as Partial<UserProfile>),
      },
    };
  } catch {
    return fallbackSnapshot;
  }
}

function loadPrintOptions() {
  try {
    const raw = window.localStorage.getItem("offerpilot.printOptions");
    if (!raw) {
      return defaultResumePrintOptions;
    }
    return {
      ...defaultResumePrintOptions,
      ...(JSON.parse(raw) as Partial<ResumePrintOptions>),
    };
  } catch {
    return defaultResumePrintOptions;
  }
}

export function ResumePrintPageClient() {
  const [snapshot, setSnapshot] = useState<PrintSnapshot>(fallbackSnapshot);
  const [options, setOptions] = useState<ResumePrintOptions>(defaultResumePrintOptions);

  useEffect(() => {
    setSnapshot(loadPrintSnapshot());
    setOptions(loadPrintOptions());
  }, []);

  function updateOptions(patch: Partial<ResumePrintOptions>) {
    setOptions((current) => {
      const next = {
        ...current,
        ...patch,
      };
      window.localStorage.setItem("offerpilot.printOptions", JSON.stringify(next));
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-canvas py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-5 w-[210mm] rounded-lg border border-line bg-white p-4 print:hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-0 text-accent">OfferPilot</p>
            <h1 className="text-lg font-bold text-ink">ATS 友好简历打印预览</h1>
            <p className="mt-1 text-sm text-muted">
              {snapshot.sourceLabel}
              {snapshot.targetCompany ? ` · ${snapshot.targetCompany} ${snapshot.targetRole ?? ""}` : ""}
              {typeof snapshot.matchScore === "number" ? ` · 匹配 ${snapshot.matchScore}` : ""}
            </p>
          </div>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-white"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            打印 / 保存 PDF
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4 text-sm text-muted">
          <label className="inline-flex items-center gap-2">
            <input
              checked={options.compact}
              onChange={(event) => updateOptions({ compact: event.target.checked })}
              type="checkbox"
            />
            紧凑模式
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              checked={options.showInterviewNotes}
              onChange={(event) => updateOptions({ showInterviewNotes: event.target.checked })}
              type="checkbox"
            />
            面试讲解点
          </label>
          <label className="inline-flex items-center gap-2">
            标题语言
            <select
              className="h-8 rounded-md border border-line bg-white px-2 text-sm text-ink outline-none"
              value={options.language}
              onChange={(event) => updateOptions({ language: event.target.value as ResumePrintOptions["language"] })}
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
          </label>
        </div>
      </div>
      <ResumePrintView
        matchScore={snapshot.matchScore}
        options={options}
        profile={snapshot.profile}
        sourceLabel={snapshot.sourceLabel}
        targetCompany={snapshot.targetCompany}
        targetRole={snapshot.targetRole}
      />
    </main>
  );
}
