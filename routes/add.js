const { Router } = require('express');
const Course = require('../models/course');
const auth = require('../middleware/auth');
const router = Router();

const { validationResult } = require('express-validator');
const { courseValidators } = require('../utils/validators');

router.get('/', auth, (req, res) => {
  res.render('add', {
    title: 'Добавить курс',
    isAdd: true,
  });
});

router.post('/', auth, courseValidators, async (req, res) => {
  //в body приходят данные из формы собранные из поля name
  //console.log(req.body)

  //for FS, для локального БД
  //const course = new Course(req.body.title, req.body.price, req.body.img);
  //course.save();

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('add', {
      title: 'Добавить курс',
      isAdd: true,
      error: errors.array()[0].msg,
      date: {
        title: req.body.title,
        price: req.body.price,
        img: req.body.img,
      },
    });
  }

  const course = new Course({
    title: req.body.title,
    price: req.body.price,
    img: req.body.img,
    userId: req.user,
  });

  try {
    //сохраняем данные в BD
    await course.save();
    res.redirect('/courses');
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
