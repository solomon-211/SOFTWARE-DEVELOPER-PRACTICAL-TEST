# School Management System

A full-stack school management platform built for the Elevanda Ventures Software Developer Practical Test. The system has two separate applications — one for school administrators and staff, and one for parents and students.

## Applications

| App | Purpose | Frontend | Backend |
|-----|---------|----------|---------|
| **school-admin** | Admin & teacher portal | React.js on port 3001 | Node.js/Express on port 5002 |
| **school-client** | Parent & student portal | React.js on port 3000 | Node.js/Express on port 5001 |

Both backends connect to the **same MongoDB database** (`school_db`) and the same `users` collection. This is intentional — it lets the admin verify devices and manage accounts created through the client registration flow.

---

## Project Structure

```
school-management-system/
├── school-admin/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/         # DB and Swagger setup
│   │   │   ├── controllers/    # Route handlers
│   │   │   ├── dtos/           # Data transfer objects
│   │   │   ├── middlewares/    # Auth, validation, error handling
│   │   │   ├── models/         # Mongoose schemas
│   │   │   ├── routes/         # Express routers
│   │   │   ├── services/       # Business logic
│   │   │   └── server.js
│   │   ├── Dockerfile
│   │   ├── .env.example
│   │   └── package.json
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   └── styles/
│   │   ├── Dockerfile
│   │   ├── nginx.conf
│   │   └── package.json
│   └── docker-compose.yml
│
├── school-client/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── controllers/
│   │   │   ├── dtos/
│   │   │   ├── middlewares/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── server.js
│   │   ├── Dockerfile
│   │   ├── .env.example
│   │   └── package.json
│   ├── frontend/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   ├── nginx.conf
│   │   └── package.json
│   └── docker-compose.yml
│
├── school-admin/README.md
├── school-client/README.md
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18, React Router v6, TanStack React Query v5 |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP Client | Axios |
| Build Tool | Vite |
| Backend | Node.js 20, Express.js 4 |
| Database | MongoDB 7, Mongoose 8 |
| Auth | JWT (jsonwebtoken) |
| Password Hashing | SHA-512 via Node.js built-in `crypto` |
| Security | Helmet.js, express-rate-limit, express-validator |
| Email | Nodemailer |
| File Uploads | Multer + Cloudinary |
| Logging | Morgan |
| Containerization | Docker + Docker Compose + Nginx |
| API Docs | Swagger UI (swagger-jsdoc + swagger-ui-express) |

---

## Core Features

### Authentication & Security

- SHA-512 password hashing (Node.js `crypto` module — no bcrypt)
- JWT access tokens (short-lived, default 15 min) + refresh token rotation
- Device ID verification — admin must approve each device before the user can access protected routes
- Role-based access control: Admin, Teacher, Student, Parent
- HTTP security headers via Helmet.js
- Rate limiting on all routes
- Input validation and sanitization via express-validator
- 30-minute inactivity session timeout (configurable via `SESSION_IDLE_TIMEOUT_MINUTES`)

### Admin Features

- Dashboard with live stats (students, teachers, fees collected, attendance rates)
- Student management — create, update, promote between classes
- Teacher/staff management — create accounts, assign to classes and subjects
- Class management — create classes, assign teachers per subject, set timetables
- Device verification — approve or revoke user devices
- Fee management — view all transactions, approve/reject payments and refund requests
- Fee schedule templates — create reusable fee definitions
- Fee charging — charge individual students or entire classes; edit or delete pending charges
- Grade management — teachers update grades per subject; scoped to their assigned classes
- Attendance tracking — individual and bulk attendance marking
- Academic term management
- Student linking requests — approve parent-to-student account links
- Audit logging for all sensitive operations

### Parent/Student Features

- Registration and login with device verification flow
- Dashboard with outstanding fee alerts and quick stats
- Fee management — view charges from school, submit payments with proof, request refunds
- Grades — view all subjects, scores, and terms
- Attendance — view attendance history
- Timetable — color-coded weekly schedule with teacher names
- Account linking — parents can link to a student record using the student code
- In-app alerts for low balance, pending payments, and device verification status

### Push Notifications

This is a **web application** (React.js), not a mobile app. Native push notifications are not implemented. In-app alerts for low balance, payment confirmation, and device verification are shown directly in the dashboard UI. A React Native or Flutter implementation would add native push support via Firebase Cloud Messaging (FCM).

---

## Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9
- MongoDB (local or Atlas)
- Docker & Docker Compose (optional)

### Option 1: Local Development

```bash
# Admin backend
cd school-admin/backend
cp .env.example .env
# Edit .env — set MONGO_URI, JWT_SECRET, etc.
npm install
npm run dev        # runs on http://localhost:5002

# Admin frontend (new terminal)
cd school-admin/frontend
npm install
npm run dev        # runs on http://localhost:3001

# Client backend (new terminal)
cd school-client/backend
cp .env.example .env
npm install
npm run dev        # runs on http://localhost:5001

# Client frontend (new terminal)
cd school-client/frontend
npm install
npm run dev        # runs on http://localhost:3000
```

### Option 2: Docker

```bash
# Admin app
cd school-admin
cp backend/.env.example backend/.env
docker-compose up --build
# Admin frontend: http://localhost:3001
# Admin API:      http://localhost:5002

# Client app (new terminal)
cd school-client
cp backend/.env.example backend/.env
docker-compose up --build
# Client frontend: http://localhost:3000
# Client API:      http://localhost:5001
```

---

## Initial Setup

### Create the Admin Account

```bash
cd school-admin/backend
npm run seed
```

This creates the default admin account:

```
Email:    admin@school.rw
Password: Admin@1234
```

---

## Environment Variables

### Admin Backend (`school-admin/backend/.env`)

```env
MONGO_URI=mongodb://localhost:27017/school_db
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=8h
PORT=5002
NODE_ENV=development
ADMIN_ORIGIN=http://localhost:3001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
```

### Client Backend (`school-client/backend/.env`)

```env
MONGO_URI=mongodb://localhost:27017/school_db
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=7d
SESSION_IDLE_TIMEOUT_MINUTES=30
PORT=5001
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

