import { Printer } from "lucide-react";
import { ResumePrintView } from "@/components/resume-print-view";
import { seedProfile } from "@/lib/domain/seed-data";

export default function ResumePrintPage() {
  return (
    <main className="min-h-screen bg-canvas py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-5 flex w-[210mm] items-center justify-between rounded-lg border border-line bg-white p-4 print:hidden">
        <div>
          <p className="text-xs font-bold uppercase tracking-0 text-accent">OfferPilot</p>
          <h1 className="text-lg font-bold text-ink">ATS 友好简历打印预览</h1>
          <p className="mt-1 text-sm text-muted">使用浏览器打印或另存为 PDF，输出为可复制文本。</p>
        </div>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-3 text-sm font-semibold text-white"
        >
          <Printer size={16} />
          Ctrl/Cmd + P
        </button>
      </div>
      <ResumePrintView profile={seedProfile} />
    </main>
  );
}
