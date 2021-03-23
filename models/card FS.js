const path = require('path');
const fs = require('fs');

// const p = ;

class Card {
  static async add(course) {
    const card = await Card.fetch();

    const idx = card.courses.findIndex(c => c.id === course.id);
    const candidate = card.courses[idx];

    if (candidate) {
      //курс уже есть
      candidate.count++;
      card.courses[idx] = candidate;
    } else {
      //нужно добавить
      course.count = 1;
      card.courses.push(course);
    }

    //на всякий случай приведем к числу чтобы не было конкатенации строк
    card.price += +course.price;

    return new Promise((resolve, reject) => {
      fs.writeFile(
        path.join(__dirname, '..', 'data', 'card.json'),
        JSON.stringify(card),
        err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        },
      );
    });
  }

  static async remove(id) {
    const card = await Card.fetch();

    const idx = card.courses.findIndex(c => c.id === id);
    const course = card.courses[idx];

    if (course.count === 1) {
      //удаляем из корзины
      card.courses = card.courses.filter(c => c.id !== id);
    } else {
      //изменяем количество
      card.courses[idx].count--;
    }

    card.price -= course.price;

    return new Promise((resolve, reject) => {
      fs.writeFile(
        path.join(__dirname, '..', 'data', 'card.json'),
        JSON.stringify(card),
        err => {
          if (err) {
            reject(err);
          } else {
            resolve(card);
          }
        },
      );
    });
  }

  static async fetch() {
    return new Promise((resolve, reject) => {
      fs.readFile(
        path.join(__dirname, '..', 'data', 'card.json'),
        'utf-8',
        (err, content) => {
          if (err) {
            reject(err);
          } else {
            resolve(JSON.parse(content));
          }
        },
      );
    });
  }
}

module.exports = Card;
