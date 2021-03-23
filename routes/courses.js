const { Router, query } = require('express');
const Course = require('../models/course');
const router = Router();

const { validationResult } = require('express-validator');
const { courseValidators } = require('../utils/validators');

const auth = require('../middleware/auth');

function isOwner(course, req) {
  return course.userId.toString() === req.user._id.toString();
}

router.get('/', async (req, res) => {
  //for FS
  //const courses = await Course.getAll();

  try {
    //получаем все данные с сервера БД
    //lean - function tells mongoose to not hydrate query results
    //..the results of your queries will be the same plain JavaScript objects
    //populate - вытаскивает из базы не просто ID а весь объект по ID,
    //второй параметр ('email name') говорит какие поля нужны
    const courses = await Course.find().populate('userId', 'email name').lean();
    //console.log(courses);

    res.render('courses', {
      title: 'Курсы',
      isCourses: true,
      userId: req.user ? req.user.id.toString() : null,
      courses,
    });
  } catch (e) {
    console.log(e);
  }
});

router.get('/:id/edit', auth, async (req, res) => {
  //проверяем есть ли атрибут allow в url строке
  if (!req.query.allow) {
    return res.redirect('/');
  }

  try {
    //for FS
    //const course = await Course.getById(req.params.id);

    const course = await Course.findById(req.params.id).lean();

    if (!isOwner(course, req)) {
      return res.redirect('/courses');
    }

    res.render('course-edit', {
      title: `Редактировать ${course.title}`,
      course,
    });
  } catch (e) {
    console.log(e);
  }
});

router.post('/edit', auth, courseValidators, async (req, res) => {
  //for FS
  //await Course.update(req.body);
  const { id } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).redirect(`/courses/${id}/edit?allow=true`);
  }

  try {
    delete req.body.id; //уберем id, та как у мангоса он записан _id
    const course = await Course.findById(id);

    if (!isOwner(course, req)) {
      return res.redirect('/courses');
    }

    Object.assign(course, req.body);
    await course.save();

    res.redirect('/courses');
  } catch (e) {
    console.log(e);
  }
});

router.post('/remove', auth, async (req, res) => {
  try {
    await Course.deleteOne({
      _id: req.body.id,
      userId: req.user._id,
    });
    res.redirect('/courses');
  } catch (e) {
    console.log(e);
  }
});

router.get('/:id', async (req, res) => {
  //for FS
  //const course = await Course.getById(req.params.id);
  try {
    const course = await Course.findById(req.params.id).lean();
    res.render('course', {
      layout: 'empty',
      title: `Курс ${course.title}`,
      course,
    });
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
