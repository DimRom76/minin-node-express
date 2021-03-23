const { Router } = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const nodemailer = require('nodemailer');
const sendgrid = require('nodemailer-sendgrid-transport');

const { validationResult } = require('express-validator');
const { registerValidators, loginValidators } = require('../utils/validators');

const router = Router();
const User = require('../models/user');
const keys = require('../keys');
const regEmail = require('../emails/registration');
const resetEmail = require('../emails/reset');

//настраиваем почтовик для отправки почты из приложения
const transporter = nodemailer.createTransport(
  sendgrid({
    auth: { api_key: keys.SENDGRID_API_KEY },
  }),
);

router.get('/login', async (req, res) => {
  res.render('auth/login', {
    title: 'Авторизация',
    isLogin: true,
    loginError: req.flash('loginError'),
    registerError: req.flash('registerError'),
  });
});

router.get('/logout', async (req, res) => {
  req.session.destroy(() => {
    res.redirect('/auth/login#login');
  });
});

router.post('/login', loginValidators, async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      req.flash('loginError', errors.array()[0].msg);
      return res.status(422).redirect('/auth/login#login');
    }

    const { email } = req.body; //получаем данные с формы

    //все проверки на наличие пользователя в базе и равенство пароля проводим в loginValidators
    const candidate = await User.findOne({ email });
    req.session.user = candidate;
    req.session.isAuthenticated = true;
    //ждем когда сессия точно запишеться, и потом делаем редирект
    req.session.save(err => {
      if (err) {
        throw err;
      }
      res.redirect('/');
    });
  } catch (e) {
    console.log(e);
  }
});

router.post('/register', registerValidators, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('registerError', errors.array()[0].msg);
      return res.status(422).redirect('/auth/login#register');
    }

    const { email, password, name } = req.body; //получаем данные с форы

    const hashPassword = await bcrypt.hash(password, 10); //шифруем пароль перез записью на сервере
    const user = new User({
      email,
      name,
      password: hashPassword,
      cart: { items: [] },
    });
    await user.save();

    //отправляем письмо пользователю и сообщаем что аккаунт создан
    //отправку делать лучьше в самом конце в фоне, приложение не должно тормозть
    await transporter.sendMail(regEmail(email));

    res.redirect('/auth/login#login');
  } catch (e) {
    console.log(e);
  }
});

router.get('/reset', (req, res) => {
  res.render('auth/reset', {
    title: 'Забыли пароль',
    error: req.flash('error'),
  });
});

router.post('/reset', (req, res) => {
  try {
    crypto.randomBytes(32, async (err, buffer) => {
      if (err) {
        req.flash('error', 'Что-то пошло не так повторите попытку позже');
        return res.redirect('/auth/reset');
      }

      const token = buffer.toString('hex');
      const candidate = await User.findOne({ email: req.body.email });
      if (candidate) {
        candidate.resetToken = token;
        candidate.resetTokenExp = Date.now() + 60 * 60 * 100; //время жизни токена

        await candidate.save();
        await transporter.sendMail(resetEmail(candidate.email, token));

        res.redirect('/auth/login');
      } else {
        req.flash('error', 'Такого email нет');
        res.redirect('/auth/reset');
      }
    });
  } catch (e) {
    console.log(e);
  }
});

router.get('/password/:token', async (req, res) => {
  if (!req.params.token) {
    return res.redirect('/auth/login');
  }

  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExp: { $gt: Date.now() }, //проверим что срок токена не истек
    });
    if (!user) {
      return res.redirect('/auth/login');
    }
    res.render('auth/password', {
      title: 'Восстановить доступ',
      error: req.flash('error'),
      userId: user._id.toString(),
      token: req.params.token,
    });
  } catch (e) {
    console.log(e);
  }
});

router.post('/password/', async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.body.userId,
      resetToken: req.body.token,
      resetTokenExp: { $gt: Date.now() }, //проверим что срок токена не истек
    });

    if (user) {
      user.password = await bcrypt.hash(req.body.password, 10);
      user.resetToken = undefined;
      user.resetTokenExp = undefined;
      await user.save();
    } else {
      req.flash('loginError', 'Время жизни токена истекло');
    }
    res.redirect('/auth/login');
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
