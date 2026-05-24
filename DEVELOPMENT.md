# AI Job Assistant Development Document

## 1. Product Direction

The project should evolve from a resume generator into an AI-powered job search workspace.

Working name:

```text
OfferPilot / JobForge / HireMate / AI 求职工作台
```

Core positioning:

```text
个人经历库 -> JD 分析 -> 简历匹配 -> AI 修改简历 -> 面试准备
```

This product is not only for exporting resumes. It helps a candidate analyze job descriptions, improve resume content, and prepare for interviews with job-specific material.

Core value:

```text
For every target job, generate a better matched resume version and prepare focused interview material.
```

## 2. Target Users

Primary users:

- Developers preparing for frontend, backend, full-stack, or AI application roles.
- New graduates who need to turn projects and internships into stronger resume content.
- Career switchers who need to map existing experience to a new job direction.
- High-volume applicants who need to manage many job descriptions, resume versions, and follow-ups.

The product should be useful to the builder's own job search first, then work as a portfolio project.

## 3. MVP Scope

The first version should focus on five core features:

```text
1. Personal profile / experience library
2. Paste and analyze job descriptions
3. Extract JD keywords and requirements
4. Match resume/profile against the JD
5. Generate tailored project and resume bullet suggestions
```

### Included In MVP

- Dashboard with job search metrics.
- Personal profile editor.
- Project experience library.
- JD analysis page.
- Resume/profile match score.
- AI-style project bullet rewriting.
- Interview preparation question generator.
- Local demo data and in-browser state for the first implementation.

### Excluded From First MVP

- Real authentication.
- PostgreSQL persistence.
- Paid AI provider calls.
- PDF export.
- GitHub repository analyzer.
- Application Kanban board.
- Job application status tracking.
- AI mock interview voice/chat.
- Email automation.
- Team collaboration.

These should be added after the first workflow is stable.

## 4. Product Modules

### 4.1 Dashboard

Purpose:

- Show the user's job search pipeline at a glance.

Required content:

- Average resume match score.
- Recently analyzed JDs.
- High-priority next actions.
- Resume improvement tasks.

Example metrics:

```text
已分析 JD: 12
待优化项目描述: 4
平均匹配度: 76
本周新增 JD: 7
待准备面试题: 3
```

### 4.2 Personal Profile / Experience Library

Purpose:

- Store the user's reusable source material.
- AI suggestions must be based on this source material and should not invent experience.

Core fields:

- Target role.
- Summary.
- Skills.
- Education.
- Work experience.
- Projects.
- Certificates / awards.
- Links.

Project fields:

```ts
type Project = {
  id: string;
  name: string;
  role: string;
  techStack: string[];
  features: string[];
  rawDescription: string;
  resumeBullets: string[];
  interviewTalkingPoints: string[];
};
```

### 4.3 JD Analysis

Purpose:

- Turn a pasted job description into structured requirements.

Inputs:

- Company name.
- Role name.
- Raw JD text.

Outputs:

- Role title.
- Seniority.
- Required skills.
- Nice-to-have skills.
- Responsibilities.
- Keywords.
- What the resume should emphasize.

Example output:

```text
核心关键词:
- React
- TypeScript
- Next.js
- REST API
- Testing
- CI/CD

岗位更看重:
- 组件化开发
- 性能优化
- 前后端协作
- 工程化能力
```

### 4.4 Resume/Profile Match Score

Purpose:

- Compare the user's profile or resume version with a JD.

Score dimensions:

```text
总匹配度: 100
技能匹配: 25
项目相关度: 25
关键词覆盖: 20
表达质量: 15
ATS 友好性: 15
```

The product can say:

```text
ATS 友好性检查
简历可解析性检查
```

The product must not say:

```text
保证通过 ATS
```

Example suggestions:

```text
建议 1:
项目经历中补充 Next.js、API 联调和性能优化相关描述。

建议 2:
技能列表中增加 Testing、CI/CD、REST API。

建议 3:
当前项目描述偏功能罗列，建议改成“技术 + 行动 + 结果”的形式。
```

### 4.5 AI Resume Customization

Purpose:

- Generate job-specific resume/project bullets from existing user material.

Rules:

- Do not fabricate companies, dates, metrics, or experience.
- Reorganize and rewrite only from existing source material.
- Prefer the STAR / XYZ structure.
- If a metric is missing, suggest where the user can add a real number.

Example rewrite:

Original:

```text
做了一个个人博客系统，有登录、文章管理、评论功能。
```

Frontend-targeted:

