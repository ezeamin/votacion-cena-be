import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

import { Server } from 'socket.io';
import { createServer } from 'node:http';

// Initializations
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Settings
const port = process.env.PORT ?? 3000;

// Middlewares
app.use(morgan('dev'));
app.use(cors());

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('disconnect', () => {
    console.log('a user disconnected');
  });

  socket.on('chat message', (message) => {
    console.log('message: ', message);
    io.emit('chat message', message);
  });
});

// Server
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
