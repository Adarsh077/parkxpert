const { celebrate, Joi, Segments } = require('../utils/celebrate');

exports.createTodo = celebrate({
  [Segments.BODY]: Joi.object().keys({
    userId: Joi.string().required(),
    title: Joi.string().required(),
    description: Joi.string().required(),
  }),
});

exports.getAllTodo = celebrate({
  [Segments.QUERY]: Joi.object().keys({
    userId: Joi.string().required(),
  }),
});