```text
基于 Next.js 和 TypeScript 开发个人博客 CMS，负责文章管理、用户认证、评论交互和响应式页面实现，完成从内容编辑到前台展示的完整业务流程。
```

Full-stack-targeted:

```text
独立设计并实现个人博客 CMS 系统，使用 PostgreSQL 管理用户、文章、评论等核心数据，完成认证、权限控制、内容发布和后台管理等全栈功能。
```

### 4.6 Interview Preparation

Purpose:

- Generate interview preparation material from the selected JD and profile.

Output groups:

- Technical questions.
- Project deep-dive questions.
- Behavioral questions.
- English interview questions.
- Self-introduction draft.
- Questions to ask the interviewer.

Example questions:

```text
1. 你在项目中如何做权限控制？
2. Next.js 服务端渲染和客户端渲染有什么区别？
3. 你如何优化接口响应速度？
4. PostgreSQL 表结构怎么设计？
5. 如果 AI 返回错误答案，你怎么处理？
```

## 5. MVP Page Plan

### 5.1 Dashboard

First screen should be the actual product workspace, not a marketing landing page.

Layout:

```text
Top metrics
Recently analyzed JDs
Next actions
High-match jobs
Low-match jobs needing resume work
```

### 5.2 JD Analysis Page

Layout:

```text
Left: JD input
Right: analysis result
Bottom: match suggestions and create tailored resume action
```

Required interactions:

- Paste JD.
- Analyze JD.
- Show keywords and requirements.
- Generate tailored resume suggestions.

### 5.3 Resume Optimization Page

Layout:

```text
Left: current profile/project content
Right: AI rewrite suggestions
```

Required interactions:

- Select target JD.
- Select project or experience.
- Generate rewritten bullets.
- Compare original and rewritten text.
- Apply suggestion to a resume version.

### 5.4 Interview Prep Page

Layout:

```text
Target JD selector
Question groups
Answer draft area
Feedback/suggestions
```

Required interactions:

- Generate questions for selected JD/profile pair.
- Save answer notes.
- Mark questions as practiced.

## 6. Data Model

### 6.1 TypeScript Domain Types

```ts
type UserProfile = {
  id: string;
  targetRole: string;
  summary: string;
  skills: string[];
  education: EducationItem[];
  projects: Project[];
  experience: WorkExperience[];
  links: Array<{ label: string; url: string }>;
};

type JobDescription = {
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

type MatchScore = {
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

type ResumeVersion = {
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

type InterviewPrep = {
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
```

### 6.2 Future Database Draft

```sql
users
- id
- email
- name
- created_at

profiles
- id
- user_id
- target_role
- summary
- skills_json
- education_json
- projects_json
- experience_json
- links_json
- created_at
- updated_at

resumes
- id
- user_id
- title
- base_profile_id
- content_json
- created_at
- updated_at

resume_versions
- id
- resume_id
- name
- target_company
- target_role
- jd_id
- content_json
- match_score_json
- created_at
- updated_at

job_descriptions
- id
- user_id
- company
- role
- raw_text
- extracted_keywords_json
- required_skills_json
- nice_to_have_json
- responsibilities_json
- emphasis_json
- created_at

interview_preps
- id
- user_id
- jd_id
- questions_json
- answers_json
- feedback_json
- created_at
- updated_at
```

Important boundaries:

- `profiles` is the reusable source-of-truth experience library.
- `job_descriptions` stores target job requirements.
- `resume_versions` stores job-specific resume snapshots.
- AI suggestions should be traceable to a JD and a source profile/resume version.

## 7. AI API Design

The first implementation can use deterministic local logic. Later it should move behind API routes.

### 7.1 Analyze JD

```http
POST /api/ai/analyze-jd
```

Input:

```json
{
  "jdText": "岗位描述原文..."
}
```

Output:

```json
{
  "role": "Frontend Developer",
  "requiredSkills": ["React", "TypeScript", "REST API"],
  "niceToHave": ["Testing", "CI/CD"],
  "responsibilities": ["Build UI components", "Work with backend APIs"],
  "keywords": ["React", "TypeScript", "Performance", "Testing"],
  "emphasis": ["组件化开发", "性能优化", "前后端协作"]
}
```

### 7.2 Match Resume/Profile

```http
POST /api/ai/match-resume
```

Input:

```json
{
  "profile": {},
  "jd": {}
}
```

Output:

```json
{
  "score": 78,
  "matchedKeywords": ["React", "TypeScript"],
  "missingKeywords": ["Testing", "CI/CD"],
  "suggestions": [
    "项目经历中可以补充自动化测试相关内容",
    "技能列表中可以加入 REST API 和接口联调经验"
  ]
}
```

