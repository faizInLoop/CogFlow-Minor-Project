import express from 'express';
import cors from 'cors';
import { connectDb } from './db.js';
import { seedDefaultUser } from './models.js';
import routes from './routes.js';

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
app.listen(port, '127.0.0.1', () => {
  console.log(`[CogFlow] MERN API on http://127.0.0.1:${port} (database: ${db.mode})`);
});
