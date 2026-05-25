"use client";

import { Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { seedProfile } from "@/lib/domain/seed-data";
import type { UserProfile } from "@/lib/domain/types";
import { ResumePrintView } from "@/components/resume-print-view";

function loadPrintProfile() {
  try {
    const raw = window.localStorage.getItem("offerpilot.printProfile");
    if (!raw) {
      return seedProfile;
    }
    return {
      ...seedProfile,
      ...(JSON.parse(raw) as Partial<UserProfile>),
    };
  } catch {
    return seedProfile;
  }
}

export function ResumePrintPageClient() {
  const [profile, setProfile] = useState<UserProfile>(seedProfile);

  useEffect(() => {
    setProfile(loadPrintProfile());
  }, []);

  return (
    <main className="min-h-screen bg-canvas py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-5 flex w-[210mm] items-center justify-between rounded-lg border border-line bg-white p-4 print:hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-0 text-accent">OfferPilot</p>
          <h1 className="text-lg font-bold text-ink">ATS 友好简历打印预览</h1>
          <p className="mt-1 text-sm text-muted">优先使用工作台当前经历库快照，输出为可复制文本。</p>
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-white" onClick={() => window.print()}>
          <Printer size={16} />
          打印 / 保存 PDF
        </button>
      </div>
      <ResumePrintView profile={profile} />
    </main>
  );
}
