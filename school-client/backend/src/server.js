/**
 * ============================================================================
 * SCHOOL CLIENT BACKEND - SERVER ENTRY POINT
 * ============================================================================
 * 
 * Main Express application configuration for the parent/student portal API.
 * Handles:
 * - Security configuration (Helmet, CORS, rate limiting)
 * - Middleware setup (parsing, logging, authentication)
 * - Route registration for client features
 * - Error handling and 404 responses
 * 
 * Environment: Development with nodemon, Production with node
 * Port: Configured via PORT env variable (default: 5001)
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
// Authentication & Profile
const authRoutes          = require('./routes/authRoutes');           // Login, register, profile
const passwordResetRoutes = require('./routes/passwordResetRoutes');   // Password reset flows

// Financial Management
const feeRoutes           = require('./routes/feeRoutes');            // Fee balance, deposits, withdrawals

// Academic Information
const academicRoutes      = require('./routes/academicRoutes');       // Grades, attendance, timetable

// Parent-Student Linking
const linkingRoutes       = require('./routes/linkingRoutes');        // Linking requests

// ── Middleware Imports ────────────────────────────────────────────────────────
const errorHandler        = require('./middlewares/errorHandler');    // Global error handler

// ── Initialize Express App ────────────────────────────────────────────────────
const app = express();

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY & PROTECTION MIDDLEWARE
// ══════════════════════════════════════════════════════════════════════════════

// Apply security headers (prevent XSS, clickjacking, etc.)
app.use(helmet());

// Configure Cross-Origin Resource Sharing
// Allows requests from client frontend only
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// ══════════════════════════════════════════════════════════════════════════════
// RATE LIMITING - BRUTE FORCE PROTECTION
// ══════════════════════════════════════════════════════════════════════════════

// Limits each IP to 100 requests per 15 minutes
// Stricter than admin API to protect user accounts
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,  // 15 minutes
  max:      Number(process.env.RATE_LIMIT_MAX) || 100,                   // 100 requests
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

// Log all HTTP requests in development environment (skip in tests)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK ENDPOINT
// ══════════════════════════════════════════════════════════════════════════════

// Used by Docker and load balancers to verify API is running
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'school-client-api' }));

// ══════════════════════════════════════════════════════════════════════════════
// API ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// Authentication routes (register, login, profile)
app.use('/api/auth',     authRoutes);

// Password recovery routes
app.use('/api/auth',     passwordResetRoutes);

// Fee management routes (balance, history, payments)
app.use('/api/fees',     feeRoutes);

// Academic records routes (grades, attendance, timetable)
app.use('/api/academic', academicRoutes);

// Parent-student linking routes
app.use('/api/linking',  linkingRoutes);

// ══════════════════════════════════════════════════════════════════════════════
// ERROR HANDLING MIDDLEWARE
// ══════════════════════════════════════════════════════════════════════════════

// Handle 404 - Route not found
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler (catches all errors from routes and controllers)
app.use(errorHandler);

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Client API running on port ${PORT}`));
};

if (require.main === module) {
  start();
}

module.exports = app; // for testing
