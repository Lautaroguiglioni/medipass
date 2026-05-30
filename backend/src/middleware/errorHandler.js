'use strict';

/**
 * Global error-handling middleware for the MediPass backend.
 *
 * Must be registered LAST in the Express middleware stack (4 arguments).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isDevelopment = (process.env.NODE_ENV || 'development') === 'development';

  // Log the error server-side
  console.error(`[ErrorHandler] ${req.method} ${req.originalUrl}`);
  console.error(err);

  // Determine HTTP status code
  const statusCode =
    typeof err.statusCode === 'number'
      ? err.statusCode
      : typeof err.status === 'number'
      ? err.status
      : 500;

  // Build response payload
  const payload = {
    status: statusCode,
    message: err.message || 'An unexpected error occurred.',
  };

  // Include stack trace only in development
  if (isDevelopment && err.stack) {
    payload.stack = err.stack;
  }

  // Surface Axios upstream errors for easier debugging
  if (err.response) {
    payload.upstream = {
      status: err.response.status,
      statusText: err.response.statusText,
      data: err.response.data,
    };
  }

  res.status(statusCode).json(payload);
}

module.exports = errorHandler;
