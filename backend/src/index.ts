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
const corsOptions = {
  origin: ['http://localhost:4173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}
app.use(cookieParser())
app.use(express.json())
app.use(cors(corsOptions))
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
  serviceContainer.userService
)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use('/api/auth', authRoutes.router)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/api/employees', employeeRoutes.router)
app.use('/api/employees', employeePictureRoutes.router)
app.use('/api/companies', companyRoutes.router)

app.use(errorHandler)

console.log(JSON.stringify(swaggerSpec, null, 2))

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

const PORT = 4000

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
