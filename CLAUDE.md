# CLAUDE.md - TeamInsight Codebase Guide

This document provides AI assistants with comprehensive context for understanding and working with the TeamInsight codebase.

## Project Overview

**TeamInsight** is a full-stack web application for educational team reflection, feedback, and communication. It enables:
- Project teams to conduct AI-guided reflections
- Lecturers to monitor team health and communicate with teams
- Structured weekly reflection workflows with Gemini AI assistance

**Language Note:** The UI and AI responses are in Hebrew, while code and documentation are in English.

## Quick Reference

```bash
# Development
cd teaminsight
npm install
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint

# Required environment variables
MONGODB_URI=mongodb+srv://...    # MongoDB Atlas connection string
GEMINI_API_KEY=AIza...           # Google Gemini API key
TEAM_SESSION_SECRET=<secret>     # JWT signing secret for team sessions
NODE_ENV=development|production
```

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 16.1.1, React 19.2.3, TypeScript 5, Tailwind CSS 4 |
| Backend | Next.js App Router API routes, Mongoose 9.0.2 |
| Database | MongoDB Atlas (remote) |
| AI | Google Gemini 2.5-Flash (@google/generative-ai) |
| Auth | bcryptjs (lecturer), custom JWT tokens (team) |
| UI Libraries | Lucide-react (icons), Recharts, Chart.js, react-markdown |
| Email | nodemailer |

## Directory Structure

```
WebTeam4/
├── teaminsight/                    # Main application directory
│   ├── app/
│   │   ├── layout.tsx              # Root layout with fonts & globals
│   │   ├── globals.css             # Tailwind imports & theme colors
│   │   │
│   │   ├── api/                    # Backend API routes
│   │   │   ├── lecturer/
│   │   │   │   ├── login/route.js
│   │   │   │   └── register/route.js
│   │   │   ├── team/               # Team-facing endpoints (cookie auth)
│   │   │   │   ├── join/route.js
│   │   │   │   ├── me/route.js
│   │   │   │   ├── messages/
│   │   │   │   └── reflection/     # AI reflection endpoints
│   │   │   │       ├── start/route.ts
│   │   │   │       ├── turn/route.ts
│   │   │   │       ├── finish/route.ts
│   │   │   │       ├── confirm/route.ts
│   │   │   │       └── reset/route.ts
│   │   │   ├── teams/              # Lecturer admin endpoints
│   │   │   │   └── [teamId]/
│   │   │   ├── alerts/route.js
│   │   │   └── announcements/route.js
│   │   │
│   │   ├── lecturer/               # Lecturer UI pages
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── teams/
│   │   │   ├── announcements/page.tsx
│   │   │   ├── alerts/page.tsx
│   │   │   └── analytics/page.tsx
│   │   │
│   │   └── team/                   # Team UI pages
│   │       ├── _components/
│   │       │   ├── TeamGate.tsx    # Auth guard
│   │       │   └── TeamTabs.tsx    # Navigation
│   │       ├── (public)/
│   │       │   └── join/page.tsx
│   │       └── (protected)/
│   │           ├── info/page.tsx
│   │           ├── messages/page.tsx
│   │           └── reflection/page.tsx
│   │
│   ├── models/                     # Mongoose schemas
│   │   ├── Team.js
│   │   ├── Lecturer.js
│   │   ├── ReflectionChatSession.ts
│   │   ├── ReflectionSubmission.ts
│   │   ├── ConversationThread.js
│   │   ├── ConversationMessage.js
│   │   ├── Alert.js
│   │   └── Announcement.js
│   │
│   ├── lib/                        # Shared utilities
│   │   ├── db.js                   # MongoDB connection (singleton)
│   │   ├── teamSession.js          # Token signing/verification
│   │   ├── mailer.js               # Email service
│   │   ├── ai/
│   │   │   ├── gemini.ts           # Gemini AI runtime & controllers
│   │   │   └── reflectionPrompts.ts
│   │   └── reflection/
│   │       └── topics.ts           # 7 reflection topics
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── eslint.config.mjs
│
└── README.md                       # Project documentation
```

## Database Models

### Core Entities

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **Team** | Project team records | `teamId` (unique), `projectName`, `accessCode`, `members[]`, `status` (green/yellow/red) |
| **Lecturer** | System admin | `email` (unique), `password` (bcrypt hashed) |
| **ReflectionChatSession** | Active reflection sessions | `teamId`, `sessionId`, `status`, `currentIndex`, `messages[]`, `answers[]` |
| **ReflectionSubmission** | Completed reflections | `teamId`, `sessionId`, `summary`, `submittedAt` |
| **ConversationThread** | Message thread metadata | `teamId`, `subject`, `unreadForTeam`, `unreadForLecturer` |
| **ConversationMessage** | Individual messages | `threadId`, `role` (team/lecturer), `text` |
| **Alert** | System alerts | `teamId`, `severity`, `message`, `emailStatus` |
| **Announcement** | Lecturer broadcasts | `title`, `body`, `targetTeams` |

### Key Constraints
- `Team.teamId` must be unique
- `(teamId, sessionId)` is unique for reflection sessions
- Team member `memberId` must be unique within a team

## API Endpoints

### Authentication
- `POST /api/lecturer/login` - Lecturer login
- `POST /api/lecturer/register` - Lecturer registration
- `POST /api/team/join` - Team session (sets httpOnly cookie)
- `GET /api/team/me` - Get current team profile

### Team Reflection (AI-Guided)
- `POST /api/team/reflection/start` - Initialize session
- `POST /api/team/reflection/turn` - Send turn/response
- `POST /api/team/reflection/finish` - Complete reflection
- `POST /api/team/reflection/confirm` - Confirm submission
- `POST /api/team/reflection/reset` - Reset session

