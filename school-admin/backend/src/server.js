/**
 * ============================================================================
 * SCHOOL ADMIN BACKEND - SERVER ENTRY POINT
 * ============================================================================
 * 
 * Main Express application configuration for the admin portal API.
 * Handles:
 * - Security configuration (Helmet, CORS, rate limiting)
 * - Middleware setup (parsing, logging, authentication)
 * - Route registration for all admin features
 * - Error handling and 404 responses
 * 
 * Environment: Development with nodemon, Production with node
 * Port: Configured via PORT env variable (default: 5002)
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// ── Database Connection ───────────────────────────────────────────────────────
const connectDB = require('./config/db');

// ── Route Imports ─────────────────────────────────────────────────────────────
// Authentication & Authorization
const authRoutes          = require('./routes/authRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');

// Admin Management
const deviceRoutes        = require('./routes/deviceRoutes');        // Device verification
const studentRoutes       = require('./routes/studentRoutes');       // Student CRUD & grades
const classRoutes         = require('./routes/classRoutes');         // Class management
const teacherRoutes       = require('./routes/teacherRoutes');       // Teacher assignments
const feeRoutes           = require('./routes/feeRoutes');           // Fee transactions
const feeScheduleRoutes   = require('./routes/feeScheduleRoutes');   // Fee schedule management
const dashboardRoutes     = require('./routes/dashboardRoutes');     // Statistics & reporting
const linkingRoutes       = require('./routes/linkingRoutes');       // Parent-student linking
const termRoutes          = require('./routes/termRoutes');          // Academic terms

// ── Middleware Imports ────────────────────────────────────────────────────────
const errorHandler        = require('./middlewares/errorHandler');   // Global error handler

// ── Initialize Express App ────────────────────────────────────────────────────
const app = express();

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY & PROTECTION MIDDLEWARE
// ══════════════════════════════════════════════════════════════════════════════

// Apply security headers (prevent XSS, clickjacking, etc.)
app.use(helmet());

// Configure Cross-Origin Resource Sharing
// Allows requests from admin frontend only
app.use(cors({
  origin: process.env.ADMIN_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));

// Rate limiting to prevent brute force and DDoS attacks
// Limits each IP to 200 requests per 15 minutes
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,  // 15 minutes
  max:      Number(process.env.RATE_LIMIT_MAX) || 200,                   // 200 requests
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(limiter);

// ══════════════════════════════════════════════════════════════════════════════
// BODY PARSING MIDDLEWARE
// ══════════════════════════════════════════════════════════════════════════════

// Parse JSON request bodies (10MB limit for file uploads)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// ══════════════════════════════════════════════════════════════════════════════
// LOGGING MIDDLEWARE
// ══════════════════════════════════════════════════════════════════════════════

// Log all HTTP requests in development environment
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK ENDPOINT
// ══════════════════════════════════════════════════════════════════════════════

// Used by Docker and load balancers to verify API is running
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'school-admin-api' }));

// ══════════════════════════════════════════════════════════════════════════════
// API ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// Authentication routes (login, staff creation, etc.)
app.use('/api/auth',          authRoutes);
app.use('/api/auth',          passwordResetRoutes);

// Device management routes (verification, approval, revocation)
app.use('/api/devices',       deviceRoutes);

// Student management routes (CRUD, grades, attendance)
app.use('/api/students',      studentRoutes);

// Class management routes (CRUD, teacher assignment, schedules)
app.use('/api/classes',       classRoutes);

// Teacher management routes (staff assignments)
app.use('/api/teachers',      teacherRoutes);

// Fee management routes (approve/reject transactions)
app.use('/api/fees',          feeRoutes);

// Fee schedule routes (define payment structure)
app.use('/api/fee-schedules', feeScheduleRoutes);

// Dashboard routes (statistics, charts, reporting)
app.use('/api/dashboard',     dashboardRoutes);

// Student linking routes (parents linking to students)
app.use('/api/linking',       linkingRoutes);

// Academic term routes (term management)
app.use('/api/terms',         termRoutes);

// ══════════════════════════════════════════════════════════════════════════════
// ERROR HANDLING MIDDLEWARE
// ══════════════════════════════════════════════════════════════════════════════

// Handle 404 - Route not found
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler (catches all errors from routes and controllers)
app.use(errorHandler);

const PORT = process.env.PORT || 5002;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Admin API running on port ${PORT}`));
};

if (require.main === module) {
  start();
}

module.exports = app;
