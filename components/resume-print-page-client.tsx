"use client";

import { Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { seedProfile } from "@/lib/domain/seed-data";
import type { UserProfile } from "@/lib/domain/types";
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

export function ResumePrintPageClient() {
  const [snapshot, setSnapshot] = useState<PrintSnapshot>(fallbackSnapshot);

  useEffect(() => {
    setSnapshot(loadPrintSnapshot());
  }, []);

  return (
    <main className="min-h-screen bg-canvas py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-5 flex w-[210mm] items-center justify-between rounded-lg border border-line bg-white p-4 print:hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-0 text-accent">OfferPilot</p>
          <h1 className="text-lg font-bold text-ink">ATS 友好简历打印预览</h1>
          <p className="mt-1 text-sm text-muted">
            {snapshot.sourceLabel}
            {snapshot.targetCompany ? ` · ${snapshot.targetCompany} ${snapshot.targetRole ?? ""}` : ""}
            {typeof snapshot.matchScore === "number" ? ` · 匹配 ${snapshot.matchScore}` : ""}
          </p>
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-white" onClick={() => window.print()}>
          <Printer size={16} />
          打印 / 保存 PDF
        </button>
      </div>
      <ResumePrintView
        matchScore={snapshot.matchScore}
        profile={snapshot.profile}
        sourceLabel={snapshot.sourceLabel}
        targetCompany={snapshot.targetCompany}
        targetRole={snapshot.targetRole}
      />
    </main>
  );
}
