"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function EmailLoginForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    await signIn("email", {
      email,
      name,
      callbackUrl: "/",
    });
    setIsSubmitting(false);
  }

  return (
    <form className="mt-6 grid gap-3" onSubmit={submit}>
      <label className="grid gap-2">
        <span className="text-xs font-semibold text-muted">邮箱</span>
        <input
          className="h-11 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />
      </label>
      <label className="grid gap-2">
        <span className="text-xs font-semibold text-muted">姓名</span>
        <input
          className="h-11 rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="用于本地开发测试"
        />
      </label>
      <button
        className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "登录中" : "邮箱登录"}
      </button>
    </form>
  );
}
