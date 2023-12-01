import { io } from '../server.js';

import VoteModel from '../models/VoteSchema.js';

let connectedUsers = 0;
let address = '';
let token = '';
let socket = null;

// initialize a 5 minute timer
let timer = 301;

export const onConnect = async (_socket) => {
  socket = _socket;

  address = socket.request.connection.remoteAddress;
  token = socket.handshake.auth.token;

  console.log('\n✨ New user connected ->', address);
  connectedUsers += 1;
  console.log('Connected users: ', connectedUsers, '\n');

  if (timer !== 301) {
    io.to(socket.id).emit('timer', timer);
  }

  if (!socket.recovered) {
    try {
      const votes = await VoteModel.find().select(
        'king queen shouldCount -_id',
      );
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
  if (timer <= 0) {
    io.to(socket.id).emit('error', 'El tiempo de votación terminó!');
    return;
  }

  if (timer === 301) {
    io.to(socket.id).emit(
      'error',
      'El tiempo de votación aún no ha comenzado!',
    );
    return;
  }

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

export const onNewTimer = async () => {
  io.emit('timer', timer);

  if (timer !== 301) {
    io.to(socket.id).emit('error', 'El timer ya está corriendo!');
    return;
  }

  console.log('\n⏱ Timer started!\n');

  timer = 300;

  // create a new interval - emit every 10 seconds
  const interval = setInterval(() => {
    timer -= 20;
    if (timer <= 20) {
      timer = 301;
      console.log('\n⏱ Timer finished!\n');
      io.emit('timer finished', timer);
      clearInterval(interval);
    }
    io.emit('timer', timer);
  }, 20000);
};
