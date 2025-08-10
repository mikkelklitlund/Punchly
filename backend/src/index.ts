import express from 'express'
import { createServer } from 'http'
import { errorHandler } from './middleware/ErrorHandler.js'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './swagger.js'
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

dotenv.config()

const app = express()
const FRONTEND_ORIGIN = process.env.CLIENT_URL ?? 'http://localhost:5173'

app.set('trust proxy', 1)

const corsOptions: cors.CorsOptions = {
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(cookieParser())
app.use(express.json())
const httpServer = createServer(app)

//Prisma
const prismaClient: PrismaClient = new PrismaClient()

//Repos
const repositoryContainer: RepositoryContainer = new RepositoryContainer(prismaClient)

//Services
const serviceContainer = new ServiceContainer(repositoryContainer)

//Routes
const authRoutes = new AuthRoutes(serviceContainer.userService)
const employeeRoutes = new EmployeeRoutes(
  serviceContainer.userService,
  serviceContainer.employeeService,
  serviceContainer.attendanceService
)
const employeePictureRoutes = new EmployeePictureRoutes(serviceContainer.employeeService, serviceContainer.userService)
const companyRoutes = new CompanyRoutes(
  serviceContainer.companyService,
  serviceContainer.employeeService,
  serviceContainer.departmentService,
  serviceContainer.userService,
  serviceContainer.employeeTypeService
)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use('/api/auth', authRoutes.router)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.use('/api/employees', employeeRoutes.router)
app.use('/api/employees', employeePictureRoutes.router)
app.use('/api/companies', companyRoutes.router)

app.use(errorHandler)

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

const PORT = process.env.PORT

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
