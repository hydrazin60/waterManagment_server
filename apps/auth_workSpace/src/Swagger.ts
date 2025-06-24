// src/swagger.ts
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express"; // ✅ Import the type

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Water Management API",
      version: "1.0.0",
      description:
        "Professional API documentation for the Water Management System",
    },
    servers: [
      {
        url: "http://localhost:5000/api/v1/Ad_water-supply",
        description: "Development server",
      },
    ],
  },
  apis: ["./routes/**/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export const swaggerDocs = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
