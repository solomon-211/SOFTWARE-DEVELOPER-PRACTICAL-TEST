require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');

// Register models that are referenced by population but not directly used in routes.
// AdminUser and Class live in the admin backend's collections; the client backend needs them
// registered so Mongoose can resolve population references.
require('./models/AdminUser');
require('./models/Class');

const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const authRoutes          = require('./routes/authRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const feeRoutes           = require('./routes/feeRoutes');
const academicRoutes      = require('./routes/academicRoutes');
const linkingRoutes       = require('./routes/linkingRoutes');

const errorHandler        = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'school-client-api' }));

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

module.exports = app;
