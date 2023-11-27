import { io } from '../server';

let connectedUsers = 0;

export const socketHandler = (socket) => {
  console.log('a user connected');
  connectedUsers += 1;
  console.log('connected users: ', connectedUsers);

  socket.on('disconnect', () => {
    console.log('a user disconnected');
    connectedUsers -= 1;
  });

  socket.on('chat message', (message) => {
    console.log('message: ', message);
    io.emit('chat message', message);
  });

  if (!socket.recovered) {
    // Traer datos desde una DB
  }
};
