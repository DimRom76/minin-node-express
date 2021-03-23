const { Router } = require('express');
const router = Router();
//const Card = require('../models/card');
const Course = require('../models/course');
const auth = require('../middleware/auth');

function mapCartItems(cart) {
  return cart.items.map(c => ({
    ...c.courseId._doc,
    count: c.count,
    id: c.courseId.id,
  }));
}

function computedPrice(courses) {
  return courses.reduce((total, course) => {
    return (total += course.price * course.count);
  }, 0);
}

router.post('/add', auth, async (req, res) => {
  const course = await Course.findById(req.body.id);
  await req.user.addToCart(course);
  //await Card.add(course);  //для файловой версии
  res.redirect('/card');
});

router.delete('/remove/:id', auth, async (req, res) => {
  //удаляем карту
  // const card = await Card.remove(req.params.id); //для файловой версии

  await req.user.removeFromCart(req.params.id);
  const user = await req.user.populate('cart.items.courseId').execPopulate();

  const courses = mapCartItems(user.cart);
  const card = { courses, price: computedPrice(courses) };
  //возвращаем назад
  res.status(200).json(card);
});

router.get('/', auth, async (req, res) => {
  //const card = await Card.fetch();//для файловой версии
  const user = await req.user.populate('cart.items.courseId').execPopulate();

  const courses = mapCartItems(user.cart);

  res.render('card', {
    title: 'Корзина',
    isCard: true,
    courses: courses,
    price: computedPrice(courses),
    // courses: card.courses,  //для файловой версии
    // price: card.price,
  });
});

module.exports = router;
