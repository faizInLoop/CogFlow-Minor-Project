import express from 'express';
import cors from 'cors';
import { connectDb } from './db.js';
import { seedDefaultUser } from './models.js';
import routes from './routes.js';

process.on('unhandledRejection', (error) => {
  console.error('[CogFlow] Unhandled rejection:', error);
});

const app = express();
const port = Number(process.env.PORT || 8000);

app.use(cors({
  origin(origin, callback) {
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin is not allowed'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use(routes);
app.use((error, _req, res, _next) => {
  if (error?.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ detail: 'File exceeds the 10 MB upload limit.' });
    return;
  }
  console.error(error);
  res.status(500).json({ detail: 'CogFlow could not complete that request.' });
});

const db = await connectDb();
await seedDefaultUser();
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`[CogFlow] MERN API on http://127.0.0.1:${port} (database: ${db.mode})`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[CogFlow] Port ${port} is already in use. Stop the existing CogFlow process or use a different PORT.`);
    process.exitCode = 1;
    return;
  }
  console.error('[CogFlow] API server failed to start:', error);
  process.exitCode = 1;
});
