import express, { Application } from 'express';
import cors from 'cors';import authRouter from './routes/auth.router';
import errorHandler from './middleware/errorHandler';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use(express.json());

// Routes
app.use('/api/auth', authRouter);

// Global error handler
app.use(errorHandler);

export default app;