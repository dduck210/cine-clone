require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const Movie = require('./models/Movie');

// Dùng media.themoviedb.org thay image.tmdb.org — ổn định hơn từ VN
const POSTER_FIXES = [
    { title: 'The Avengers',             poster: 'https://media.themoviedb.org/t/p/w500/rX46P5ZwcHOvrkhtYDYhnNf46Bo.jpg' },
    { title: 'Superbad',                 poster: 'https://media.themoviedb.org/t/p/w500/ibK8ZVLL8XO1kV06VGliH4syCUc.jpg' },
    { title: 'The Shawshank Redemption', poster: 'https://media.themoviedb.org/t/p/w500/zLyG4nquaaZKCA3CJdQCEzTwN1R.jpg' },
    { title: 'The Ring',                 poster: 'https://media.themoviedb.org/t/p/w500/is0Y28s3Gs8ae3vTkx9CJSVQdaw.jpg' },
    { title: 'The Notebook',             poster: 'https://media.themoviedb.org/t/p/w500/jSM8ufnkCpdf5sVHu9ESFQDowRF.jpg' },
    { title: 'Interstellar',             poster: 'https://media.themoviedb.org/t/p/w500/if4TI9LbqNIrzkoOgWjX5PZYDYe.jpg' },
];

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('MongoDB Connected');

    for (const item of POSTER_FIXES) {
        const result = await Movie.updateOne(
            { title: item.title },
            { $set: { poster: item.poster } }
        );
        console.log(`${item.title}: updated ${result.modifiedCount} doc`);
    }

    console.log('Done.');
    process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
