import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  general: {
    type: String,
    required: true,
  },
  office: {
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
