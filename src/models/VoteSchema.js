import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  king: String,
  queen: String,
  token: {
    type: String,
    required: true,
    unique: true,
  },
  shouldCount: Boolean,
});

export default mongoose.model('Votes', voteSchema);
