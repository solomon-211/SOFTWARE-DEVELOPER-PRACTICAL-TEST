const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'School Management System — Client API',
      version: '1.0.0',
      description: 'REST API for the parent/student portal. Handles registration, login, fee payments, and academic records.',
      contact: { name: 'Elevanda Ventures', email: 'careers@elevandaventures.com' },
    },
    servers: [{ url: 'http://localhost:5001', description: 'Development server' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        deviceId: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Device-ID',
          description: 'Device ID generated client-side. Must be verified by admin.',
        },
      },
      schemas: {
        RegisterRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password', 'deviceId'],
          properties: {
            firstName: { type: 'string', example: 'John' },
            lastName:  { type: 'string', example: 'Doe' },
            email:     { type: 'string', format: 'email' },
            phone:     { type: 'string', example: '+250 788 000 000' },
            password:  { type: 'string', minLength: 8 },
            role:      { type: 'string', enum: ['student', 'parent'], default: 'parent' },
            deviceId:  { type: 'string', description: 'Unique device identifier' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password', 'deviceId'],
          properties: {
            email:    { type: 'string', format: 'email' },
            password: { type: 'string' },
            deviceId: { type: 'string' },
          },
        },
        FeeDeposit: {
          type: 'object',
          required: ['amount', 'proof'],
          properties: {
            amount:      { type: 'number', minimum: 0.01, example: 50000 },
            description: { type: 'string', example: 'Term 1 tuition fees' },
            proof: {
              type: 'object',
              required: ['type', 'value'],
              properties: {
                type:     { type: 'string', enum: ['link', 'file'] },
                value:    { type: 'string', description: 'URL or base64 data URI' },
                mimeType: { type: 'string', example: 'application/pdf' },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [], deviceId: [] }],
    tags: [
      { name: 'Auth',     description: 'Registration, login, password reset' },
      { name: 'Fees',     description: 'Fee balance, deposits, withdrawals' },
      { name: 'Academic', description: 'Grades, attendance, timetable' },
      { name: 'Linking',  description: 'Parent-child account linking' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
