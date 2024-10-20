import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { Socket } from 'socket.io/dist/socket'
import { Request, Response } from 'express'
import { errorHandler } from './middleware/ErrorHandler'
import employeeRoute from './routes/EmployeeRoute'
import authRoute from './routes/AuthRoute'

const app = express()
app.use(express.json())
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
})

app.use('/api/auth', authRoute)
app.use('/api/employees', employeeRoute)

app.get('/', (req: Request, res: Response) => {
  res.send('Socket.IO with Express Backend')
})

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