> Both backends must use the **same `MONGO_URI`** to share the database.

---

## API Documentation

Swagger UI is available on each backend after startup:

- Admin API docs: `http://localhost:5002/api-docs`
- Client API docs: `http://localhost:5001/api-docs`

### Admin API (`http://localhost:5002/api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Admin/staff login |
| POST | `/auth/staff` | Create staff account (admin only) |
| GET | `/dashboard` | Dashboard statistics |
| GET | `/devices/pending` | List unverified devices |
| PATCH | `/devices/:userId/:deviceId/verify` | Verify a device |
| PATCH | `/devices/:userId/:deviceId/revoke` | Revoke a device |
| GET | `/students` | List students (teacher-scoped) |
| POST | `/students` | Create student record |
| PUT | `/students/:id` | Update student |
| PUT | `/students/:id/grades` | Update grades |
| PUT | `/students/:id/attendance` | Mark attendance |
| POST | `/students/bulk-attendance` | Bulk attendance |
| POST | `/students/promote` | Promote students between classes |
| POST | `/students/:id/send-invite` | Send registration invite |
| GET | `/classes` | List classes |
| PATCH | `/classes/:id/assign-teacher` | Assign teacher to subject |
| PUT | `/classes/:id/timetable` | Update timetable |
| GET | `/fees` | List all fee transactions |
| POST | `/fees/charge` | Charge a fee to a student |
| PATCH | `/fees/charge/:txId` | Edit a pending charge |
| DELETE | `/fees/charge/:txId` | Delete a pending charge |
| PATCH | `/fees/:txId/process` | Approve or reject a payment/refund |
| GET | `/fee-schedules` | List fee schedule templates |
| POST | `/fee-schedules` | Create fee schedule template |
| DELETE | `/fee-schedules/:id` | Delete fee schedule template |

### Client API (`http://localhost:5001/api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register parent/student |
| POST | `/auth/login` | Login with device ID |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Revoke refresh token |
| GET | `/auth/me` | Current user profile |
| GET | `/fees/:studentId` | Fee balance and history |
| POST | `/fees/:studentId/deposit` | Submit payment with proof |
| POST | `/fees/:studentId/withdraw` | Request refund |
| GET | `/academic/:studentId/grades` | View grades |
| GET | `/academic/:studentId/attendance` | View attendance |
| GET | `/academic/:studentId/timetable` | View timetable |
| GET | `/academic/:studentId/profile` | Student profile |
| POST | `/linking` | Submit account linking request |
| GET | `/linking` | View linking requests |

---

## Architecture

```
Routes → Controllers → Services → Models → MongoDB
```

- Routes are thin — only define paths and apply middleware
- Controllers handle HTTP request/response only
- Services contain all business logic
- DTOs strip sensitive fields before data leaves the backend
- Audit logs track grades, attendance, fees, and device approvals

### Middleware Pipeline

1. Helmet (security headers)
2. CORS
3. Rate limiting
4. Body parsing
5. JWT authentication (`protect`)
6. Device verification (`requireVerifiedDevice`)
7. Role-based authorization
8. Input validation (express-validator)
9. Global error handler

---

## Key Workflows

### Device Verification

```
Register/Login → Device ID sent → Device added as unverified
→ Admin approves device → User can access protected routes
```

### Fee Payment

```
Admin charges fee → Student sees unpaid fee on portal
→ Student submits payment with proof → Admin reviews
→ Admin approves → Balance updated
```

### Student Auto-Link

```
Admin creates student record
→ Student registers on client portal (same name)
→ On login, system auto-matches student record by name
→ studentProfile linked automatically
→ Timetable, grades, attendance all resolve correctly
```

### Invite-Based Onboarding

```
Admin creates student → Admin sends invite email
→ Parent/student registers with invite token
→ Account auto-linked to student record
→ Device still requires admin verification
```

### Session Inactivity

```
Access token (15 min) → Frontend refreshes via cookie
→ Refresh token rotates on each use
→ Idle > SESSION_IDLE_TIMEOUT_MINUTES → session revoked
→ User must log in again
```

---

## Troubleshooting

**MongoDB connection refused**
Ensure MongoDB is running. Check `MONGO_URI` in `.env`.

**Device not verified**
Admin must approve the device in the Device Verification section of the admin portal.

**Timetable not showing**
The student account must be linked to a student record. This happens automatically on login if the student was created by admin with the same first and last name. If it still doesn't show, use the "Link Account" page in the client portal to submit a linking request.

**JWT token expired**
Access tokens expire after 15 minutes. The frontend refreshes them automatically. If the session is idle for more than 30 minutes, log in again.

**Rate limit exceeded**
Wait 15 minutes or increase `RATE_LIMIT_MAX` in `.env`.

---

## Bonus Features Implemented

- Swagger API documentation on both backends
- Dockerized setup with Nginx for both apps
- Teacher-scoped views (classes, students, grades, attendance)
- Fee schedule templates with reusable definitions
- Bulk fee charging per class
- Edit and delete pending fee charges
- Student promotion between classes
- Audit logging
- Inactivity session timeout
- In-app alerts (low balance, pending payments, device status)

---

## Commit Convention

```
feat: add login flow
fix: resolve timetable population error
refactor: extract findStudent helper
docs: update README
```

---

*Elevanda Ventures – Empowering Education Through Technology*
*Kigali, Rwanda | careers@elevandaventures.com*
