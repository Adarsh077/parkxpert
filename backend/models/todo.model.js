const mongoose = require('mongoose');

const TodoSchema = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    // userId: {
    //   type: mongoose.Types.ObjectId,
    //   required: true,
    //   /**
    //    * Imageine there is also a [users] model like
    //    * [todos] model in models/todo.model.js:20
    //    */
    //   ref: 'users',
    // },
    title: {
      type: String,
      required: true,
    },
    description: String,
  },
  {
    toJSON: {
      transform: (_, ret) => {
        delete ret.__v;
      },
    },
  }
);

module.exports = mongoose.model('todos', TodoSchema);
