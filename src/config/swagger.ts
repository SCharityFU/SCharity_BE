import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

// In production (Docker), __filename ends with .js and files are under dist/
// In development, __filename ends with .ts and files are under src/
const ext = __filename.endsWith('.js') ? 'js' : 'ts';
const apiBase = path.join(__dirname, '..');

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'S Charity API',
      version: '1.0.0',
      description: 'S Charity - Charity Fundraising Platform API Documentation',
      contact: {
        name: 'S Charity Team',
        email: 'dev@scharity.vn',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api/v1`,
        description: 'Development Server',
      },
      {
        url: `https://scharity-backend.onrender.com/api/v1`,
        description: 'Staging Server',
      },
      {
        url: 'https://api.scharity.vn/api/v1',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(apiBase, `routes/*.${ext}`),
    path.join(apiBase, `entities/*.${ext}`),
    path.join(apiBase, `docs/*.${ext}`),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
