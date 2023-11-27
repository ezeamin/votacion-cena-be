import {
  onConnect,
  onDisconnect,
  onNewVote,
} from '../handlers/handlers.js';

export const socketHandler = async (socket) => {
  onConnect(socket);

  socket.on('disconnect', onDisconnect);

  socket.on('new vote', onNewVote);
};
