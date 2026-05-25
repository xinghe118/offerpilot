import type { UserProfile } from "@/lib/domain/types";
import { defaultResumePrintOptions, resumeSectionLabels, type ResumePrintOptions } from "@/lib/resume/print-options";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="border-b border-ink pb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-ink">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <ul className="space-y-1 text-[11px] leading-[1.55] text-ink">
      {items.map((item) => (
        <li className="flex gap-2" key={item}>
          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function InlineList({ items }: { items: string[] }) {
  if (!items.length) {
    return null;
  }

  return <p className="text-[11px] leading-[1.65] text-ink">{items.join(" · ")}</p>;
}

export function ResumePrintView({
  profile,
  sourceLabel,
  targetCompany,
  targetRole,
  matchScore,
  options = defaultResumePrintOptions,
}: {
  profile: UserProfile;
  sourceLabel?: string;
  targetCompany?: string;
  targetRole?: string;
  matchScore?: number;
  options?: ResumePrintOptions;
}) {
  const primaryProjects = profile.projects.slice(0, 4);
  const labels = resumeSectionLabels[options.language];
  const articlePadding = options.compact ? "px-10 py-8 print:p-8" : "px-12 py-10 print:p-10";
  const mainSpacing = options.compact ? "mt-4 space-y-4" : "mt-5 space-y-5";
  const itemSpacing = options.compact ? "space-y-3" : "space-y-4";

  return (
    <article className={`print-area mx-auto min-h-[297mm] w-[210mm] bg-white ${articlePadding} text-ink shadow-panel print:mx-0 print:min-h-[297mm] print:w-[210mm] print:shadow-none`}>
      <header className={`border-b-2 border-ink ${options.compact ? "pb-3" : "pb-4"}`}>
        <div className="flex items-start justify-between gap-8">
          <div>
            <h1 className="text-3xl font-bold leading-tight">{profile.name}</h1>
            <p className="mt-1 text-sm font-semibold text-ink">{profile.targetRole}</p>
          </div>
          <div className="space-y-1 text-right text-[11px] leading-5 text-muted">
            {sourceLabel ? <p className="font-semibold text-ink">{sourceLabel}</p> : null}
            {targetCompany ? (
              <p>
                {targetCompany}
                {targetRole ? ` · ${targetRole}` : ""}
              </p>
            ) : null}
            {typeof matchScore === "number" ? <p>{labels.matchScore}: {matchScore}</p> : null}
            {[profile.email, profile.phone, profile.location].filter(Boolean).map((item) => (
              <p key={item}>{item}</p>
            ))}
            {profile.links.map((link) => (
              <p key={link.url}>
                {link.label}: {link.url}
              </p>
            ))}
          </div>
        </div>
      </header>

      <main className={mainSpacing}>
        <Section title={labels.summary}>
          <p className="text-[11px] leading-[1.65] text-ink">{profile.summary}</p>
        </Section>

        <Section title={labels.skills}>
          <InlineList items={profile.skills} />
        </Section>

        {profile.experience.length ? (
          <Section title={labels.experience}>
            <div className={itemSpacing}>
              {profile.experience.map((experience) => (
                <div key={experience.id}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-[12px] font-bold">
                      {experience.company} · {experience.role}
                    </h3>
                    <p className="shrink-0 text-[10px] text-muted">
                      {experience.startDate} - {experience.endDate ?? "Present"}
                    </p>
                  </div>
                  <div className="mt-1.5">
                    <BulletList items={experience.highlights} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        <Section title={labels.projects}>
          <div className={itemSpacing}>
            {primaryProjects.map((project) => (
              <div key={project.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-[12px] font-bold">{project.name}</h3>
                  <p className="shrink-0 text-[10px] text-muted">{project.role}</p>
                </div>
                <p className="mt-0.5 text-[10px] font-semibold text-muted">{project.techStack.join(" / ")}</p>
                {project.features.length ? (
                  <p className="mt-1 text-[10px] leading-[1.55] text-muted">{labels.features}: {project.features.join(" · ")}</p>
                ) : null}
                <p className="mt-1 text-[11px] leading-[1.55] text-ink">{project.rawDescription}</p>
                <div className="mt-1.5">
                  <BulletList items={project.resumeBullets} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {profile.education.length ? (
          <Section title={labels.education}>
            <div className={options.compact ? "space-y-2" : "space-y-3"}>
              {profile.education.map((education) => (
                <div key={education.id}>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-[12px] font-bold">{education.school}</h3>
                    <p className="shrink-0 text-[10px] text-muted">
                      {education.startDate} - {education.endDate ?? "Present"}
                    </p>
                  </div>
                  <p className="text-[11px] leading-5 text-muted">
                    {education.degree} · {education.major}
                  </p>
                  <div className="mt-1.5">
                    <BulletList items={education.highlights} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {options.showInterviewNotes && profile.projects.some((project) => project.interviewTalkingPoints.length) ? (
          <Section title={labels.interview}>
            <div className={options.compact ? "space-y-2" : "space-y-3"}>
              {primaryProjects
                .filter((project) => project.interviewTalkingPoints.length)
                .map((project) => (
                  <div key={project.id}>
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-[12px] font-bold">{project.name}</h3>
                    </div>
                    <div className="mt-1.5">
                      <BulletList items={project.interviewTalkingPoints} />
                    </div>
                  </div>
                ))}
            </div>
          </Section>
        ) : null}
      </main>
    </article>
  );
}
