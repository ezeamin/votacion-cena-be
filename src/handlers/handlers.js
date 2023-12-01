import { io } from '../server.js';

import VoteModel from '../models/VoteSchema.js';

let connectedUsers = 0;
let address = '';
let token = '';
let socket = null;

// initialize a 5 minute timer
let timer = 300;
let timerRunning = false;

export const onConnect = async (_socket) => {
  socket = _socket;

  address = socket.request.connection.remoteAddress;
  token = socket.handshake.auth.token;

  console.log('\n✨ New user connected ->', address);
  connectedUsers += 1;
  console.log('Connected users: ', connectedUsers, '\n');

  if (timerRunning) {
    io.to(socket.id).emit('timer', timer);
  } else {
    io.to(socket.id).emit('no timer', timer);
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
  if (!timerRunning) {
    io.to(socket.id).emit(
      'error',
      'No estás en tiempo de votación!',
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
  if (timer !== 301) {
    io.to(socket.id).emit('error', 'El timer ya está corriendo!');
    return;
  }

  console.log('\n⏱ Timer started!\n');

  timerRunning = true;

  io.emit('timer', timer);

  // create a new interval - emit every 10 seconds
  const interval = setInterval(() => {
    timer -= 20;
    if (timer <= 0) {
      timer = 300;
      console.log('\n⏱ Timer finished!\n');
      io.emit('no timer', timer);
      io.emit('timer finished', timer);
      clearInterval(interval);
    }
    io.emit('timer', timer);
  }, 20000);
};
