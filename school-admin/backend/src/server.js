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

const connectDB = require('./config/db');

const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const authRoutes          = require('./routes/authRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const deviceRoutes        = require('./routes/deviceRoutes');        // Device verification
const studentRoutes       = require('./routes/studentRoutes');       // Student CRUD & grades
const classRoutes         = require('./routes/classRoutes');         // Class management
const feeRoutes           = require('./routes/feeRoutes');           // Fee transactions
const feeScheduleRoutes   = require('./routes/feeScheduleRoutes');   // Fee schedule management
const dashboardRoutes     = require('./routes/dashboardRoutes');     // Statistics & reporting
const linkingRoutes       = require('./routes/linkingRoutes');       // Parent-student linking
const termRoutes          = require('./routes/termRoutes');          // Academic terms

const errorHandler        = require('./middlewares/errorHandler');   // Global error handler

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.ADMIN_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));

// Rate limiting protects admin login and high-value operations.
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,  // 15 minutes
  max:      Number(process.env.RATE_LIMIT_MAX) || 200,                   // 200 requests
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

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'school-admin-api' }));

// Swagger UI exposes the admin API contract for review and testing.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'School Admin API Docs',
  customCss: '.swagger-ui .topbar { background-color: #0f172a; }',
}));

app.use('/api/auth',          authRoutes);
app.use('/api/auth',          passwordResetRoutes);
app.use('/api/devices',       deviceRoutes);
app.use('/api/students',      studentRoutes);
app.use('/api/classes',       classRoutes);
app.use('/api/fees',          feeRoutes);
app.use('/api/fee-schedules', feeScheduleRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/linking',       linkingRoutes);
app.use('/api/terms',         termRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
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
