import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

let version = '1.0.0';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: version,
      description: "API de l'application HIGH Referrence Test Recrutement.",
      contact: {
        name: "Support Technique",
        email: "support@example.com"
      }
    },
    servers: [
      {
        url: "https://backendhighreference-production.up.railway.app/",
        description: "Serveur de développement"
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
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./src/routes/*.ts', './src/modeles/*.ts'], // Notez 'modeles' au lieu de 'models'
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerSpec, swaggerUi };