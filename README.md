# TeamInsight – README

## Contents
1. Project Structure
2. Quick Start: Environment & Dependencies
3. Database Entities
4. Database Entity Relationships
5. Constraints
6. Backend (API & Infrastructure)
7. Data Flow (Backend to Frontend)
8. AI (Gemini): Free Chat & Guided Reflection
9. Lecturer Client-Side Architecture

---

## 1. Project Structure

### Frontend (UI & Pages)
- `app/`
- `app/lecturer/`
- `app/team/`

### Backend (API Routes – Next.js App Router)
- `app/api/`

### Backend External API (Infrastructure & Data Access)
- `lib/`
  - `lib/db.js` (MongoDB connection via Mongoose)
  - `lib/teamSession.js` (team session cookie signing/verification)
  - `lib/ai/`
    - `lib/ai/cerebras.ts` (Cerebras runtime wrapper)
    - `lib/ai/prompts.ts` (prompts)
  - `lib/reflection/questions.ts` (reflection questions order)
- `models/` (Mongoose schemas / collections)

### Database
- MongoDB Atlas (remote) accessed via Mongoose

---

## 2. Quick Start: Environment & Dependencies

Open the project root in VS Code (`teaminsight`) and run:

1. `npm install`
2. `npm run dev`

First page: `http://localhost:3000`  
Choose **Lecturer** or **Team**.

---

## 3. Database Entities

### Lecturer
**Description:** Represents the system administrator (lecturer) for authentication and receiving alerts.
- `_id`
- `email`
- `passwordHash`
- `createdAt`

### Team
**Description:** Represents a single project team. All interactions are performed at the team level.
- `_id`
- `teamId`
- `projectName`
- `accessCode`
- `contactEmail`
- `members: [{ memberId, displayName }]`
- `status`
- `createdAt`

### ReflectionChatSession
**Description:** Represents a guided reflection conversation session (session per tab).
- `_id`
- `teamId`
- `sessionId`
- `status` (`in_progress` / `ready_to_submit` / `submitted`)
- `currentIndex`
- `messages: [{ role, text, createdAt }]`
- `answers: [{ questionId, prompt, answer, createdAt }]`
- `aiSummary`
- `createdAt`
- `updatedAt`

### Alert
**Description:** Represents an abnormal system event and maintains alert history and email notification tracking.
- `_id`
- `teamId`
- `severity`
- `message`
- `emailTo`
- `emailStatus`
- `createdAt`

### Announcement
**Description:** Used to publish announcements or tasks from the lecturer to the teams.
- `_id`
- `title`
- `body`
- `targetTeams`
- `createdAt`

### MessageThread
**Description:** Represents a thread between a team and the lecturer (mail/board style).
- `_id`
- `teamId`
- `subject`
- `lastMessageAt`
- `lastMessageText`
- `lastMessageRole` (`team` / `lecturer`)
- `unreadForTeam`
- `unreadForLecturer`
- `status` (`open` / `closed`)
- `createdAt`
- `updatedAt`

### MessageMessage
**Description:** Represents a single message inside a thread.
- `_id`
- `threadId`
- `teamId`
- `role` (`team` / `lecturer`)
- `text`
- `createdAt`

---

## 4. Database Entity Relationships

- **Team → ReflectionChatSession** (One-to-Many)  
  A single team can have multiple guided reflection sessions (including parallel tabs via `sessionId`).

- **Team → Alert** (One-to-Many)  
  Each team can have a history of alerts.

- **Announcement → Team** (Broadcast)  
  An announcement can target all teams or a selected list.

- **Team → MessageThread** (One-to-Many)  
  A team can have multiple message threads.

- **MessageThread → MessageMessage** (One-to-Many)  
  A thread contains multiple messages.

---

## 5. Constraints

- `Team.teamId` must be unique.
- `memberId` must be unique within a specific team.
- Only one reflection is allowed per `teamId + memberId` within a defined time period (application-level rule).
- The system contains a single lecturer.
- Only one chat session is allowed per team (`teamId` is unique in ChatSession).

ReflectionChatSession constraints:
- (`teamId`, `sessionId`) is unique (session per tab).
- `currentIndex` controls which reflection question is active.

Messages constraints:
- `MessageThread.teamId` is required and indexed.
- `MessageMessage.threadId` is required.

---

## 6. Backend (API & Infrastructure)

### Backend Overview
The backend is implemented using the Next.js App Router.  
The backend is responsible for:
- Connecting to MongoDB (Mongoose)
- Handling business logic
- Exposing API endpoints for the frontend
- Cerebras integration for AI features

