import { io } from '../server.js';

import VoteModel from '../models/VoteSchema.js';

let connectedUsers = 0;
let address = '';
let socket = null;

export const onConnect = async (_socket) => {
  socket = _socket;
  address = socket.request.connection.remoteAddress;

  console.log('\n✨ New user connected ->', address);
  connectedUsers += 1;
  console.log('Connected users: ', connectedUsers, '\n');

  const remoteUrl = socket.request.headers.referer;

  if (!socket.recovered && remoteUrl.includes('results')) {
    try {
      const votes = await VoteModel.find();
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
  console.log('\n🎉 New vote registered! ->', data, '\n');

  try {
    const newVote = new VoteModel({
      general: data.general,
      office: data.office,
      token: data.token,
      ip: address,
    });

    await newVote.save();
  } catch (e) {
    if (e.message.includes('duplicate')) {
      io.to(socket.id).emit('error', 'Ya votaste!');
      return;
    }

    io.to(socket.id).emit('error', e.message);
    return;
  }

  io.emit('new vote', data);
};
