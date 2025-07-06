const fetch = require('node-fetch');

async function findGuest4694() {
  const res = await fetch('http://localhost:8000/api/users');
  if (!res.ok) {
    console.error('Ошибка запроса:', res.status, await res.text());
    return;
  }
  const users = await res.json();
  const found = users.find(u =>
    (u.username && u.username.includes('4694')) ||
    (u.first_name && u.first_name.includes('4694')) ||
    (u.last_name && u.last_name.includes('4694')) ||
    (u.username && u.username.toLowerCase().includes('гость')) ||
    (u.first_name && u.first_name.toLowerCase().includes('гость')) ||
    (u.last_name && u.last_name.toLowerCase().includes('гость'))
  );
  if (found) {
    console.log('Найден пользователь:', found);
  } else {
    console.log('Пользователь "Гость 4694" не найден.');
  }
}

findGuest4694(); 