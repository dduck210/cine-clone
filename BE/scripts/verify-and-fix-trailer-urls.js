require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Movie = require('../models/Movie');

// Known-working replacement trailer URLs for common movies
const REPLACEMENTS = {
  'Fast X':                              'https://www.youtube.com/watch?v=eoOaKN4qCKw',
  'Mission: Impossible – Dead Reckoning':'https://www.youtube.com/watch?v=avz06PDqDbM',
  'John Wick: Chapter 4':               'https://www.youtube.com/watch?v=qEVUtrk8_B4',
  'Guardians of the Galaxy Vol. 3':     'https://www.youtube.com/watch?v=u3V5KDHRQvk',
  'Deadpool & Wolverine':               'https://www.youtube.com/watch?v=73_1biulkYk',
  'Captain America: Brave New World':   'https://www.youtube.com/watch?v=K4ycgUXcP58',
  'Aquaman and the Lost Kingdom':       'https://www.youtube.com/watch?v=2MqJ-9D7MzM',
  'Thunderbolts*':                      'https://www.youtube.com/watch?v=hIR8e6nrQ4s',
  'Godzilla x Kong: The New Empire':    'https://www.youtube.com/watch?v=odM92ap8_c0',
  'Kingdom of the Planet of the Apes': 'https://www.youtube.com/watch?v=XaQeUAjSH7E',
  'Dune: Part Two':                    'https://www.youtube.com/watch?v=Way9Dexny3w',
  'Oppenheimer':                        'https://www.youtube.com/watch?v=uYPbbksJxIg',
  'Transformers: Rise of the Beasts':  'https://www.youtube.com/watch?v=iMXOJbDKRsI',
  'Alien: Romulus':                     'https://www.youtube.com/watch?v=HKZGZ_w-CPo',
  'Smile 2':                           'https://www.youtube.com/watch?v=GBMApBH6T3s',
  'A Quiet Place: Day One':            'https://www.youtube.com/watch?v=Sp-Eb4gyZ9I',
  'The Substance':                      'https://www.youtube.com/watch?v=B1lPNGFOSeo',
  'Barbie':                            'https://www.youtube.com/watch?v=pBk4NYhWNMM',
  'Inside Out 2':                      'https://www.youtube.com/watch?v=LEjhY15eCx0',
  'Moana 2':                           'https://www.youtube.com/watch?v=2IXKE5dxQLw',
  'Sonic the Hedgehog 3':              'https://www.youtube.com/watch?v=hQMSPMFLHxc',
  'Wicked':                            'https://www.youtube.com/watch?v=6COmYeLsz4c',
  'It Ends with Us':                   'https://www.youtube.com/watch?v=vDMGGKWuaeA',
  'Killers of the Flower Moon':        'https://www.youtube.com/watch?v=EP34Yoxs3FQ',
  'The Fantastic Four: First Steps':   'https://www.youtube.com/watch?v=FX4ykbDuSiU',
  'Jurassic World Rebirth':            'https://www.youtube.com/watch?v=rMR46OPcB0o',
  'Avengers: Doomsday':               'https://www.youtube.com/watch?v=RlOB3UALvrQ',
};

function extractYoutubeId(url) {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?]+)/);
    return m ? m[1] : null;
}

async function checkYoutube(videoId) {
    try {
        const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
        return r.status === 200;
    } catch { return false; }
}

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected\n');

    const movies = await Movie.find({ trailer: { $exists: true, $ne: null, $ne: '' } }).select('title trailer');
    console.log(`Checking ${movies.length} trailers...\n`);

    const broken = [];
    for (const m of movies) {
        const vid = extractYoutubeId(m.trailer);
        if (!vid) { console.log(`NO_ID   ${m.title}`); broken.push(m); continue; }
        const ok = await checkYoutube(vid);
        console.log((ok ? 'OK     ' : 'BROKEN ') + m.title);
        if (!ok) broken.push(m);
    }

    console.log(`\nBroken: ${broken.length}`);
    if (broken.length === 0) { process.exit(0); }

    let fixed = 0;
    for (const m of broken) {
        const replacement = REPLACEMENTS[m.title];
        if (replacement) {
            await Movie.updateOne({ _id: m._id }, { $set: { trailer: replacement } });
            console.log(`FIXED  ${m.title} → ${replacement}`);
            fixed++;
        } else {
            console.log(`SKIP   ${m.title} (no replacement known)`);
        }
    }

    console.log(`\nFixed ${fixed}/${broken.length} broken trailers.`);
    process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
