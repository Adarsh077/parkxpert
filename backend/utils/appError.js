class AppError extends Error {
  constructor(message, statusCode) {
    message = typeof message === 'object' ? JSON.stringify(message) : message;

    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
