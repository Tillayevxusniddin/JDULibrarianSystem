import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError.js';

const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = 500;
  let message = 'An unexpected error occurred on the server';

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  } else {
    console.error('UNEXPECTED ERROR:', err);
  }

  res.status(statusCode).json({
    error: true,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export default errorMiddleware;
