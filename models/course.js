const { Schema, model, SchemaType } = require('mongoose');
//const { delete } = require('../routes/add');

const courseSchema = new Schema({
  //id moongoose сам добавит
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  img: String,
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
});

courseSchema.method('toClient', function () {
  const course = this.toObject();

  course.id = course._id;
  delete course._id;

  return course;
});

module.exports = model('Course', courseSchema);