### Team Messaging
- `GET/POST /api/team/messages` - List/create threads
- `GET/POST /api/team/messages/[threadId]` - Get/post messages

### Lecturer Admin
- `GET /api/teams` - List all teams
- `GET/PUT /api/teams/[teamId]` - Team details/update
- `GET /api/teams/[teamId]/insights` - Team analytics
- `GET /api/teams/[teamId]/reflections` - Reflection history
- `GET /api/teams/[teamId]/alerts` - Team alerts
- `GET/POST /api/teams/[teamId]/chat` - Chat history/send

### System
- `POST /api/alerts` - Create alert
- `GET/POST /api/announcements` - Announcements CRUD

## Authentication Architecture

### Lecturer Auth
- Email + password with bcrypt hashing (10 salt rounds)
- Password excluded from JSON responses

### Team Auth
- Access via `teamId` + `accessCode`
- Custom JWT-like token in `lib/teamSession.js`:
  - Base64url encoding + HMAC-SHA256 signature
  - 7-day expiration
  - `team_session` httpOnly cookie (secure in production)

## AI Integration (Gemini)

### Core Files
- `lib/ai/gemini.ts` - Runtime wrapper with 3 main functions:
  - `runReflectionController()` - Manages question progression
  - `runReflectionInterviewer()` - Generates follow-up questions
  - `runReflectionFinalSummary()` - Creates session summary
- `lib/ai/reflectionPrompts.ts` - System prompts (English input, Hebrew output)
- `lib/reflection/topics.ts` - 7 reflection topics

### Reflection Topics (in order)
1. **Achievements** (הישגים ותוצרים) - Concrete deliverables
2. **What Worked** (מה עבד טוב) - Success factors
3. **Pain Points** (מה לא עבד) - Problems encountered
4. **Blockers** (חסמים) - Impediments
5. **Decisions** (החלטות חשובות) - Key decisions
6. **Risks** (סיכונים לשבוע הבא) - Future risks
7. **Next Actions** (פעולות לשבוע הבא) - 3 concrete actions

### Session Flow
1. Team starts reflection → creates `ReflectionChatSession`
2. Server controls progression via `currentIndex`
3. Each topic has AI-guided Q&A with clarifying questions
4. On finish → AI generates summary
5. On confirm → archived to `ReflectionSubmission`

## Code Conventions

### File Organization
- `.ts/.tsx` for TypeScript with React
- `.js` for pure backend/utility Node.js
- Folder structure mirrors URL routes (Next.js convention)

### Naming
- **PascalCase**: React components, Mongoose models
- **camelCase**: Functions, variables
- **UPPER_SNAKE_CASE**: Constants (e.g., `REFLECTION_TOPICS`, `COOKIE_NAME`)

### Database Patterns
- Singleton pattern in `lib/db.js` (prevents dev connection reuse)
- Indexes on frequently queried fields (`teamId`, `createdAt`)
- Embedded schemas for related data (members, messages)

### TypeScript
- `strict: false` in tsconfig (relaxed checking)
- Mixed TS/JS codebase (gradual migration)
- Type definitions for Mongoose models in `.ts` files

### Error Handling
- Try-catch blocks in all API routes
- JSON error responses with appropriate status codes
- Fallback values for Gemini response parsing

## Development Workflow

1. **Setup**: `npm install` in `/teaminsight`
2. **Environment**: Create `.env.local` with required variables
3. **Development**: `npm run dev` → http://localhost:3000
4. **Entry Points**:
   - Lecturer: `/lecturer/login` → `/lecturer/dashboard`
   - Team: `/team/join` → `/team/info`
5. **Lint before commit**: `npm run lint`

## Common Tasks

### Adding a New API Endpoint
1. Create route file in `app/api/` following Next.js App Router conventions
2. Use `dbConnect()` from `lib/db.js`
3. Import relevant Mongoose models from `models/`
4. Return `NextResponse.json()` with appropriate status

### Adding a New Mongoose Model
1. Create schema in `models/` directory
2. Follow existing patterns (timestamps, indexes, exports)
3. Use `mongoose.models.Name || mongoose.model()` pattern for hot reload

### Modifying Reflection Flow
1. Topics defined in `lib/reflection/topics.ts`
2. AI behavior in `lib/ai/gemini.ts`
3. Prompts in `lib/ai/reflectionPrompts.ts`
4. API routes in `app/api/team/reflection/`

### Adding New Team Features
1. Create page in `app/team/(protected)/`
2. Wrap with `TeamGate.tsx` for auth
3. Add navigation in `TeamTabs.tsx`
4. Create API routes in `app/api/team/`

## Important Notes

- **No test framework configured** - Consider adding Jest/Vitest if needed
- **Hebrew language support** - UI text and AI responses are in Hebrew
- **Session per tab** - Reflection sessions support parallel tabs via `sessionId`
- **Single lecturer** - System designed for one lecturer account
- **Team health status** - Uses traffic light system (green/yellow/red)
- **Email notifications** - nodemailer integration for alerts

## File Reference Shortcuts

| Purpose | Location |
|---------|----------|
| MongoDB connection | `teaminsight/lib/db.js` |
| Team session auth | `teaminsight/lib/teamSession.js` |
| Gemini AI runtime | `teaminsight/lib/ai/gemini.ts` |
| Reflection topics | `teaminsight/lib/reflection/topics.ts` |
| All Mongoose models | `teaminsight/models/` |
| Lecturer pages | `teaminsight/app/lecturer/` |
| Team pages | `teaminsight/app/team/` |
| API routes | `teaminsight/app/api/` |
