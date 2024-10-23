import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { Socket } from 'socket.io/dist/socket'
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

const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
})

//Prisma
const prismaClient: PrismaClient = new PrismaClient()

//Repos
const repositoryContainer: RepositoryContainer = new RepositoryContainer(prismaClient)

//Services
const serviceContainer = new ServiceContainer(repositoryContainer)

//Routes
const authRoutes = new AuthRoutes(serviceContainer.userService)
const employeeRoutes = new EmployeeRoutes(serviceContainer.userService, serviceContainer.employeeService)
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

//Socket
io.on('connection', (socket: Socket) => {
  console.log('A client connected:', socket.id)

  socket.on('message', (data: string) => {
    console.log('Message received:', data)
    io.emit('message', data)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

app.use(errorHandler)

const PORT = 4000
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
