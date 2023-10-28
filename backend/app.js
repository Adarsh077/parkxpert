const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const AppError = require('./utils/appError');
const { errorController, parkingController } = require('./controllers');

const app = express();

/* MIDDLEWARES 👇 */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(cors());

app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  parkingController.webhook
);

app.use(express.json());

/* Routes 🎯 */
app.use('/', require('./routes'));

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

/* Error handling 💥 */
app.use(errorController);

module.exports = app;
