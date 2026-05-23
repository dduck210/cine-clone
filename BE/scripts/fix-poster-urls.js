require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Movie = require('../models/Movie');

const FIXES = [
  { title: 'Thunderbolts*',                  poster: 'https://image.tmdb.org/t/p/w500/hqcexYHbiTBfDIdDWxrxPtVndBX.jpg' },
  { title: 'Godzilla x Kong: The New Empire',poster: 'https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg' },
  { title: 'Smile 2',                        poster: 'https://image.tmdb.org/t/p/w500/ht8Uv9QPv9y7K0RvUyJIaXOZTfd.jpg' },
  { title: 'Barbie',                         poster: 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg' },
  { title: 'Wicked',                         poster: 'https://image.tmdb.org/t/p/w500/xDGbZ0JJ3mYaGKy4Nzd9Kph6M9L.jpg' },
  { title: 'It Ends with Us',                poster: 'https://image.tmdb.org/t/p/w500/AjV6jFJ2YFIluYo4GQf13AA1tqu.jpg' },
  { title: 'Killers of the Flower Moon',     poster: 'https://image.tmdb.org/t/p/w500/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg' },
  { title: 'Kẻ Ăn Hồn',                     poster: 'https://image.tmdb.org/t/p/w500/hu4H2mIMrqtrTNOEwn1Y6WAHTrl.jpg' },
  { title: 'Nhà Bà Nữ',                     poster: 'https://image.tmdb.org/t/p/w500/kOvKHespgDEfzbYpq1cas2i8EZn.jpg' },
  { title: 'Em và Trịnh',                   poster: 'https://image.tmdb.org/t/p/w500/x72eRMK9GzYVVER04hEsLxhWeUb.jpg' },
  { title: 'Jurassic World Rebirth',         poster: 'https://image.tmdb.org/t/p/w500/1RICxzeoNCAO5NpcRMIgg1XT6fm.jpg' },
  { title: 'Avengers: Doomsday',             poster: 'https://image.tmdb.org/t/p/w500/8HkIe2i4ScpCkcX9SzZ9IPasqWV.jpg' },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');
  for (const { title, poster } of FIXES) {
    const r = await Movie.updateOne({ title }, { $set: { poster } });
    console.log((r.modifiedCount ? 'UPDATED' : 'NOT FOUND'), title);
  }
  console.log('Done');
  process.exit(0);
})();
