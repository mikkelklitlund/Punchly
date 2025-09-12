import express from 'express'
import { createServer } from 'http'
import { errorHandler } from './middleware/ErrorHandler.js'
import swaggerUi from 'swagger-ui-express'
import { PrismaClient } from '@prisma/client'
import { AuthRoutes } from './routes/AuthRoute.js'
import cors from 'cors'
import { EmployeeRoutes } from './routes/EmployeeRoute.js'
import { EmployeePictureRoutes } from './routes/ProfilePictureUpload.js'
import { CompanyRoutes } from './routes/CompanyRoute.js'
import { RepositoryContainer } from './repositories/RepositoryContainer.js'
import { ServiceContainer } from './services/ServiceContainer.js'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync, readFileSync } from 'fs'
import { httpLogger } from './middleware/logging.js'
import { logger } from './logger.js'
import { attachPrismaLogging } from './prisma-logging.js'

dotenv.config()

const isProd = process.env.NODE_ENV === 'production'

const app = express()
const FRONTEND_ORIGIN = process.env.CLIENT_URL ?? 'http://localhost:5173'

// Request logging middleware
app.use(httpLogger)
if (!isProd)
  app.use((req, res, next) => {
    const start = process.hrtime.bigint()
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6
      req.log?.debug({ durationMs: ms }, 'Request complete')
    })
    next()
  })

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1)

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Correlation-ID', 'X-Requested-With'],
}
app.use(cors(corsOptions))
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))

const httpServer = createServer(app)

const prismaClient = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
    ...(isProd ? [] : [{ level: 'query', emit: 'event' } as const]),
  ],
  errorFormat: 'pretty',
})
attachPrismaLogging(prismaClient)

// Initialize containers
const repositoryContainer = new RepositoryContainer(prismaClient)
const serviceContainer = new ServiceContainer(repositoryContainer)

const authRoutes = new AuthRoutes(serviceContainer.userService)
const employeeRoutes = new EmployeeRoutes(
  serviceContainer.userService,
  serviceContainer.employeeService,
  serviceContainer.attendanceService,
  serviceContainer.absenceService
)
const employeePictureRoutes = new EmployeePictureRoutes(serviceContainer.employeeService, serviceContainer.userService)
const companyRoutes = new CompanyRoutes(
  serviceContainer.companyService,
  serviceContainer.employeeService,
  serviceContainer.departmentService,
  serviceContainer.userService,
  serviceContainer.employeeTypeService,
  serviceContainer.absenceTypeService
)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Routes
app.use('/api/auth', authRoutes.router)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/api/employees', employeeRoutes.router)
app.use('/api/employees', employeePictureRoutes.router)
app.use('/api/companies', companyRoutes.router)

app.get('/health', async (req, res) => {
  try {
    await prismaClient.$queryRaw`SELECT 1`

    const healthInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      requestId: req.id,
    }

    res.status(200).json(healthInfo)
  } catch (error) {
    logger.error({ error }, 'Health check failed')
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      requestId: req.id,
    })
  }
})

let swaggerDoc: swaggerUi.JsonObject
const candidates = [path.join(__dirname, '../openapi.json'), path.join(__dirname, '../dist/openapi.json')]
const existing = candidates.find((p) => existsSync(p))

if (existing) {
  swaggerDoc = JSON.parse(readFileSync(existing, 'utf-8'))
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc))
}

app.use(errorHandler)

const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown')

  httpServer.close(async (err) => {
    if (err) {
      logger.error({ error: err }, 'Error during server shutdown')
      process.exit(1)
    }

    try {
      await prismaClient.$disconnect()
      logger.info('Database connection closed')
      logger.info('Graceful shutdown completed')
      process.exit(0)
    } catch (error) {
      logger.error({ error }, 'Error during database disconnect')
      process.exit(1)
    }
  })

  setTimeout(() => {
    logger.error('Forced shutdown after timeout')
    process.exit(1)
  }, 30000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

const PORT = process.env.PORT || 3000

httpServer.listen(PORT, () => {
  logger.info(
    {
      port: PORT,
      env: process.env.NODE_ENV,
      cors: FRONTEND_ORIGIN,
    },
    'Server started successfully'
  )
})
