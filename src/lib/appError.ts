export class AppError extends Error {
  readonly status: 'fail' | 'error';
  readonly isOperational = true;
  constructor(message: string, public readonly statusCode = 500) {
    super(message);
    this.status = statusCode < 500 ? 'fail' : 'error';
  }
}
