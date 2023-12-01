import { io } from '../server.js';

import VoteModel from '../models/VoteSchema.js';

let connectedUsers = 0;
let token = '';
let socket = null;

// initialize a 5 minute timer
let timer = 300;
let timerRunning = false;
let interval = null;

export const onConnect = async (_socket) => {
  socket = _socket;

  token = socket.handshake.auth.token;

  console.log('\n✨ New user connected ->', token);
  connectedUsers += 1;
  console.log('Connected users: ', connectedUsers, '\n');

  if (timerRunning) {
    io.to(socket.id).emit('timer', timer, token);
  } else {
    io.to(socket.id).emit('no timer', timer, token);
  }

  if (!socket.recovered) {
    try {
      const votes = await VoteModel.find().select(
        'king queen shouldCount -_id',
      );
      io.to(socket.id).emit('votes', votes, token);
    } catch (e) {
      console.log(e.message);
      io.to(socket.id).emit('error', e.message, token);
    }
  }
};

export const onDisconnect = () => {
  console.log('\n💨 One user disconnected ->', token);
  connectedUsers -= 1;
  console.log('Connected users: ', connectedUsers, '\n');
};

export const onNewVote = async (data) => {
  if (!timerRunning) {
    console.log('\n😳 Intento de voto fuera de tiempo ->', token, '\n');
    io.to(socket.id).emit('error', 'No estás en tiempo de votación!', token);
    return;
  }

  try {
    const newVote = new VoteModel({
      king: data.king,
      queen: data.queen,
      token,
      shouldCount: true,
    });

    await newVote.save();
  } catch (e) {
    console.log(e.message);
    if (e.message.includes('duplicate')) {
      console.log('\n😳 Intento de voto duplicado ->', token);

      io.emit('error', 'Ya votaste!', token);
      return;
    }

    io.emit('error', e.message, token);
    return;
  }

  console.log('\n🎉 New vote registered! ->', data, ' -> ', token, '\n');

  io.emit('success', token);

  try {
    const votes = await VoteModel.find().select('king queen shouldCount -_id');
    io.emit('votes', votes, token);
  } catch (e) {
    console.log(e.message);
    io.to(socket.id).emit('error', e.message, token);
  }
};

export const onUntie = async (data) => {
  const { type, person } = data;

  try {
    const newVote = new VoteModel({
      king: type === 'king' ? person : undefined,
      queen: type === 'queen' ? person : undefined,
      token: 'UNTIE',
      shouldCount: false,
    });

    await newVote.save();
  } catch (e) {
    console.log(e.message);
    io.to(socket.id).emit('error', e.message, token);
  }

  try {
    const votes = await VoteModel.find().select('king queen shouldCount -_id');
    io.emit('votes', votes);
  } catch (e) {
    console.log(e.message);
    io.to(socket.id).emit('error', e.message, token);
  }
};

export const onNewTimer = () => {
  if (timerRunning) {
    io.to(socket.id).emit('error', 'El timer ya está corriendo!', token);
    return;
  }

  console.log('\n⏱  Timer started!\n');

  timerRunning = true;

  io.emit('timer', timer, token);

  // create a new interval - emit every 10 seconds
  interval = setInterval(() => {
    timer -= 20;
    if (timer <= 0) {
      timer = 300;
      timerRunning = false;
      console.log('\n⏱ Timer finished!\n');
      io.emit('no timer', timer, token);
      io.emit('timer finished', timer, token);
      clearInterval(interval);
      return;
    }
    io.emit('timer', timer, token);
  }, 20000);
};

export const onTerminateTimer = () => {
  if (!timerRunning) {
    io.to(socket.id).emit('error', 'El timer no está corriendo!', token);
    return;
  }

  console.log('\n⏱ Timer terminated!\n');

  timer = 300;
  timerRunning = false;

  clearInterval(interval);

  io.emit('no timer', timer, token);
  io.emit('timer finished', timer, token);
};
