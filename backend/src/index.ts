const express = require('express');
const { createServer } = require('http');
import { Server } from 'socket.io';
import { Socket } from 'socket.io/dist/socket';
import { Request, Response } from 'express';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
    },
});

app.get('/', (req: Request, res: Response) => {
    res.send('Socket.IO with Express Backend');
});

io.on('connection', (socket: Socket) => {
    console.log('A client connected:', socket.id);

    socket.on('message', (data: string) => {
        console.log('Message received:', data);
        io.emit('message', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = 4000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
