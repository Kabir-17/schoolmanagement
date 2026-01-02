import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../errors/AppError';
import config from '../config';

/**
 * Cast Error Handler (MongoDB ObjectId errors)
 */
const handleCastErrorDB = (err: mongoose.CastError): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(400, message);
};

/**
 * Duplicate Key Error Handler (MongoDB duplicate key errors)
 */
const handleDuplicateFieldsDB = (err: any): AppError => {
  const duplicateFields = Object.keys(err.keyValue).join(', ');
  const message = `Duplicate field value(s): ${duplicateFields}. Please use different value(s)`;
  return new AppError(400, message);
};

/**
 * Validation Error Handler (Mongoose validation errors)
 */
const handleValidationErrorDB = (err: any): AppError => {
  const errors = Object.values(err.errors).map((el: any) => {
    if (el && typeof el === 'object' && el.message) {
      return el.message;
    }
    return el ? el.toString() : 'Unknown validation error';
  });
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(400, message);
};

/**
 * JWT Error Handler
 */
const handleJWTError = (): AppError => 
  new AppError(401, 'Invalid token. Please log in again!');

/**
 * JWT Expired Error Handler
 */
const handleJWTExpiredError = (): AppError =>
  new AppError(401, 'Your token has expired! Please log in again.');

/**
 * Send Error Response for Development Environment
 */
const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send Error Response for Production Environment
 */
const sendErrorProd = (err: AppError, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Log Error for Monitoring/Debugging
 */
const logError = (err: AppError, req: Request) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
    params: req.params,
    query: req.query,
    userId: (req as any).user?.id,
    error: {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode,
      status: err.status,
      isOperational: err.isOperational,
      stack: config.node_env === 'development' ? err.stack : undefined,
    },
  };

  // In production, you might want to send this to a logging service
  console.error('ERROR LOG:', JSON.stringify(errorLog, null, 2));
};

/**
 * Handle Async Errors in Routes
 */
export const asyncErrorHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Global Error Handling Middleware
 */
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error for debugging/monitoring
  logError(err, req);

  if (config.node_env === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types in production
    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const message = `Can't find ${req.originalUrl} on this server!`;
  next(new AppError(404, message));
};

/**
 * Request Timeout Handler
 */
export const timeoutHandler = (timeout: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setTimeout(timeout, () => {
      const err = new AppError(408, 'Request timeout');
      next(err);
    });
    next();
  };
};

/**
 * Rate Limiting Error Handler
 */
export const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
    timestamp: new Date().toISOString(),
  });
};

/**
 * CORS Error Handler
 */
export const corsErrorHandler = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.get('Origin');
  const allowedOrigins = config.allowed_origins?.split(',') || ['http://localhost:3000'];

  if (origin && !allowedOrigins.includes(origin)) {
    return next(new AppError(403, `CORS policy: Origin ${origin} is not allowed`));
  }

  next();
};

/**
 * Security Headers Middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (config.node_env === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
};

/**
 * Request Logger Middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log request
  const requestLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
  };

  if (config.node_env === 'development') {
  }

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const responseLog = {
      ...requestLog,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    };

    if (config.node_env === 'development') {
    }
  });

  next();
};

/**
 * Validation Error Formatter
 */
export const formatValidationError = (errors: any[]): string => {
  return errors
    .map(err => {
      if (err.path && err.message) {
        return `${err.path}: ${err.message}`;
      }
      return err.message || err.toString();
    })
    .join(', ');
};

/**
 * Database Connection Error Handler
 */
export const handleDatabaseConnectionError = () => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    
    if (reason?.name === 'MongoError' || reason?.name === 'MongooseError') {
      console.error('Database connection error detected. Shutting down...');
      process.exit(1);
    }
  });

  process.on('uncaughtException', (err: Error) => {
    console.error('Uncaught Exception:', err.name, err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  });
};

/**
 * Graceful Shutdown Handler
 */
export const gracefulShutdown = (server: any) => {
  const shutdown = (signal: string) => {
    
    server.close(() => {
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

/**
 * Health Check Endpoint Handler
 */
export const healthCheck = (req: Request, res: Response) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.node_env,
    memory: process.memoryUsage(),
    version: process.version,
  };

  res.status(200).json(healthStatus);
};

// Export all error handling utilities
export default {
  globalErrorHandler,
  notFoundHandler,
  timeoutHandler,
  rateLimitHandler,
  corsErrorHandler,
  securityHeaders,
  requestLogger,
  asyncErrorHandler,
  formatValidationError,
  handleDatabaseConnectionError,
  gracefulShutdown,
  healthCheck,
};