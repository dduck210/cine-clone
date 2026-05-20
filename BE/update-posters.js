require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Movie = require('./models/Movie');

dotenv.config();

const POSTER_MAP = {
    'The Avengers':              'https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg',
    'Superbad':                  'https://image.tmdb.org/t/p/w500/ek8e8txUyUwd2BNqj6lFEerJfbq.jpg',
    'The Shawshank Redemption':  'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
    'The Ring':                  'https://image.tmdb.org/t/p/w500/AeRpUynJKDpJveklBJipOYrVxCS.jpg',
    'The Notebook':              'https://image.tmdb.org/t/p/w500/rNzQyW4f8B8cQeg7Dgj3n6eT5k9.jpg',
    'Interstellar':              'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
};

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected');

    for (const [title, poster] of Object.entries(POSTER_MAP)) {
        const result = await Movie.updateOne({ title }, { $set: { poster } });
        console.log(`${title}: ${result.modifiedCount ? 'updated' : 'not found / unchanged'}`);
    }

    await mongoose.disconnect();
    console.log('Done');
}

run().catch(console.error);
