import morgan from 'morgan';
import cors from 'cors';

import { socketHandler } from './socket/socket.js';
import { app, io, server } from './server.js';

import './database/database.js';

// Settings
const port = process.env.PORT || 3000;

// Middlewares
app.use(morgan('dev'));
app.use(cors());

// Websocket
io.on('connection', socketHandler);

// Server loop
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
