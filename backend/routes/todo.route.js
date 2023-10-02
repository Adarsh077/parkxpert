const router = require('express').Router();

const { todoController } = require('../controllers');
const { todoValidator } = require('../validators');

router
  .route('/')
  .get(todoValidator.getAllTodo, todoController.getAllTodos)
  .post(todoValidator.createTodo, todoController.createTodo);

module.exports = router;
