# CampusCode

CampusCode is a web platform for running **coding exams** in a college. Teachers create exams and questions with test cases, students write and run code in the browser, and the system grades their code automatically. Admins manage semesters, classes, users and can watch the whole system live.

It is a MERN app (MongoDB, Express, React, Node.js). Student code is run safely by **Judge0**, an open-source code execution engine.

---

## Features

**Students**
- See upcoming exams and join them from a dashboard
- Write code in a Monaco (VS Code-style) editor and run it against sample test cases
- Code is autosaved every 30 seconds to Redis, so a refresh or crash does not lose work
- View results with a per-test-case breakdown once the teacher publishes them

**Teachers**
- Question bank with public (sample) and hidden test cases, each with a weight
- Create and schedule exams for their classes
- Automatic evaluation: every submission is run against all test cases and scored by weight
- Manual evaluation on top of auto marks, custom evaluation criteria, final result selection
- Publish results now or schedule publishing for later

**Admins / Superadmin**
- Semesters, lab slots, timetables and class schedule templates
- Bulk upload of student and faculty data (JSON), which auto-creates classes and accounts and emails login credentials
- Live monitoring ("Third Eye"): active users, server health, logs, audit trail
- Reports and exports (CSV / PDF), notifications, database explorer
- Role-based permissions: a superadmin decides what each admin may do

**Platform**
- JWT authentication, bcrypt password hashing, rate limiting, password reset by email
- Real-time updates over Socket.IO (with a Redis adapter so several server processes can share events)
- Swagger API docs at `/api-docs`
- Light and dark theme

---

## Architecture

```mermaid
flowchart LR
    B[Browser<br/>React + Vite] -- REST + JWT --> API[Express API<br/>Node.js]
    B <-- Socket.IO --> API
    API --> M[(MongoDB<br/>users, exams, results)]
    API --> R[(Redis<br/>code drafts, Socket.IO pub/sub)]
    API -- run code --> J[Judge0<br/>sandboxed execution]
    API -- credentials, reset links --> E[SMTP email]
```

How an exam submission is graded:

1. The student clicks submit. The backend saves the code.
2. `services/autoEvaluation.service.js` loads every test case of every question assigned to that student.
3. For each test case, the code is sent to Judge0 with the test input. If the output matches the expected output and Judge0 says "Accepted", that test case's weight is counted as passed.
4. Marks for a question = `passedWeight / totalWeightOfAllAssignedQuestions × exam.totalMarks`. Adding up all questions can therefore never go above `totalMarks`.
5. The teacher can review, add manual marks, and publish.

`server.js` uses Node's `cluster` module: a primary process runs the scheduled result-publisher once a minute, and `WEB_CONCURRENCY` worker processes serve HTTP and Socket.IO.

### Project structure

```
backend/
  server.js            entry point (cluster primary + workers)
  start_solo.js        single-process server, handy for debugging
  app.js               Express app, middleware, route mounting
  config/              MongoDB, Redis, Judge0, Socket.IO, logger, Swagger
  routes/ controllers/ services/   request -> controller -> business logic
  models/              Mongoose schemas
  middlewares/         auth, permissions, rate limit, audit log, errors
  scripts/             createSuperadmin, publishResults worker, maintenance scripts
  Fake/                anonymized demo data for the bulk upload feature
frontend/
  src/pages/           student, teacher, admin and auth pages
  src/components/      layout and UI components
  src/context/         auth, socket and theme state
  src/services/        axios API clients
```

---

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, TanStack Query, Monaco Editor, Recharts, Framer Motion, Socket.IO client |
| Backend | Node.js, Express 5, Mongoose, Socket.IO, ioredis, JWT, bcrypt, Multer, Nodemailer, Winston, PDFKit, Swagger |
| Data | MongoDB (Atlas), Redis (Upstash) |
| Code execution | Judge0 (self-hosted or RapidAPI) |
| Hosting | Vercel (frontend), Render (backend) |

---

## Local setup

You need Node.js 18+, a MongoDB database (local or a free Atlas cluster), Redis (local, Docker, or Upstash) and a Judge0 endpoint.

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
```

**Backend**

```bash
cd backend
cp .env.example .env          # then fill in MONGO_URI, JWT_SECRET, JUDGE0_URL, Redis...
npm install
SUPERADMIN_EMAIL=you@example.com SUPERADMIN_PASSWORD='pick-a-strong-one' npm run create-superadmin
npm run dev                   # nodemon, restarts on file changes -> http://localhost:5000
```

Quick Redis with Docker: `docker run -d -p 6379:6379 redis:7-alpine`

**Frontend**

```bash
cd frontend
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:5000
npm install
npm run dev                   # http://localhost:5173
```

Log in with the superadmin account you created.

**Demo data:** in the admin panel, create a semester, then open *Data Upload* and upload `backend/Fake/StudentFake.json` (students), `backend/Fake/faculty_slot.json` (teachers) and `backend/Fake/Faculty_email.json` (faculty emails). All people in these files are made up.

---

## Environment variables

Full lists with comments are in [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example).

**Backend**

| Variable | Required | What it is |
|---|---|---|
| `MONGO_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Secret used to sign login tokens. Use a long random string |
| `JUDGE0_URL` | yes | Judge0 base URL |
| `JUDGE0_API_KEY` | RapidAPI only | Sent as `X-RapidAPI-Key` when set |
| `JUDGE0_API_HOST` | no | Sent as `X-RapidAPI-Host` (default `judge0-ce.p.rapidapi.com`) |
| `REDIS_URL` | one of | Full Redis URL, e.g. Upstash `rediss://...` |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB` | one of | Separate Redis settings, used when `REDIS_URL` is empty |
| `FRONTEND_URL` | yes in prod | Frontend origin for CORS and password-reset links |
| `PORT` | no | HTTP port (default 5000; Render sets it for you) |
| `WEB_CONCURRENCY` | no | Number of worker processes (default 1) |
| `NODE_ENV` | no | `production` hides error stack traces |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`, `EMAIL_FROM_NAME` | for email | SMTP settings. For Gmail, use an App Password |
| `EMAIL_BATCH_SIZE`, `EMAIL_BATCH_DELAY` | no | Bulk email pacing |
| `REDIS_KEY_PREFIX`, `DRAFT_TTL_BUFFER_HOURS`, `MAX_CODE_SIZE_BYTES` | no | Code draft autosave tuning |
| `REDIS_CONNECT_TIMEOUT`, `REDIS_KEEP_ALIVE`, `REDIS_MAX_RETRIES` | no | Redis connection tuning |
| `LOG_LEVEL`, `LOG_DIR` | no | Logging |
| `SUPERADMIN_NAME`, `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD` | script only | Used by `npm run create-superadmin` (password required) |
| `PASSWORD_TO_HASH` | script only | Used by `scripts/hashPassword.js` |

