import swaggerJsdoc from 'swagger-jsdoc';

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
  apis: ['./src/routes/*.ts', './src/entities/*.ts', './src/docs/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
