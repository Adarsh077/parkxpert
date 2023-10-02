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
app.use(express.json());

app.post('/webhook', parkingController.webhook);

/* Routes 🎯 */
app.use('/', require('./routes'));

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

/* Error handling 💥 */
app.use(errorController);

module.exports = app;
