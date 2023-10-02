const { TodoModel } = require('../models');

class TodoDataLayer {
  constructor() {
    this.model = TodoModel;
  }

  async createTodo(data) {
    const { userId, title, description } = data;
    const todo = await this.model.create({ userId, title, description });
    return todo;
  }

  async getTodos(filter) {
    const todos = await this.model.find(filter);

    return todos;
  }
}

module.exports = new TodoDataLayer();