### 7.3 Rewrite Project

```http
POST /api/ai/rewrite-project
```

Input:

```json
{
  "project": {
    "name": "个人博客 CMS",
    "techStack": ["Next.js", "PostgreSQL", "Tailwind"],
    "features": ["登录", "文章管理", "评论"]
  },
  "targetRole": "Frontend Developer",
  "jdKeywords": ["React", "TypeScript", "Performance"]
}
```

Output:

```json
{
  "bullets": [
    "基于 Next.js 和 TypeScript 开发个人博客 CMS，实现文章管理、用户认证和评论交互等核心功能。",
    "使用 Tailwind CSS 构建响应式页面，优化移动端与桌面端的阅读体验。",
    "设计前后台页面结构，完成从内容编辑到前台展示的完整业务流程。"
  ],
  "reasoning": [
    "突出目标岗位关键词",
    "把功能描述改为技术行动",
    "保留原始项目事实"
  ]
}
```

### 7.4 Generate Interview Questions

```http
POST /api/ai/generate-interview-questions
```

Input:

```json
{
  "profile": {},
  "jd": {},
  "jdId": "jd_123"
}
```

Output:

```json
{
  "technicalQuestions": [
    "你在项目中如何设计权限系统？",
    "Next.js 的 SSR 和 CSR 有什么区别？"
  ],
  "projectQuestions": [
    "你的博客 CMS 数据库表是怎么设计的？",
    "如果文章很多，搜索和分页怎么优化？"
  ],
  "behaviorQuestions": [
    "讲一个你解决技术难题的例子。",
    "你如何学习一个新的技术栈？"
  ],
  "questionsToAsk": [
    "团队当前前端工程化面临的主要挑战是什么？",
    "这个岗位入职前三个月最重要的交付目标是什么？"
  ]
}
```

## 8. Technical Stack

Recommended production stack:

```text
Frontend: Next.js + TypeScript + Tailwind CSS
Backend: Next.js API Routes / Server Actions
Database: PostgreSQL
ORM: Prisma
Auth: Auth.js or Clerk
AI: OpenAI API / Gemini API / Claude API through provider abstraction
PDF export: Playwright or Puppeteer
Deployment: Vercel + Supabase / Railway
```

Local MVP stack:

```text
Next.js + TypeScript + Tailwind CSS
Local seed data
Rule-based analysis functions
In-browser state
```

Reason:

- It can be developed quickly.
- It is still close to the production architecture.
- It avoids blocking the first product demo on auth, database, or paid AI keys.

## 9. Productization Modules

These modules are not required for the first local MVP, but they must be designed into the product roadmap because they turn the demo into a real multi-user application.

### 9.1 Database Login And Multi-User Accounts

Goal:

- Let different users maintain separate profiles, JDs, resume versions, and interview prep records.

Recommended implementation:

```text
Auth: Auth.js or Clerk
Providers: email login first, then GitHub and Google OAuth
Session strategy: database-backed session or secure JWT session
Data boundary: every query must be scoped by user_id
```

Required auth flows:

- Register.
- Login.
- Logout.
- OAuth callback.
- Protected dashboard routes.
- Redirect anonymous users to login.

Security requirements:

- Never expose AI API keys to the browser.
- Never allow one user to access another user's profile, JD, resume version, or interview prep data.
- Validate ownership in every API route or server action.
- Keep OAuth secrets and database URL in environment variables.

### 9.2 Multi-User Data Persistence

Goal:

- Replace local seed data and in-browser state with durable database storage.

Recommended stack:

```text
Database: PostgreSQL
ORM: Prisma
Hosting: Supabase / Railway / Neon
```

Data to persist:

- User profile / experience library.
- Job descriptions and extracted analysis.
- Resume versions.
- Match scores.
- Rewrite suggestions.
- Interview prep questions and answer notes.

Persistence rules:

- `profiles` is the user's reusable source material.
- `job_descriptions` stores raw JD text and structured extraction result.
- `resume_versions` stores snapshots generated for a target JD.
- `interview_preps` stores questions and user answer drafts.
- Use JSON columns for flexible resume/profile content where rigid normalization would slow iteration.

### 9.3 Real AI API Integration

Goal:

- Replace deterministic local logic with real model-backed JD analysis, resume matching, rewrite suggestions, and interview prep generation.

Provider design:

