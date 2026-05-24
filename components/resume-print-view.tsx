import type { UserProfile } from "@/lib/domain/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="border-b border-ink pb-1 text-[12px] font-bold uppercase text-ink">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
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

export function ResumePrintView({ profile }: { profile: UserProfile }) {
  return (
    <article className="mx-auto min-h-[297mm] w-[210mm] bg-white px-12 py-10 text-ink print:mx-0 print:w-auto print:min-h-0 print:p-0">
      <header className="border-b border-line pb-4">
        <div className="flex items-start justify-between gap-8">
          <div>
            <h1 className="text-3xl font-bold leading-tight">{profile.name}</h1>
            <p className="mt-1 text-sm font-semibold text-accent">{profile.targetRole}</p>
          </div>
          <div className="space-y-1 text-right text-[11px] leading-5 text-muted">
            <p>{profile.email}</p>
            <p>{profile.phone}</p>
            <p>{profile.location}</p>
            {profile.links.map((link) => (
              <p key={link.url}>
                {link.label}: {link.url}
              </p>
            ))}
          </div>
        </div>
      </header>

      <main className="mt-5 space-y-5">
        <Section title="Profile">
          <p className="text-[11px] leading-[1.65] text-ink">{profile.summary}</p>
        </Section>

        <Section title="Skills">
          <p className="text-[11px] leading-[1.65] text-ink">{profile.skills.join(" · ")}</p>
        </Section>

        <Section title="Experience">
          <div className="space-y-4">
            {profile.experience.map((experience) => (
              <div key={experience.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-[12px] font-bold">
                    {experience.company} · {experience.role}
                  </h3>
                  <p className="text-[10px] text-muted">
                    {experience.startDate} - {experience.endDate ?? "至今"}
                  </p>
                </div>
                <div className="mt-1.5">
                  <BulletList items={experience.highlights} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Projects">
          <div className="space-y-4">
            {profile.projects.map((project) => (
              <div key={project.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-[12px] font-bold">{project.name}</h3>
                  <p className="text-[10px] text-muted">{project.role}</p>
                </div>
                <p className="mt-0.5 text-[10px] font-semibold text-muted">{project.techStack.join(" / ")}</p>
                <p className="mt-1 text-[11px] leading-[1.55] text-ink">{project.rawDescription}</p>
                <div className="mt-1.5">
                  <BulletList items={project.resumeBullets} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Education">
          {profile.education.map((education) => (
            <div key={education.id}>
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-[12px] font-bold">{education.school}</h3>
                <p className="text-[10px] text-muted">
                  {education.startDate} - {education.endDate ?? "至今"}
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
        </Section>
      </main>
    </article>
  );
}
