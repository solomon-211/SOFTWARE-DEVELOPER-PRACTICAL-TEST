# School Client Application

Parent and student self-service portal for registering, viewing academic records, managing fee payments, and tracking school activity.

---

## Tech Stack

| Layer | Technology | Version |
| ----- | ---------- | ------- |
| Frontend | React.js | ^18.3.1 |
| Frontend Routing | React Router DOM | ^6.23.1 |
| Frontend State | TanStack React Query | ^5.40.0 |
| Frontend Icons | Lucide React | ^1.14.0 |
| HTTP Client | Axios | ^1.7.2 |
| Build Tool | Vite | ^5.3.1 |
| Backend Runtime | Node.js | ^20 |
| Backend Framework | Express.js | ^4.19.2 |
| Database | MongoDB | 7.0 |
| ODM | Mongoose | ^8.4.1 |
| Authentication | JWT access tokens (15m) + refresh token rotation (7d) | ^9.0.2 |
| Password Hashing | SHA-512 (crypto built-in) | — |
| Security Headers | Helmet.js | ^7.1.0 |
| Rate Limiting | express-rate-limit | ^7.3.1 |
| Input Validation | express-validator | ^7.1.0 |
| Cookie Parsing | cookie-parser | — |
| Email | Nodemailer | ^8.0.7 |
| File Storage | Cloudinary (payment proof uploads) | — |
| API Docs | Swagger UI (swagger-ui-express) | — |
| Containerization | Docker + Docker Compose | — |
| Web Server | Nginx | — |

---

## Project Structure

```
school-client/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js           # MongoDB connection
│   │   │   └── swagger.js      # Swagger/OpenAPI config
│   │   ├── controllers/        # HTTP request handlers
│   │   ├── dtos/
│   │   │   └── userDto.js      # Strip sensitive fields before API response
│   │   ├── middlewares/
│   │   │   ├── auth.js         # JWT verification + device verification (protect, requireVerifiedDevice, authorize)
│   │   │   ├── errorHandler.js # Global error handler
│   │   │   └── validate.js     # express-validator error collector
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # Express routers
│   │   └── services/           # Business logic
│   ├── __tests__/              # Jest test files
│   ├── .env.example
│   ├── jest.config.js
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx          # Sidebar + topbar navigation
│   │   │   ├── ProtectedRoute.jsx  # Auth guard — redirects to /login if not authenticated
│   │   │   ├── PasswordInput.jsx   # Show/hide password field
│   │   │   ├── RefreshBar.jsx      # Session activity tracker for idle timeout
│   │   │   └── Icons.jsx           # Shared icon wrappers
│   │   ├── pages/                  # One file per route
│   │   ├── services/
│   │   │   ├── api.js              # Axios instance with JWT + device ID interceptors
│   │   │   ├── authService.js      # Register, login, logout, token storage
│   │   │   ├── feeService.js       # Fee balance, deposit, withdraw
│   │   │   └── academicService.js  # Grades, attendance, timetable, profile
│   │   ├── utils/
│   │   │   ├── auth.js             # Read user/token from sessionStorage
│   │   │   └── deviceId.js         # Generate and persist device ID in localStorage
│   │   └── styles/
│   │       └── global.css
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## Quick Start

### Prerequisites

- Node.js >= 18
- MongoDB — must use the same instance as the admin app
- npm >= 9

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — at minimum set MONGO_URI, JWT_SECRET, JWT_REFRESH_SECRET, CLIENT_ORIGIN
npm install
npm run dev
```

- API: `http://localhost:5001`
- Swagger UI: `http://localhost:5001/api-docs`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

- Frontend: `http://localhost:3000`

### 3. Docker

```bash
cp backend/.env.example backend/.env
# Edit backend/.env as needed
docker-compose up --build
# API:      http://localhost:5001
# Frontend: http://localhost:3000
```

---

## Environment Variables

Full list in `backend/.env.example`:

```env
PORT=5001
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/school_db

JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_jwt_secret_here
JWT_REFRESH_EXPIRES_IN=7d
SESSION_IDLE_TIMEOUT_MINUTES=30

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=SchoolPortal <your_email@gmail.com>

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

ADMIN_API_KEY=your_admin_api_key_here
ADMIN_API_URL=http://localhost:5002
CLIENT_ORIGIN=http://localhost:3000

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

> `MONGO_URI` must be the same value used in the admin app backend — both apps share one database.

---

## API Endpoints

### Authentication — `/api/auth`

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| POST | /api/auth/register | Public | Register as parent or student with device ID |
| POST | /api/auth/login | Public | Login — device must be verified by admin first |
| POST | /api/auth/refresh | Public | Renew access token using refresh token cookie |
| POST | /api/auth/logout | Auth | Logout and revoke refresh token |
| GET | /api/auth/me | Auth | Get current authenticated user profile |
| POST | /api/auth/forgot-password | Public | Send password reset link to email |
| POST | /api/auth/reset-password | Public | Reset password using token from email |

### Fee Management — `/api/fees`

All fee endpoints require authentication and a verified device (`X-Device-ID` header).

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| GET | /api/fees/:studentId | Auth + Device | Get fee balance and last 50 transactions |
| POST | /api/fees/:studentId/deposit | Auth + Device | Submit a fee payment with proof (link or file upload) |
| POST | /api/fees/:studentId/withdraw | Auth + Device | Submit a refund request |

### Academic Records — `/api/academic`

All academic endpoints require authentication and a verified device.

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| GET | /api/academic/:studentId/profile | Auth + Device | Student name, class, DOB, gender, fee balance |
| GET | /api/academic/:studentId/grades | Auth + Device | All grades by subject and term |
| GET | /api/academic/:studentId/attendance | Auth + Device | Full attendance history with status per date |
| GET | /api/academic/:studentId/timetable | Auth + Device | Weekly class schedule (day, subject, time, room, teacher) |

### Account Linking — `/api/linking`

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| POST | /api/linking | Auth + Device | Submit a linking request using student code |
| GET | /api/linking | Auth + Device | Get all linking requests for the current user |
| GET | /api/linking/:studentCode | Auth + Device | Check linking status for a specific student code |

---

## Authentication Flow

1. User registers with `firstName`, `lastName`, `email`, `password`, `role` (`parent` or `student`), and `deviceId`
2. Account is created — device is marked as **unverified**
3. Admin reviews and approves the device in the admin portal
4. User logs in — backend checks device verification on every protected request via `X-Device-ID` header
5. On successful login: access token (15 min) returned in response body + refresh token set as httpOnly cookie
6. Frontend auto-refreshes the access token silently using the refresh cookie before it expires
7. After `SESSION_IDLE_TIMEOUT_MINUTES` (default 30) of inactivity, the frontend clears the session and redirects to login
8. The backend also enforces idle timeout — if the refresh token's `lastUsedAt` exceeds the cutoff, the refresh is rejected

---

## Account Linking

Parents and students must link their portal account to their school record (created by admin in the admin portal):

**Option 1 — Registration invite (recommended):**
Admin sends a registration invite from the admin portal. The invite email contains a link with a token. User registers using that link — account is automatically linked to the student record on registration.

**Option 2 — Manual linking request:**
User submits a linking request from the Link Account page using the student code. Admin reviews and approves or rejects the request in the Linking Requests section of the admin portal.

---

## Shared Database

Both the client app and the admin app connect to the **same MongoDB instance**. The `User` model in this app and the `ClientUser` model in the admin app both use the `users` collection. The `Student`, `Class`, and `FeeTransaction` collections are also shared.

This is intentional — it allows the admin to:
- Verify devices registered through the client app
- See fee payments submitted by parents
- Update grades and attendance that students can immediately view

Both backends must use the same `MONGO_URI`.

---

## Database Models

| Model | Collection | Purpose |
| ----- | ---------- | ------- |
| User | users | Parent and student accounts (shared with admin app) |
| Student | students | Academic profiles, grades, attendance (shared with admin app) |
| Class | classes | Class definitions and timetable (shared with admin app) |
| FeeTransaction | feetransactions | Deposits, withdrawals, and admin charges (shared with admin app) |
| LinkingRequest | linkingrequests | Parent-to-student link requests submitted by users |
| PasswordReset | passwordresets | Password reset tokens — auto-deleted on expiry via TTL index |

---

## Security

- Passwords hashed with SHA-512 (per project specification)
- JWT access tokens expire after 15 minutes
- Refresh tokens rotate on every use — old token is invalidated immediately
- Refresh tokens stored as httpOnly cookies — not accessible via JavaScript
- Device verification required on all protected routes via `X-Device-ID` header
- Session idle timeout enforced on both frontend (RefreshBar component) and backend (lastUsedAt check)
- Rate limiting: 100 requests per 15 minutes per IP
- HTTP security headers via Helmet
- CORS restricted to `CLIENT_ORIGIN`
- Input validation and sanitization on all routes via express-validator
- Sensitive fields (passwordHash, refreshTokens) excluded from all API responses via DTOs

---

## Push Notifications

This is a web application (React.js). Native push notifications are not implemented. In-app alerts for low fee balance, pending payment status, and device verification are displayed directly in the UI. A React Native or Flutter implementation would add native push notifications via Firebase Cloud Messaging (FCM).