```text
lib/ai/provider.ts         model/provider abstraction
lib/ai/prompts/            prompt builders
app/api/ai/analyze-jd      JD extraction route
app/api/ai/match-resume    match scoring route
app/api/ai/rewrite-project project rewrite route
app/api/ai/interview-prep  interview prep route
```

Supported providers:

- OpenAI-compatible API.
- Gemini API.
- Claude API.

AI safety rules:

- Do not fabricate experience, companies, dates, degrees, or metrics.
- Rewrite only from user-provided profile/project facts.
- If a metric is missing, suggest a placeholder question instead of inventing a number.
- Return structured JSON that can be validated before saving.
- Store original text, suggested text, reason, target JD, and model metadata for traceability.

Environment variables:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
```

### 9.4 PDF Resume Export

Goal:

- Export a selected resume version into an ATS-friendly PDF.

Recommended implementation:

```text
Render route: /resume/:versionId/print
Export engine: Playwright or Puppeteer
Output: PDF file stream or saved export record
```

Export requirements:

- The PDF must use selectable text, not screenshot-only rendering.
- Keep section headings clear.
- Avoid complex tables, image text, and excessive icons.
- Support browser print for local MVP and server-side Playwright/Puppeteer for production.
- Future option: Word export for recruiters that request `.docx`.

API draft:

```http
POST /api/resume-versions/:id/export-pdf
```

Output:

```json
{
  "fileName": "frontend-developer-acme-resume.pdf",
  "url": "/exports/frontend-developer-acme-resume.pdf"
}
```

### 9.5 GitHub Project Analyzer

Goal:

- Help developers convert GitHub repositories into resume-ready project highlights and interview preparation material.

Input:

```text
GitHub repository URL
```

Analysis output:

- Tech stack.
- Main features.
- Architecture summary.
- Code structure summary.
- README quality feedback.
- Resume-ready project highlights.
- Technical challenges.
- Possible interview questions.

Implementation options:

```text
Option A: GitHub public API for repo metadata and README
Option B: Clone repository server-side for deeper code analysis
Option C: User uploads a repository zip for private projects
```

MVP-friendly first version:

- Accept GitHub URL.
- Fetch README and repository metadata.
- Infer tech stack from package files and language stats.
- Generate resume bullets and interview questions.

Security constraints:

- Do not execute repository code.
- Limit file size and number of files analyzed.
- Avoid storing private repository contents unless the user explicitly imports them.
- Keep GitHub tokens server-side.

API draft:

```http
POST /api/github/analyze-repo
```

Input:

```json
{
  "repoUrl": "https://github.com/user/project"
}
```

Output:

```json
{
  "techStack": ["Next.js", "TypeScript", "Prisma"],
  "summary": "A full-stack AI job assistant workspace...",
  "resumeBullets": [],
  "interviewQuestions": []
}
```

## 10. Frontend Architecture

Recommended structure:

```text
app/
  page.tsx
  layout.tsx
components/
  dashboard/
  profile/
  jd-analysis/
  resume-optimizer/
  interview-prep/
  ui/
lib/
  domain/
    types.ts
    seed-data.ts
  ai/
    analyze-jd.ts
    match-resume.ts
    rewrite-project.ts
    interview-questions.ts
```

For MVP, a single-page workspace with tabbed modules is acceptable if the modules are clearly separated.

## 11. UI Direction

The product should feel like a serious productivity workspace:

- Dashboard-first, not landing-page-first.
- Dense but readable information layout.
- Clear job pipeline status.
- Side-by-side JD input and analysis.
- Side-by-side original text and AI rewrite.
- Score cards for match and ATS-friendly checks.
- Restrained color palette with status colors.
- No claim that AI guarantees interviews, offers, or ATS success.

Key visual areas:

```text
Top navigation:
Dashboard / JD Analysis / Resume Optimizer / Interview Prep / Profile

Right rail:
Selected job context, match score, next action

