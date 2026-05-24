import { matchResumeToJd } from "@/lib/ai/match-resume";
import type { JobDescription, Project, ResumeVersion, UserProfile } from "@/lib/domain/types";

function cloneProfile(profile: UserProfile): UserProfile {
  return JSON.parse(JSON.stringify(profile)) as UserProfile;
}

export function createTailoredResumeVersion({
  profile,
  jd,
  project,
  bullets,
}: {
  profile: UserProfile;
  jd: JobDescription;
  project: Project;
  bullets: string[];
}): ResumeVersion {
  const content = cloneProfile(profile);
  content.targetRole = jd.role;
  content.summary = `${profile.name}，目标岗位 ${jd.role}。具备 ${jd.requiredSkills
    .slice(0, 4)
    .join("、")} 相关实践，重点项目覆盖 ${jd.emphasis.slice(0, 3).join("、")}，可围绕 ${jd.company} 岗位要求展开项目讲解。`;
  content.projects = content.projects.map((item) =>
    item.id === project.id
      ? {
          ...item,
          resumeBullets: bullets,
        }
      : item,
  );

  return {
    id: `version-${Date.now()}`,
    name: `${jd.role} - ${jd.company} 定制版`,
    targetCompany: jd.company,
    targetRole: jd.role,
    jdId: jd.id,
    content,
    matchScore: matchResumeToJd(content, jd),
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}
