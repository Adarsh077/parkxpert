const { todoDataLayer } = require('../data');

class TodoService {
  constructor() {
    this.todoDataLayer = todoDataLayer;
  }

  async getTodos(filter) {
    const todos = await this.todoDataLayer.getTodos(filter);
    return { todos };
  }

  async createTodos(data) {
    const { userId, title, description } = data;

    const todo = await this.todoDataLayer.createTodo({
      userId,
      title,
      description,
    });

    return { todo };
  }
}

module.exports = new TodoService();
