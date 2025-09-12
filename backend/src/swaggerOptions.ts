import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API Docs',
      version: '1.0.0',
      description: 'Automatically generated Swagger docs',
    },
    servers: [
      {
        url: `${process.env.API_BASE_URL ?? 'http://localhost:4000'}/api`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [path.resolve(__dirname, 'routes/**/*.ts')],
}
