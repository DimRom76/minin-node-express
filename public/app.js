const toCurrency = price => {
  return new Intl.NumberFormat('ru-RU', {
    currency: 'UAH',
    style: 'currency',
  }).format(price);
};

const toDate = date => {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(date));
};

//замена формата выводимой цены
document.querySelectorAll('.price').forEach(node => {
  node.textContent = toCurrency(node.textContent);
});

//замена формата выводимой даты
document.querySelectorAll('.date').forEach(node => {
  node.textContent = toDate(node.textContent);
});

//$ - обозначает что это  jQuery или HTML объект
const $card = document.querySelector('#card');
//проверим существует ли обьект так как он есть не на каждой странице
if ($card) {
  $card.addEventListener('click', event => {
    // проверим что это наша кнопка
    if (event.target.classList.contains('js-remove')) {
      const id = event.target.dataset.id;
      const csrf = event.target.dataset.csrf;

      //запрос на сервер
      fetch('/card/remove/' + id, {
        method: 'delete',
        headers: {
          'X-XSRF-TOKEN': csrf,
        },
      })
        .then(res => res.json())
        .then(card => {
          if (card.courses.length) {
            const html = card.courses
              .map(c => {
                return `
                        <tr>
                            <td>${c.title}</td>
                            <td>${c.count}</td>
                            <td>
                                <button class="btn btn-small js-remove" data-id="${c.id}">Удалить</button>
                            </td>
                        </tr> 
                        `;
              })
              .join('');
            $card.querySelector('tbody').innerHTML = html;
            $card.querySelector('.price').textContent = toCurrency(card.price);
          } else {
            $card.innerHTML = `<p>Корзина пуста</p>`;
          }
        });
    }
  });
}

M.Tabs.init(document.querySelectorAll('.tabs'));
