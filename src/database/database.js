import mongoose from 'mongoose';

const { MONGO_URI } = process.env;

mongoose.set('strictQuery', true);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('DB conectada');
  })
  .catch((err) => {
    console.log(`DB ERROR: ${err}`);
  });
