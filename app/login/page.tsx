import { Github, KeyRound } from "lucide-react";
import { hasOAuthProviderConfig, isAuthRequired } from "@/lib/auth/guards";

export default function LoginPage() {
  const authRequired = isAuthRequired();
  const hasProviders = hasOAuthProviderConfig();

  return (
    <main className="min-h-screen bg-canvas px-5 py-10">
      <section className="mx-auto max-w-md rounded-lg border border-line bg-white p-6 shadow-panel">
        <p className="text-xs font-bold uppercase tracking-0 text-accent">OfferPilot</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">登录到 AI 求职工作台</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          登录会在后续阶段用于保存个人经历库、JD、简历版本和面试准备记录。当前本地 MVP 默认可免登录访问。
        </p>

        <div className="mt-6 space-y-3">
          <a
            className={`flex h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition ${
              hasProviders
                ? "border-line bg-white text-ink hover:border-accent"
                : "pointer-events-none border-line bg-canvas text-muted"
            }`}
            href="/api/auth/signin/github"
          >
            <Github size={16} />
            使用 GitHub 登录
          </a>
          <a
            className={`flex h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition ${
              hasProviders
                ? "border-line bg-white text-ink hover:border-accent"
                : "pointer-events-none border-line bg-canvas text-muted"
            }`}
            href="/api/auth/signin/google"
          >
            <KeyRound size={16} />
            使用 Google 登录
          </a>
        </div>

        <div className="mt-6 rounded-md border border-line bg-canvas p-4 text-sm leading-6 text-muted">
          {authRequired
            ? "当前已启用 AUTH_REQUIRED。请先配置 DATABASE_URL、AUTH_SECRET 和至少一个 OAuth Provider。"
            : "当前 AUTH_REQUIRED=false，登录保护未启用，可以直接返回工作台继续使用本地 MVP。"}
        </div>

        <a
          className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent/90"
          href="/"
        >
          返回工作台
        </a>
      </section>
    </main>
  );
}
