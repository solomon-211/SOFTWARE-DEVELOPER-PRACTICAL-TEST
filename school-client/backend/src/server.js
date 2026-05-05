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

const connectDB = require('./config/db');

const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const authRoutes          = require('./routes/authRoutes');           // Login, register, profile
const passwordResetRoutes = require('./routes/passwordResetRoutes');   // Password reset flows
const feeRoutes           = require('./routes/feeRoutes');            // Fee balance, deposits, withdrawals
const academicRoutes      = require('./routes/academicRoutes');       // Grades, attendance, timetable
const linkingRoutes       = require('./routes/linkingRoutes');        // Linking requests

const errorHandler        = require('./middlewares/errorHandler');    // Global error handler

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Rate limiting protects sign-in and payment endpoints from brute-force abuse.
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,  // 15 minutes
  max:      Number(process.env.RATE_LIMIT_MAX) || 100,                   // 100 requests
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'school-client-api' }));

// Swagger UI exposes the client API contract for testing and handoff.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'School Client API Docs',
  customCss: '.swagger-ui .topbar { background-color: #0f172a; }',
}));

app.use('/api/auth',     authRoutes);
app.use('/api/auth',     passwordResetRoutes);
app.use('/api/fees',     feeRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/linking',  linkingRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Client API running on port ${PORT}`));
};

if (require.main === module) {
  start();
}

module.exports = app; // for testing
