const { isCelebrateError } = require('celebrate');

const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleCelebrateError = (err) => {
  const errors = {};

  // eslint-disable-next-line no-restricted-syntax
  for (const [key] of err.details) {
    // eslint-disable-next-line no-loop-func
    err.details.get(key).details.forEach((joiErr) => {
      if (joiErr.path.length === 1) {
        errors[joiErr.context.key] = `${joiErr.context.key} ${joiErr.message}`;
      } else {
        errors[
          joiErr.path.join('.')
        ] = `${joiErr.context.key} ${joiErr.message}`;
      }
    });
  }

  return new AppError(errors, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendError = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    let { message } = err;
    try {
      message = JSON.parse(message);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('String Error');
    }

    res.status(err.statusCode).json({
      status: err.status,
      message: message,
    });

    // Programming or other unknown error: don't leak error details
  } else {
    // 1) Log error
    // eslint-disable-next-line no-console
    console.error('ERROR 💥', err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };

  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
  if (isCelebrateError(error)) error = handleCelebrateError(error);

  sendError(error, res);
};
