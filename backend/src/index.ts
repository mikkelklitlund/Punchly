import express from 'express'
import { createServer } from 'http'
import { errorHandler } from './middleware/ErrorHandler'
import { PrismaClient } from '@prisma/client'
import { AuthRoutes } from './routes/AuthRoute'
import { EmployeeRoutes } from './routes/EmployeeRoute'
import { EmployeePictureRoutes } from './routes/ProfilePictureUpload'
import { CompanyRoutes } from './routes/CompanyRoute'
import { RepositoryContainer } from './repositories/RepositoryContainer.'
import { ServiceContainer } from './services/ServiceContainer'

const app = express()
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
const employeePictureRoutes = new EmployeePictureRoutes(serviceContainer.employeeService)
const companyRoutes = new CompanyRoutes(
  serviceContainer.companyService,
  serviceContainer.employeeService,
  serviceContainer.userService
)

app.use('/api/auth', authRoutes.router)
app.use('/api/employees', employeeRoutes.router)
app.use('/api/employees', employeePictureRoutes.router)
app.use('/api/companies', companyRoutes.router)

app.use(errorHandler)

const PORT = 4000
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
