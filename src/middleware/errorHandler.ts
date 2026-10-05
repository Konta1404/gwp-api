import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/appError';
const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ status: 'fail', message: 'Invalid input.', errors: error.flatten().fieldErrors });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ status: error.status, message: error.message });
    return;
  }
  if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
    res.status(400).json({ status: 'fail', message: 'Invalid JSON.' }); return;
  }
  console.error('Unhandled API error', error);
  res.status(500).json({ status: 'error', message: 'An unexpected error occurred.' });
};
export default errorHandler;
