import express from 'express';
import { connectDB } from './config/database';
import noteRoutes from './routes/note.routes';
import authRoutes from './routes/auth.routes';
import tagRoutes from './routes/tag.routes';
import FolderRoutes from './routes/folder.routes';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(cors());
// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Connect to DB
connectDB();

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/folders', FolderRoutes);
app.use('/api/tags', tagRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});