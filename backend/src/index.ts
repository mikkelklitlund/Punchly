import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import { createServer } from 'http'
import { errorHandler } from './middleware/ErrorHandlerMiddleware.js'
import { PrismaClient } from '@prisma/client'
import cors from 'cors'
import { RepositoryContainer } from './repositories/RepositoryContainer.js'
import { ServiceContainer } from './services/ServiceContainer.js'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { attachPrismaLogging } from './prisma-logging.js'
import { AuthController } from './controllers/authController.js'
import { CompanyController } from './controllers/companyController.js'
import { EmployeeController } from './controllers/employeeController.js'
import { createAuthRoutes } from './routes/AuthRoute.js'
import { createCompanyRoutes } from './routes/CompanyRoute.js'
import { createEmployeeRoutes } from './routes/EmployeeRoute.js'
import { AdminController } from './controllers/adminController.js'
import { createAdminRoutes } from './routes/adminRoute.js'
import { initializeLogger } from './logger.js'
import { createHttpLogger } from './middleware/loggingMiddleware.js'

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production'

  const { logger } = await initializeLogger()

  const app = express()
  app.use(createHttpLogger(logger))

  const FRONTEND_ORIGIN = process.env.CLIENT_URL ?? 'http://localhost:5173'

  if (!isProd)
    app.use((req, res, next) => {
      const start = process.hrtime.bigint()
      res.on('finish', () => {
        const ms = Number(process.hrtime.bigint() - start) / 1e6
        req.log?.debug({ durationMs: ms }, 'Request complete')
      })
      next()
    })

  app.set('trust proxy', 1)

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
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
    errorFormat: 'minimal',
  })

  attachPrismaLogging(prismaClient, logger)

  // Initialize containers
  const repositoryContainer = new RepositoryContainer(prismaClient)
  const serviceContainer = new ServiceContainer(repositoryContainer, logger)

  // Auth
  const authController = new AuthController(serviceContainer.userService)
  const authRouter = createAuthRoutes(authController, serviceContainer.userService)

  const adminController = new AdminController(serviceContainer.companyService)
  const adminRouter = createAdminRoutes(adminController, serviceContainer.userService)

  const companyController = new CompanyController(
    serviceContainer.companyService,
    serviceContainer.employeeService,
    serviceContainer.departmentService,
    serviceContainer.userService,
    serviceContainer.employeeTypeService,
    serviceContainer.absenceTypeService,
    serviceContainer.attendanceService
  )
  const companyRouter = createCompanyRoutes(companyController, serviceContainer.userService)

  const employeeController = new EmployeeController(
    serviceContainer.employeeService,
    serviceContainer.attendanceService,
    serviceContainer.absenceService
  )

  const employeeRouter = createEmployeeRoutes(employeeController, serviceContainer.userService)

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  app.use('/api/auth', authRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/companies', companyRouter)

  const uploadsDir = path.join(process.cwd(), 'uploads')

  app.use(
    '/api/uploads',
    express.static(uploadsDir, {
      dotfiles: 'deny',
      fallthrough: false,
    })
  )

  app.use('/api/employees', employeeRouter)

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

  if (isProd) {
    const backendRoot = path.join(__dirname, '..', '..')
    const frontendPath = path.join(backendRoot, 'public')

    app.use(express.static(frontendPath))

    app.use((req, res, next) => {
      if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
        const indexHtml = path.join(frontendPath, 'index.html')

        if (existsSync(indexHtml)) {
          res.sendFile(indexHtml)
        } else {
          res.status(404).send('Frontend not found (index.html is missing)')
        }
      } else {
        next()
      }
    })
  }

  app.use(errorHandler)

  const gracefulShutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown')

    httpServer.close(async (err) => {
      if (err) {
        logger.error({ error: err }, 'Error during server shutdown')
      }

      try {
        await prismaClient.$disconnect()
        logger.info('Database connection closed')
        logger.info('Graceful shutdown completed')

        logger.flush()

        process.exit(err ? 1 : 0)
      } catch (error) {
        logger.error({ error }, 'Error during database disconnect')
        logger.flush()
        process.exit(1)
      }
    })

    setTimeout(() => {
      logger.error('Forced shutdown after timeout')
      logger.flush()
      process.exit(1)
    }, 30000)
  }

  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

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
}

startServer().catch((error) => {
  console.error('Fatal error during server startup:', error)
  process.exit(1)
})