### Team authentication (cookie session)
After a successful `POST /api/team/join`, the server sets an httpOnly cookie named `team_session`.  
This cookie is used to authenticate subsequent team requests (e.g., `GET /api/team/me`).  
Session signing/verification is implemented in `lib/teamSession.js`.

### Implemented API Routes

#### 1. Authentication
- **POST `/api/lecturer/login`**

#### 2. Team (cookie auth)
- **POST `/api/team/join`**
- **GET `/api/team/me`**

#### 3. Team AI (Cerebras)
- **POST `/api/team/ai/free`**
- **POST `/api/team/ai/feedback`**

#### 4. Guided Reflection
- **POST `/api/team/reflection/start`**
- **POST `/api/team/reflection/message`**
- **POST `/api/team/reflection/submit`**

#### 5. Team Messages
- **GET `/api/team/messages`**
- **POST `/api/team/messages`**
- **GET `/api/team/messages/[threadId]`**
- **POST `/api/team/messages/[threadId]`**

#### 6. Teams (lecturer/admin view)
- **GET `/api/teams`**
- **GET `/api/teams/[teamId]`**
- **PUT `/api/teams/[teamId]`**
- **GET `/api/teams/[teamId]/insights`**
- **GET `/api/teams/[teamId]/chat`**
- **POST `/api/teams/[teamId]/chat`**
- **GET `/api/teams/[teamId]/reflections`**
- **GET `/api/teams/[teamId]/alerts`**

#### 7. Reflections
- **POST `/api/reflections`**

#### 8. Alerts
- **POST `/api/alerts`**

#### 9. Announcements
- **POST `/api/announcements`**
- **GET `/api/announcements`**

#### 10. Analytics
- **GET `/api/analytics/teams`**
- **GET `/api/analytics/compare`**

### API Behavior (Common to All Routes)
Each API route:
1. Receives an HTTP request (GET / POST / PUT)
2. Validates input data
3. Uses the relevant Mongoose models
4. Communicates with MongoDB via Mongoose
5. Returns a structured JSON response

---

## 7. Data Flow (Backend to Frontend) 

### How the system works
1. The frontend sends an HTTP request to an API endpoint.
2. The matching API route in `app/api/.../route.*` is executed.
3. The route uses the relevant Mongoose model to apply business logic.
4. Mongoose reads/writes data in MongoDB.
5. A JSON response is returned to the frontend.

**In general:**  
Frontend → Backend → Database → Backend → Frontend

**In this project:**  
Frontend → Next.js API Route → Mongoose → MongoDB → API Response → Frontend

---

## 8. AI (Cerebras): Free Chat & Guided Reflection

The system supports two Cerebras-based experiences for teams:

### A) Team Free Chat
**Goal:** Free-form team conversation (practical advice, daily collaboration issues, process improvements).  
**UI:** `/team/chat`  
**API:** `POST /api/team/ai/free`  
**Behavior:** The AI may answer directly; if essential context is missing, it asks one clarifying question.  
**State:** Per-tab UI state (refresh resilience is handled by the client). Closing the tab/window may end the chat.

### B) Guided Reflection (DB-driven)
**Goal:** A structured reflection flow with fixed question ordering.  
**UI:** `/team/reflection`  
**API:**
- `POST /api/team/reflection/start`
- `POST /api/team/reflection/message`
- `POST /api/team/reflection/submit`

**Flow control:** The server/database controls progression using:
- `currentIndex` stored in `ReflectionChatSession`
- `REFLECTION_QUESTIONS` from `lib/reflection/questions.ts`

**Session per tab:** Each tab uses a unique `sessionId` (parallel reflections are supported).  
**Persistence:** Stored in MongoDB (answers, status, summary) for later insights.

### Prompts and Cerebras runtime
- `lib/ai/prompts.ts` – prompts are written in English; assistant output is Hebrew.
- `lib/ai/cerebras.ts` – Cerebras wrapper and helper functions used by API routes.
- `lib/reflection/questions.ts` – reflection questions list/order used by the server.

---

## 9. Lecturer Client-Side Architecture

The lecturer interface is implemented using Next.js App Router and React components.  
The client-side architecture follows a hierarchical component-based design.

The architecture separates concerns into logical component groups:
- GUIComponents – reusable UI elements (inputs, tables, charts, buttons)
- UserComponents – lecturer authentication and profile-related components
- TeamsComponents – team overview, team details, insights, alerts, reflections, and chatbot conversation history
- AnnouncementsComponents – publishing and viewing announcements/tasks
- AlertsComponents – alerts history and abnormal status notifications
- Header – navigation menu and logout functionality

The full client-side architecture diagram for the lecturer area is provided below.
<img width="1911" height="650" alt="image" src="https://github.com/user-attachments/assets/05ad4d96-5cae-40a4-89e0-69d665dda3d1" />

---
