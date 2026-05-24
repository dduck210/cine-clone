require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Movie = require('../models/Movie');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const movies = await Movie.find({}, 'title poster status').sort({ title: 1 });
  movies.forEach(m => console.log(JSON.stringify({ title: m.title, poster: m.poster, status: m.status })));
  process.exit(0);
})();
