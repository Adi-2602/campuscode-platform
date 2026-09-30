const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CampusCode API Documentation",
      version: "1.0.0",
      description: "API documentation for CampusCode backend"
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },

  apis: [
    path.join(__dirname, "../routes/**/*.js") // ✅ FIX
  ]
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
