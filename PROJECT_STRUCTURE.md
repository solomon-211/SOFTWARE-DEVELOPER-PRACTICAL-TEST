# PROJECT STRUCTURE & ORGANIZATION GUIDE

This file explains the complete folder structure and organization of the
School Management System project.

## ROOT DIRECTORY STRUCTURE

```plaintext
Practical Internship test/
├── README.md                           ← Main project documentation (START HERE!)
├── API_DOCUMENTATION.md                ← Complete API reference with examples
│
├── school-admin/                       ← ADMIN PORTAL APPLICATION
│   ├── README.md                       ← Admin app specific documentation
│   ├── .env.example                    ← Environment variable template
│   ├── docker-compose.yml              ← Docker configuration for admin app
│   │
│   ├── backend/                        ← Node.js/Express API
│   │   ├── .env                        ← Actual environment variables (git-ignored)
│   │   ├── .env.example                ← Template for .env
│   │   ├── package.json                ← NPM dependencies
│   │   ├── jest.config.js              ← Jest testing configuration
│   │   ├── Dockerfile                  ← Docker image for backend
│   │   │
│   │   └── src/                        ← Source code
│   │       ├── server.js               ← Express app setup & routes
│   │       │
│   │       ├── config/
│   │       │   └── db.js               ← MongoDB connection setup
│   │       │
│   │       ├── middlewares/            ← Express middlewares
│   │       │   ├── auth.js             ← JWT verification, role checking
│   │       │   ├── errorHandler.js     ← Global error handling
│   │       │   └── validate.js         ← Input validation error handling
│   │       │
│   │       ├── controllers/            ← Request handlers (route logic)
│   │       │   ├── authController.js   ← Login, staff creation
│   │       │   ├── classController.js  ← Class CRUD operations
│   │       │   ├── dashboardController.js ← Statistics & reporting
│   │       │   ├── deviceController.js ← Device verification
│   │       │   ├── feeController.js    ← Fee transaction management
│   │       │   └── studentController.js ← Student management
│   │       │
│   │       ├── services/               ← Business logic (reusable)
│   │       │   ├── authService.js      ← Password hashing, token generation
│   │       │   ├── auditService.js     ← Audit logging for compliance
│   │       │   ├── classService.js     ← Class operations
│   │       │   ├── cloudinaryService.js ← Image upload handling
│   │       │   ├── dashboardService.js ← Statistics calculations
│   │       │   ├── deviceService.js    ← Device verification logic
│   │       │   ├── emailService.js     ← Email notifications
│   │       │   ├── feeService.js       ← Fee processing logic
│   │       │   ├── passwordResetService.js ← Password recovery
│   │       │   └── studentService.js   ← Student data operations
│   │       │
│   │       ├── routes/                 ← API endpoint definitions
│   │       │   ├── authRoutes.js       ← POST /api/auth/*
│   │       │   ├── classRoutes.js      ← /api/classes/*
│   │       │   ├── dashboardRoutes.js  ← /api/dashboard/*
│   │       │   ├── deviceRoutes.js     ← /api/devices/*
│   │       │   ├── feeRoutes.js        ← /api/fees/*
│   │       │   ├── feeScheduleRoutes.js ← /api/fee-schedules/*
│   │       │   ├── linkingRoutes.js    ← /api/linking/*
│   │       │   ├── passwordResetRoutes.js ← /api/auth/password-reset/*
│   │       │   ├── studentRoutes.js    ← /api/students/*
│   │       │   └── termRoutes.js       ← /api/terms/*
│   │       │
│   │       ├── models/                 ← MongoDB schemas
│   │       │   ├── AcademicTerm.js     ← School term definitions
│   │       │   ├── AdminUser.js        ← Staff & admin accounts
│   │       │   ├── AuditLog.js         ← Activity tracking
│   │       │   ├── Class.js            ← Class information
│   │       │   ├── ClientUser.js       ← Parent/student accounts
│   │       │   ├── FeeSchedule.js      ← Fee structure
│   │       │   ├── FeeTransaction.js   ← Payment records
│   │       │   ├── LinkingRequest.js   ← Parent-student linking
│   │       │   ├── PasswordReset.js    ← Reset tokens
│   │       │   └── Student.js          ← Student academic info
│   │       │
│   │       ├── dtos/                   ← Data Transfer Objects
│   │       │   └── adminDto.js         ← API response transformers
│   │       │
│   │       ├── scripts/                ← One-time setup scripts
│   │       │   └── seed.js             ← Create initial admin account
│   │       │
│   │       └── __tests__/              ← Jest test files
│   │           ├── auth.test.js        ← Authentication tests
│   │           ├── devices.test.js     ← Device verification tests
│   │           └── students.test.js    ← Student management tests
│   │
│   └── frontend/                       ← React.js UI
│       ├── package.json                ← NPM dependencies
│       ├── vite.config.js              ← Vite build configuration
│       ├── Dockerfile                  ← Docker image for frontend
│       ├── nginx.conf                  ← Nginx web server config
│       │
│       └── src/
│           ├── App.jsx                 ← Main React component
│           ├── main.jsx                ← React entry point
│           ├── index.html              ← HTML template
│           │
│           ├── components/             ← Reusable components
│           │   ├── Icons.jsx           ← Icon components
│           │   ├── Layout.jsx          ← Sidebar & layout wrapper
│           │   └── ProtectedRoute.jsx  ← Route authentication guard
│           │
│           ├── pages/                  ← Route-level pages
│           │   ├── DashboardPage.jsx   ← Admin dashboard
│           │   ├── DevicesPage.jsx     ← Device management
│           │   ├── StudentsPage.jsx    ← Student management
│           │   ├── ClassesPage.jsx     ← Class management
│           │   ├── TeachersPage.jsx    ← Staff management
│           │   ├── FeesPage.jsx        ← Fee transaction review
│           │   ├── FeeSchedulesPage.jsx ← Fee structure
│           │   ├── TermsPage.jsx       ← Academic terms
│           │   ├── LoginPage.jsx       ← Authentication
│           │   └── ...                 ← More pages
│           │
│           ├── services/               ← API call functions
│           │   └── adminService.js     ← Axios API calls
│           │
│           └── styles/                 ← CSS styling
│               └── *.css               ← Global and component styles
│
├── school-client/                      ← CLIENT PORTAL APPLICATION
│   ├── README.md                       ← Client app specific documentation
│   ├── .env.example                    ← Environment variable template
│   ├── docker-compose.yml              ← Docker configuration
│   │
│   ├── backend/                        ← Node.js/Express API
│   │   ├── .env
│   │   ├── .env.example
│   │   ├── package.json
│   │   ├── jest.config.js
│   │   ├── Dockerfile
│   │   │
│   │   └── src/
│   │       ├── server.js               ← Express app setup
│   │       │
│   │       ├── config/
│   │       │   └── db.js               ← MongoDB connection
│   │       │
│   │       ├── middlewares/
│   │       │   ├── auth.js             ← JWT & device verification
│   │       │   ├── errorHandler.js
│   │       │   └── validate.js
│   │       │
│   │       ├── controllers/
│   │       │   ├── academicController.js ← Grades, attendance, timetable
│   │       │   ├── authController.js     ← Register, login
│   │       │   └── feeController.js      ← Fee management
│   │       │
│   │       ├── services/
│   │       │   ├── academicService.js  ← Grade & attendance logic
│   │       │   ├── authService.js
│   │       │   ├── emailService.js
│   │       │   ├── passwordResetService.js
│   │       │   └── studentService.js
│   │       │
│   │       ├── routes/
│   │       │   ├── academicRoutes.js   ← /api/academic/*
│   │       │   ├── authRoutes.js       ← /api/auth/*
│   │       │   ├── feeRoutes.js        ← /api/fees/*
│   │       │   └── ...
│   │       │
│   │       ├── models/
│   │       │   ├── User.js             ← Parent/Student accounts
│   │       │   ├── Student.js          ← Academic records
│   │       │   └── ... (shared with admin)
│   │       │
│   │       ├── dtos/
│   │       │   └── userDto.js          ← Response transformers
│   │       │
│   │       └── scripts/
│   │           └── seed.js
│   │
│   └── frontend/                       ← React.js UI
│       ├── package.json
│       ├── vite.config.js
│       ├── Dockerfile
│       │
│       └── src/
│           ├── App.jsx
│           ├── components/
│           │   ├── Layout.jsx
│           │   ├── ProtectedRoute.jsx
│           │   └── ...
│           ├── pages/
│           │   ├── DashboardPage.jsx   ← Parent/student dashboard
│           │   ├── FeesPage.jsx        ← Fee payment submission
│           │   ├── GradesPage.jsx      ← View grades
│           │   ├── AttendancePage.jsx  ← View attendance
│           │   ├── TimetablePage.jsx   ← Class schedule
│           │   ├── LoginPage.jsx
│           │   ├── RegisterPage.jsx
│           │   └── ...
│           ├── services/
│           │   ├── apiService.js       ← Axios HTTP client
│           │   ├── authService.js
│           │   ├── feeService.js
│           │   └── academicService.js
│           ├── utils/
│           │   ├── auth.js             ← Token & user management
│           │   └── deviceId.js         ← Device identification
│           └── styles/
```

