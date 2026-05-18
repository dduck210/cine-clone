const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const Movie = require('./models/Movie');

const posters = {
    'The Avengers':             'https://image.tmdb.org/t/p/w500/rX46P5ZwcHOvrkhtYDYhnNf46Bo.jpg',
    'Superbad':                 'https://image.tmdb.org/t/p/w500/ek8e8txUyUwd2BNqj6lFEerJfbq.jpg',
    'The Shawshank Redemption': 'https://image.tmdb.org/t/p/w500/lyQBXzOQSuE59IsHyhrp0qIiPAz.jpg',
    'The Ring':                 'https://image.tmdb.org/t/p/w500/is0Y28s3Gs8ae3vTkx9CJSVQdaw.jpg',
    'The Notebook':             'https://image.tmdb.org/t/p/w500/jSM8ufnkCpdf5sVHu9ESFQDowRF.jpg',
    'Interstellar':             'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
};

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('MongoDB Connected');
    for (const [title, poster] of Object.entries(posters)) {
        const result = await Movie.updateOne({ title }, { $set: { poster } });
        console.log(`[${result.modifiedCount ? 'OK' : 'SKIP'}] ${title}`);
    }
    process.exit(0);
}).catch(e => { console.log('DB error:', e.message); process.exit(1); });
