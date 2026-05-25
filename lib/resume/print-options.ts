export type ResumePrintLanguage = "en" | "zh";

export type ResumePrintOptions = {
  compact: boolean;
  showInterviewNotes: boolean;
  language: ResumePrintLanguage;
};

export const defaultResumePrintOptions: ResumePrintOptions = {
  compact: false,
  showInterviewNotes: true,
  language: "en",
};

export const resumeSectionLabels: Record<ResumePrintLanguage, Record<string, string>> = {
  en: {
    summary: "Summary",
    skills: "Skills",
    experience: "Experience",
    projects: "Projects",
    education: "Education",
    interview: "Interview Talking Points",
    features: "Features",
    matchScore: "Match Score",
  },
  zh: {
    summary: "个人概要",
    skills: "技能",
    experience: "工作经历",
    projects: "项目经历",
    education: "教育经历",
    interview: "面试讲解点",
    features: "功能点",
    matchScore: "匹配分",
  },
};
