# School Client Application

Parent and student portal for school self-service access.

## Contents

- `frontend/` React client interface
- `backend/` Node.js + Express API
- `.env.example` repository-level environment template (copy relevant values into `backend/.env`)

## Quick Start

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs on `http://localhost:5001` by default.

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000` by default.

## Required Environment Variables

This repository includes two templates:

- `./.env.example` (submission-level template)
- `./backend/.env.example` (runtime backend template)

For actual execution, use `backend/.env`.

## Main Features

- Parent/student registration and login with device verification flow
- JWT access tokens + refresh session handling
- Fee balance, payment submission, and refund requests
- Grades, attendance, and timetable viewing
- Low-balance alerts and account linking flow
- Swagger API docs at `/api-docs`

## Testing

```bash
cd backend
npm test
```
