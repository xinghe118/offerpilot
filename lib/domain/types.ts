export type EducationItem = {
  id: string;
  school: string;
  degree: string;
  major: string;
  startDate: string;
  endDate?: string;
  highlights: string[];
};

export type WorkExperience = {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  highlights: string[];
};

export type Project = {
  id: string;
  name: string;
  role: string;
  techStack: string[];
  features: string[];
  rawDescription: string;
  resumeBullets: string[];
  interviewTalkingPoints: string[];
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  targetRole: string;
  summary: string;
  skills: string[];
  education: EducationItem[];
  projects: Project[];
  experience: WorkExperience[];
  links: Array<{ label: string; url: string }>;
};

export type JobDescription = {
  id: string;
  company: string;
  role: string;
  rawText: string;
  seniority?: string;
  requiredSkills: string[];
  niceToHave: string[];
  responsibilities: string[];
  keywords: string[];
  emphasis: string[];
  createdAt: string;
};

export type MatchScore = {
  total: number;
  skills: number;
  projectRelevance: number;
  keywordCoverage: number;
  expressionQuality: number;
  atsFriendliness: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
};

export type ResumeVersion = {
  id: string;
  name: string;
  targetCompany: string;
  targetRole: string;
  jdId?: string;
  content: UserProfile;
  matchScore: MatchScore;
  createdAt: string;
  updatedAt: string;
};

export type InterviewQuestion = {
  id: string;
  question: string;
  answerDraft: string;
  practiced: boolean;
};

export type InterviewPrep = {
  id: string;
  jdId: string;
  technicalQuestions: InterviewQuestion[];
  projectQuestions: InterviewQuestion[];
  behaviorQuestions: InterviewQuestion[];
  englishQuestions: InterviewQuestion[];
  selfIntroduction: string;
  questionsToAsk: string[];
  createdAt: string;
};
