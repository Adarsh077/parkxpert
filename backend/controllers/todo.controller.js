const { todoService } = require('../services');
const { catchAsync } = require('../utils');

exports.getAllTodos = catchAsync(async (req, res) => {
  const { userId } = req.query;

  const { todos } = await todoService.getTodos({ userId });

  res.send({
    status: 'success',
    body: todos,
  });
});

exports.createTodo = catchAsync(async (req, res) => {
  const { userId, title, description } = req.body;

  const { todo } = await todoService.createTodos({
    userId,
    title,
    description,
  });

  res.send({
    status: 'success',
    body: todo,
  });
});