## CODE ORGANIZATION PRINCIPLES

```plaintext
1. SEPARATION OF CONCERNS
   ├── Routes: Endpoint definitions only
   ├── Controllers: Request/response handling
   ├── Services: Business logic & data operations
   ├── Models: Database schemas
   └── Middlewares: Cross-cutting concerns

2. SECURITY LAYERS
   ├── Helmet: HTTP header hardening
   ├── CORS: Cross-origin restrictions
   ├── Rate Limiting: Brute force protection
   ├── Authentication: JWT verification
   ├── Authorization: Role-based access
   └── Validation: Input sanitization

3. NAMING CONVENTIONS
   ├── Files: camelCase.js
   ├── Variables: camelCase
   ├── Classes/Models: PascalCase
   ├── Constants: UPPER_SNAKE_CASE
   └── Routes: kebab-case (e.g., /api/fee-schedules)

4. COMMENT STRUCTURE
   ├── File header: Purpose and overview
   ├── Function header: What it does, parameters, returns
   ├── Inline comments: Explain "why", not "what"
   └── Section headers: Divide code into logical blocks
```

## DATABASE RELATIONSHIPS

```plaintext
AdminUser (Admin/Teacher accounts)
├── has many: assignedClasses (Class references)
└── can: update StudentGrades, mark StudentAttendance

ClientUser (Parent/Student accounts)
├── has many: devices (for verification)
├── has many: children (Parents -> Students)
└── has one: studentProfile (Students)

Student (Academic records)
├── belongs to: ClientUser (user account)
├── belongs to: Class (current class)
├── has many: grades (with AdminUser reference)
├── has many: attendance (with AdminUser reference)
└── has: feeBalance (financial tracking)

Class (Class information)
├── has many: teachers (AdminUser assignments)
├── has many: students (current enrollment)
└── has one: academicTerm
```

