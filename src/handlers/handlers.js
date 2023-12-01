import { io } from '../server.js';

import VoteModel from '../models/VoteSchema.js';

let connectedUsers = 0;
let address = '';
let token = '';
let socket = null;

export const onConnect = async (_socket) => {
  socket = _socket;

  address = socket.request.connection.remoteAddress;
  token = socket.handshake.auth.token;

  console.log('\n✨ New user connected ->', address);
  connectedUsers += 1;
  console.log('Connected users: ', connectedUsers, '\n');

  if (!socket.recovered) {
    try {
      const votes = await VoteModel.find().select('king queen shouldCount -_id');
      io.to(socket.id).emit('votes', votes);
    } catch (e) {
      io.to(socket.id).emit('error', e.message);
    }
  }
};

export const onDisconnect = () => {
  console.log('\n💨 One user disconnected ->', address);
  connectedUsers -= 1;
  console.log('Connected users: ', connectedUsers, '\n');
};

export const onNewVote = async (data) => {
  try {
    const newVote = new VoteModel({
      king: data.king,
      queen: data.queen,
      token,
      ip: address,
      shouldCount: true,
    });

    await newVote.save();
  } catch (e) {
    if (e.message.includes('duplicate')) {
      console.log('\n😳 Intento de voto duplicado ->', address);

      io.to(socket.id).emit('error', 'Ya votaste!');
      return;
    }

    io.to(socket.id).emit('error', e.message);
    return;
  }

  console.log('\n🎉 New vote registered! ->', data, '\n');

  io.to(socket.id).emit('success');

  try {
    const votes = await VoteModel.find().select('king queen shouldCount -_id');
    io.emit('votes', votes);
  } catch (e) {
    io.to(socket.id).emit('error', e.message);
  }
};

export const onUntie = async (data) => {
  const { type, person } = data;

  try {
    const newVote = new VoteModel({
      king: type === 'king' ? person : undefined,
      queen: type === 'queen' ? person : undefined,
      token: 'UNTIE',
      ip: 'UNTIE',
      shouldCount: false,
    });

    await newVote.save();
  } catch (e) {
    io.to(socket.id).emit('error', e.message);
  }

  try {
    const votes = await VoteModel.find().select('king queen shouldCount -_id');
    io.emit('votes', votes);
  } catch (e) {
    io.to(socket.id).emit('error', e.message);
  }
};
