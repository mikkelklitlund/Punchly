import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { Socket } from 'socket.io/dist/socket'
import { errorHandler } from './middleware/ErrorHandler'
import { PrismaClient } from '@prisma/client'
import { IAbsenceRecordRepository } from './interfaces/repositories/IAbsenceRecordRepository'
import { AbsenceRecordRepository } from './repositories/AbsenceRecordRepository'
import { IAttendanceRecordRepository } from './interfaces/repositories/IAttendanceRecordRepository'
import { AttendanceRecordRepository } from './repositories/AttendanceRecordRepository'
import { ICompanyRepository } from './interfaces/repositories/ICompanyRepository'
import { CompanyRepository } from './repositories/CompanyRepository'
import { IDepartmentRepository } from './interfaces/repositories/IDepartmentRepository'
import { DepartmentRepository } from './repositories/DepartmentRepository'
import { IEmployeeRepository } from './interfaces/repositories/IEmployeeRepositry'
import { EmployeeRepository } from './repositories/EmployeeRepository'
import { IEmployeeTypeRepository } from './interfaces/repositories/IEmployeeTypeRepository'
import { EmployeeTypeRepository } from './repositories/EmployeeTypeRepository'
import { IUserRepository } from './interfaces/repositories/IUserRepository'
import { UserRepository } from './repositories/UserRepository'
import { IAbsenceService } from './interfaces/services/IAbsenceService'
import { AbsenceService } from './services/AbsenceService'
import { IAttendanceService } from './interfaces/services/IAttendanceService'
import { AttendanceService } from './services/AttendanceService'
import { ICompanyService } from './interfaces/services/ICompanyService'
import { CompanyService } from './services/CompanyService'
import { IDepartmentService } from './interfaces/services/IDepartmentService'
import { DepartmentService } from './services/DepartmentService'
import { IEmployeeTypeService } from './interfaces/services/IEmployeeTypeService'
import { EmployeeTypeService } from './services/EmployeeTypeService'
import { IEmployeeService } from './interfaces/services/IEmployeeService'
import { EmployeeService } from './services/EmployeeService'
import { IUserService } from './interfaces/services/IUserService'
import { UserService } from './services/UserService'
import { AuthRoutes } from './routes/AuthRoute'
import { EmployeeRoutes } from './routes/EmployeeRoute'
import { EmployeePictureRoutes } from './routes/ProfilePictureUpload'

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
const absenceRepository: IAbsenceRecordRepository = new AbsenceRecordRepository(prismaClient)
const attendaceRepository: IAttendanceRecordRepository = new AttendanceRecordRepository(prismaClient)
const companyRepository: ICompanyRepository = new CompanyRepository(prismaClient)
const departmentRepository: IDepartmentRepository = new DepartmentRepository(prismaClient)
const employeeRepository: IEmployeeRepository = new EmployeeRepository(prismaClient)
const employeeTypeRepository: IEmployeeTypeRepository = new EmployeeTypeRepository(prismaClient)
const userRepository: IUserRepository = new UserRepository(prismaClient)

//Services
const absenceService: IAbsenceService = new AbsenceService(absenceRepository)
const attendaceService: IAttendanceService = new AttendanceService(attendaceRepository, employeeRepository)
const companyService: ICompanyService = new CompanyService(companyRepository)
const departmentService: IDepartmentService = new DepartmentService(departmentRepository)
const employeeTypeService: IEmployeeTypeService = new EmployeeTypeService(employeeTypeRepository)
const employeeService: IEmployeeService = new EmployeeService(
  employeeRepository,
  companyRepository,
  departmentRepository,
  employeeTypeRepository
)
const userService: IUserService = new UserService(userRepository)

//Routes
const authRoutes = new AuthRoutes(userService)
const employeeRoutes = new EmployeeRoutes(userService, employeeService)
const employeePictureRoutes = new EmployeePictureRoutes(employeeService)

app.use('/auth', authRoutes.router)
app.use('/employees', employeeRoutes.router)
app.use('/employees', employeePictureRoutes.router)

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
