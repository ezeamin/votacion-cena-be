import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  person: String,
  token: {
    type: String,
    required: true,
    unique: true,
  },
  shouldCount: Boolean,
});

export default mongoose.model('Picassos', voteSchema);
