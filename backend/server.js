import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import authRoutes from './routes/auth.js';
import projectsRoutes from './routes/projects.js';
import entriesRoutes from './routes/entries.js';
import reportsRoutes from './routes/reports.js';
import settingsRoutes from './routes/settings.js';
import { initDb } from './db/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api', entriesRoutes);
app.use('/api', reportsRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Sunucu hatası' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadı' });
});

app.listen(PORT, async () => {
  await initDb();
  console.log(`Server running on http://localhost:${PORT}`);
});
