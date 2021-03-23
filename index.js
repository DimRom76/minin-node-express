const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const MongoStore = require('connect-mongodb-session')(session);

const path = require('path');
const csrf = require('csurf'); //защита приложения от перехвата пароля
const flash = require('connect-flash'); //мидлваре для перехвата ошибок и сообщению пользователю

const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');

const varMiddleware = require('./middleware/variables');
const userMiddleware = require('./middleware/user');
const errorHandler = require('./middleware/error');
const fileMiddleware = require('./middleware/file');

const homeRoutes = require('./routes/home');
const addRoutes = require('./routes/add');
const cardRoutes = require('./routes/card');
const homeCourses = require('./routes/courses');
const ordersRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const keys = require('./keys');

const app = express();

const hbs = exphbs.create({
  defaultLayout: 'main',
  extname: 'hbs',
  runtimeOptions: { allowProtoPropertiesByDefault: true },
  helpers: require('./utils/hbs-helpers'),
});

//регестрируем в єкспрессе движок handlebars
app.engine('hbs', hbs.engine);
//используем подключенный движок
app.set('view engine', 'hbs');
//говорим где будуть храниться шаблоны, по умолчанию views
app.set('views', 'views');

//регистрируем публичную папкку
app.use(express.static(path.join(__dirname, 'public')));
app.use('images', express.static(path.join(__dirname, 'images')));
//перед регистрацией роута для того чтобы при работе с формой возвращался объект
//собранный из формы при POST запросе
app.use(express.urlencoded({ extended: true }));
//подключаем сессию, store используется для сохранения сессии в базу данных
const store = new MongoStore({
  collection: 'sessions',
  uri: keys.MONGODB_URI,
});

app.use(
  session({
    secret: keys.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
  }),
);
app.use(fileMiddleware.single('avatar'));
app.use(csrf());
app.use(flash());
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);
app.use(compression());
app.use(varMiddleware);
app.use(userMiddleware);

//регистрируем роутеры для навигации
app.use('/', homeRoutes);
app.use('/add', addRoutes);
app.use('/card', cardRoutes);
app.use('/courses', homeCourses);
app.use('/orders', ordersRoutes);
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
//подключаем в самом конце
app.use(errorHandler);

// app.get('/', (req, res) => {
//     //без handlebars
//     //res.sendFile(path.join(__dirname, 'views', 'index.html'))
//      //c handlebars без роутерав
//     res.render('index', {
//         title: 'Главная страница',
//         isHome: true
//     })
// })

async function start() {
  try {
    //MongoDB
    //user = DimRom
    //password = 'ZlSYOJqiG7RY18tv'

    // const uri =
    //   'mongodb+srv://DimRom:<password>@cluster0.8sim5.mongodb.net/<dbname>?retryWrites=true&w=majority';
    await mongoose.connect(keys.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (e) {
    console.log(e);
  }
}

start();
