const { celebrator, Joi, Segments } = require('celebrate');

const celebrate = celebrator(
  {},
  { abortEarly: false, errors: { label: false } }
);

module.exports = { celebrate, Joi, Segments };
