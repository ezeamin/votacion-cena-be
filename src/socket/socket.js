import {
  onConnect,
  onDisconnect,
  onNewVote,
  onUntie,
} from '../handlers/handlers.js';

export const socketHandler = async (socket) => {
  onConnect(socket);

  socket.on('disconnect', onDisconnect);

  socket.on('new vote', onNewVote);

  socket.on('new random winner', onUntie);
};
