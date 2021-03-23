const { body } = require('express-validator');
const bcrypt = require('bcryptjs');

const User = require('../models/user');

exports.registerValidators = [
  body('email')
    .isEmail()
    .withMessage('Введите корректный email')
    .custom(async (value, { req }) => {
      try {
        const user = await User.findOne({ email: value });
        if (user) {
          return Promise.reject('Такой email уже занят');
        }
      } catch (e) {
        console.log(e);
      }
    })
    .normalizeEmail(),
  body('password')
    .isAlphanumeric()
    .isLength({ min: 6, max: 56 })
    .trim()
    .withMessage('Введите корректный пароль'),
  body('confirm')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Пароли должны совпадать');
      }
      return true;
    })
    .withMessage('Введите корректный пароль')
    .trim(),
  body('name')
    .isLength({ min: 3 })
    .withMessage('Имя должно быть минимум 3 символа')
    .trim(),
];

exports.loginValidators = [
  body('email')
    .isEmail()
    .withMessage('Введите корректный email')
    .normalizeEmail()
    .custom(async (value, { req }) => {
      try {
        const user = await User.findOne({ email: value });
        if (!user) {
          return Promise.reject('Такого email нет в базе');
        }

        const areSame = await bcrypt.compare(req.body.password, user.password);
        if (!areSame) {
          return Promise.reject('Введены неверные данные');
        }
      } catch (e) {
        console.log(e);
      }
    }),
  body('password')
    .isAlphanumeric()
    .isLength({ min: 6, max: 56 })
    .trim()
    .withMessage('Введите корректный пароль'),
];

exports.courseValidators = [
  body('title')
    .isLength({ min: 3 })
    .withMessage('Минимальная длина названия 3')
    .trim(),
  body('price').isNumeric().withMessage('Введите корректно цену'),
  body('img', 'Введите корректный URL картинки').isURL(),
];