## FOLDER ORGANIZATION BENEFITS

```plaintext
✓ SCALABILITY
  - Easy to add new features (new controllers, services, routes)
  - Clear structure for new team members
  - Modular code that can be split into microservices

✓ MAINTAINABILITY
  - Business logic separated from routes
  - Reusable services across multiple controllers
  - Clear responsibility for each file

✓ TESTABILITY
  - Services can be tested independently
  - Mocked dependencies in tests
  - Clear input/output for functions

✓ SECURITY
  - Centralized error handling
  - Middleware pipeline for all requests
  - DTOs prevent data leakage
```

## DEVELOPMENT WORKFLOW

```plaintext
WHEN ADDING A NEW FEATURE:

1. Define Route
   └── routes/featureRoutes.js
       - Define endpoints with validation rules
       - Import controller functions

2. Create Controller
   └── controllers/featureController.js
       - Handle request/response
       - Call service methods
       - Return DTOs

3. Implement Service
   └── services/featureService.js
       - Write business logic
       - Call model methods
       - Throw errors with statusCode

4. Update Model (if needed)
   └── models/Feature.js
       - Define schema
       - Add indexes
       - Add validation

5. Create DTO (if needed)
   └── dtos/featureDto.js
       - Transform data before sending
       - Exclude sensitive fields

6. Write Tests
   └── src/__tests__/feature.test.js
       - Test service logic
       - Mock dependencies
       - Test error cases

7. Update Documentation
   └── API_DOCUMENTATION.md
       - Document new endpoints
       - Add request/response examples
```

## FILE SIZE GUIDELINES

```plaintext
KEEP FILES FOCUSED:

Controllers:   50-150 lines   (handlers for 2-5 endpoints)
Services:      100-300 lines  (related business logic)
Models:        50-200 lines   (single schema with methods)
Routes:        50-100 lines   (endpoint definitions)
Middlewares:   30-80 lines    (single responsibility)

If file exceeds limits:
  ✓ Split into multiple files
  ✓ Extract common logic to utility function
  ✓ Consider extracting a service method
```
