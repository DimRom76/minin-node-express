//этот мидлваре нужен для защиты маршрутизации,
//чтобы неавторизированный пользователь не смог попасть куда ему не следует, например в корзину
//добаляем его при вызове запрещенных маршрутов

module.exports = function (req, res, next) {
  if (!req.session.isAuthenticated) {
    return res.redirect('auth/login');
  }

  next();
};
