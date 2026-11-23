import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './socket/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const missing = ['MONGO_URI', 'JWT_SECRET'].filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  console.error('Copy server/.env.example to server/.env and set the values.');
  process.exit(1);
}

const port = Number(process.env.PORT) || 5000;
const origin = process.env.CLIENT_URL || 'http://localhost:5173';

const server = http.createServer(app);
const io = new Server(server, { cors: { origin, credentials: true } });
initSocket(io);

connectDB().then(() => {
  server.listen(port, () => {
    console.log(`API running at http://localhost:${port}`);
    console.log(`Socket.IO ready. Client origin: ${origin}`);
  });
});
