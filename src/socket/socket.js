import {
  onConnect,
  onDisconnect,
  onNewTimer,
  onNewVote,
  onTerminateTimer,
  onUntie,
} from '../handlers/handlers.js';

export const socketHandler = async (socket) => {
  onConnect(socket);

  socket.on('disconnect', (data) => onDisconnect(socket, data));

  socket.on('new vote', (data) => onNewVote(socket, data));

  socket.on('new random winner', (data) => onUntie(socket, data));

  socket.on('start timer', (data) => onNewTimer(socket, data));

  socket.on('stop timer', (data) => onTerminateTimer(socket, data));
};
