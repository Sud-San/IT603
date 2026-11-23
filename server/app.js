import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.js';

const app = express();
const origin = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({ origin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