**Frontend** (these are built into the browser bundle, so never put secrets here)

| Variable | What it is |
|---|---|
| `VITE_API_BASE_URL` | Backend URL, used for REST and Socket.IO |
| `VITE_API_TIMEOUT` | Request timeout in ms (default 100000) |
| `VITE_AUTOSAVE_INTERVAL_MS` | Autosave interval in ms (default 30000) |

---

## Free deployment

The whole stack fits in free tiers: **Atlas** (database) + **Upstash** (Redis) + **Judge0 on RapidAPI** (code runs) + **Render** (backend) + **Vercel** (frontend). Set up in this order, because each step needs a value from the one before.

### 1. MongoDB Atlas
1. Create a free **M0** cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. *Database Access*: add a database user with a strong password.
3. *Network Access*: add `0.0.0.0/0`. Render's free plan has no fixed IP address, so Atlas must accept connections from anywhere; the user and password still protect the database.
4. *Connect → Drivers*: copy the connection string, put your password in, and add a database name before the `?`, e.g. `.../campuscode?retryWrites=true&w=majority`. This is `MONGO_URI`.

### 2. Upstash Redis
1. Create a free Redis database at [upstash.com](https://upstash.com).
2. Copy the `rediss://default:...@...upstash.io:6379` URL. This is `REDIS_URL` (the `rediss://` part means TLS, which ioredis turns on automatically).

### 3. Judge0 (RapidAPI)
1. Subscribe to the free plan of [Judge0 CE on RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce).
2. `JUDGE0_URL=https://judge0-ce.p.rapidapi.com`, `JUDGE0_API_KEY=<your RapidAPI key>`, `JUDGE0_API_HOST=judge0-ce.p.rapidapi.com`.
3. The free plan has a small daily request limit. Every test case of every question is one request, so it is fine for a demo but not for a real exam. For real use, self-host Judge0 on a VM and leave `JUDGE0_API_KEY` empty.

### 4. Backend on Render
1. [render.com](https://render.com) → *New → Web Service* → connect this GitHub repo.
2. Root directory: `backend`. Runtime: Node. Build command: `npm ci`. Start command: `npm start`. Instance type: Free.
3. Add environment variables: `MONGO_URI`, `JWT_SECRET`, `REDIS_URL`, `JUDGE0_URL`, `JUDGE0_API_KEY`, `JUDGE0_API_HOST`, `NODE_ENV=production`, `WEB_CONCURRENCY=1`, and the `EMAIL_*` values if you want emails. Do not set `PORT`; Render provides it.
4. Deploy and note the URL, e.g. `https://campuscode-api.onrender.com`. Opening it should show "Welcome to backend".
5. Create the superadmin once. Either open the service *Shell* on Render and run `SUPERADMIN_EMAIL=... SUPERADMIN_PASSWORD=... npm run create-superadmin`, or run the same command on your laptop with `MONGO_URI` pointing at Atlas.
6. Free Render services go to sleep after about 15 minutes without traffic, so the first request after that can take up to a minute.

### 5. Frontend on Vercel
1. [vercel.com](https://vercel.com) → *Add New → Project* → import this repo.
2. Root directory: `frontend`. Framework preset: Vite (build `npm run build`, output `dist`).
3. Environment variable: `VITE_API_BASE_URL=https://<your-render-url>` (no trailing slash).
4. Deploy. `frontend/vercel.json` sends every path to `index.html`, so refreshing on a page like `/student/dashboard` works.

### 6. Connect the two
Back on Render, set `FRONTEND_URL=https://<your-app>.vercel.app` and redeploy. Without this, the browser blocks API calls because of CORS.

A Docker setup for a VPS (`backend/Dockerfile`, `backend/docker-compose.yml`, `backend/nginx/`, `backend/deploy.sh`) is also included.

---

## Credits

Built by **Avi Ranjan** and **Aditya** (authors listed in `backend/package.json`) as an academic project for the M.Tech CSE (Full Stack Development) program at SRM.
