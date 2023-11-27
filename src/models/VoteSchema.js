import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  king: {
    type: String,
    required: true,
  },
  queen: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  ip: {
    type: String,
    required: true,
    unique: true,
  },
});

export default mongoose.model('Votes', voteSchema);
