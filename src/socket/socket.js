import {
  onConnect,
  onDisconnect,
  onNewTimer,
  onNewVote,
  onUntie,
} from '../handlers/handlers.js';

export const socketHandler = async (socket) => {
  onConnect(socket);

  socket.on('disconnect', onDisconnect);

  socket.on('new vote', onNewVote);

  socket.on('new random winner', onUntie);

  socket.on('start timer', onNewTimer);
};