Main area:
Task-specific workspace
```

## 12. Scoring Rules For MVP

Use a local rule engine before real AI integration.

### JD Keyword Extraction

- Match known technical keywords.
- Extract repeated terms from JD text.
- Group keywords into required skills, nice-to-have skills, and soft skills when possible.

### Match Score

Initial formula:

```text
skills = matched required skills / required skills * 25
projectRelevance = matched project keywords / JD keywords * 25
keywordCoverage = all matched keywords / all JD keywords * 20
expressionQuality = profile has action/result bullets * 15
atsFriendliness = contact + sections + clear text * 15
total = sum
```

### ATS-Friendly Check

Rules:

- Has email.
- Has phone.
- Has target role.
- Has skills.
- Has project/work bullet points.
- Uses clear section names.
- Avoids image-only content.
- Avoids complex visual formatting.
- Has enough JD keyword coverage.

## 13. Development Milestones

### Milestone 1: Development Document

Deliverables:

- This document.
- Product direction adjusted from resume generator to AI job assistant.
- MVP scope fixed.

### Milestone 2: Local Product Shell

Deliverables:

- Next.js app.
- Dashboard-first workspace.
- Navigation for all MVP modules.
- Seed profile, JD, resume versions, and interview prep data.

### Milestone 3: JD Analysis And Matching

Deliverables:

- JD input.
- Local JD parser.
- Keyword extraction.
- Match scoring.
- Suggestions.

### Milestone 4: Resume Optimizer

Deliverables:

- Project selector.
- Original project content.
- AI-style rewritten bullets.
- Apply suggestion to resume version.
- Create tailored version.

### Milestone 5: Interview Prep

Deliverables:

- Generate questions from selected job/profile.
- Group by technical, project, behavior, English, and interviewer questions.
- Save draft answers locally.

### Milestone 6: Database Login And Multi-User Persistence

Deliverables:

- PostgreSQL + Prisma.
- Auth.js or Clerk.
- Email login.
- GitHub and Google OAuth.
- Protected routes.
- User-scoped profile, JD, resume version, and interview prep records.

### Milestone 7: Real AI APIs

Deliverables:

- AI provider abstraction.
- JD analysis API.
- Resume matching API.
- Project rewrite API.
- Interview prep API.
- Prompt and response validation.
- Stored AI suggestions with source traceability.

### Milestone 8: PDF Resume Export

Deliverables:

- Print-friendly resume version route.
- Browser print flow.
- Server-side Playwright/Puppeteer PDF export.
- Exported PDF uses selectable text.

### Milestone 9: GitHub Project Analyzer

Deliverables:

- GitHub URL input.
- Repository metadata and README analysis.
- Tech stack detection.
- Resume-ready project highlights.
- Interview questions generated from repository context.

### Milestone 10: Production Polish

Deliverables:

- API routes.
- Error handling.
- Loading states.
- Empty states.
- Deployment configuration.
- README setup guide.

## 14. Definition Of Done For MVP

The MVP is done when:

- The first screen is an AI job search dashboard.
- The user can maintain a basic personal profile and project library.
- The user can paste a JD and see structured analysis.
- The system generates a resume/profile match score.
- The system identifies missing keywords and resume improvement suggestions.
- The system can generate tailored project bullets based on existing project facts.
- The system generates interview preparation questions for a selected JD/profile pair.
- The app runs locally without external services.

## 15. Post-MVP Roadmap

### Phase 2: Database And Auth

- Auth.js or Clerk.
- Email login.
- GitHub login.
- Google login.
- PostgreSQL.
- Prisma schema.
- User-scoped data.
- Multi-user saved profiles, JDs, resume versions, and interview prep records.

### Phase 3: Real AI APIs

- AI provider abstraction.
- JD analysis API.
- Resume matching API.
- Project rewrite API.
- Interview question API.
- Prompt safety rules to prevent fabricated experience.
- Structured JSON validation before saving AI output.

### Phase 4: PDF And Resume Export

- Resume version editor.
- Browser print flow.
- PDF export with Playwright/Puppeteer.
- Selectable text PDF output.
- Word export later.

### Phase 5: GitHub Project Analyzer

Input:

```text
GitHub repository URL
```

Output:

- Tech stack.
- Main features.
- Code structure summary.
- README quality feedback.
- Resume-ready project highlights.
- Possible interview questions.
- Optional import into project experience library.

### Phase 6: AI Mock Interview

- AI interviewer.
- Follow-up questions.
- Answer scoring.
- Improvement suggestions.
- Interview review notes.

### Phase 7: Application Tracking

- Application Kanban board.
- Job status tracking.
- Follow-up reminders.
- Interview dates and contacts.
- Link each application to a JD and resume version.

## 16. Immediate Next Development Sequence

After this document is accepted, implement in this order:

1. Rename product copy from ResumeForge to AI Job Assistant / OfferPilot.
2. Replace resume-generator workspace with dashboard-first job assistant shell.
3. Add domain types for profile, JD, resume versions, match score, and interview prep.
4. Add local seed data.
5. Implement dashboard metrics.
6. Implement JD parser and match scoring.
7. Implement resume/project rewrite suggestions.
8. Implement interview prep generator.

Do not start with database, auth, or real AI provider calls. Build the useful local workflow first.
