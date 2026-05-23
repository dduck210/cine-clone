require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Movie = require('../models/Movie');

const REPLACEMENTS = {
  'The Avengers':         'https://www.youtube.com/watch?v=eOrNdBpGMv8',
  'Superbad':             'https://www.youtube.com/watch?v=4eaZ_48ZYog',
  'The Ring':             'https://www.youtube.com/watch?v=SjlY53Jla2k',
  'The Notebook':         'https://www.youtube.com/watch?v=v7MGUNV8MxU',
  'Interstellar':         'https://www.youtube.com/watch?v=zSWdZVtXT7E',
  'Dragon Ball Super: Broly': 'https://www.youtube.com/watch?v=oJqA3tOKy7Y',
  'Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô': 'https://www.youtube.com/watch?v=4DgFSp_oQ7A',
  'Doraemon: Nobita và Bản Giao Hưởng Địa Cầu': 'https://www.youtube.com/watch?v=7W3LqmD5LsI',
  'Lật Mặt 8: Vòng Tay Nắng': 'https://www.youtube.com/watch?v=WvYk-WjD3Ew',
  'Mai':                  'https://www.youtube.com/watch?v=F-XoTOKc3DE',
  'Kẻ Ăn Hồn':           'https://www.youtube.com/watch?v=yAJj-GXXpGU',
  'Nhà Bà Nữ':           'https://www.youtube.com/watch?v=gDV1eQeK0bI',
  'Em và Trịnh':         'https://www.youtube.com/watch?v=pMV8fBuMmI8',
};

function extractYoutubeId(url) {
    const m = url?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?]+)/);
    return m ? m[1] : null;
}

async function checkYoutube(videoId) {
    try {
        const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, { signal: AbortSignal.timeout(8000) });
        return r.status === 200;
    } catch { return false; }
}

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected\n');

    let fixed = 0, skipped = 0;
    for (const [title, url] of Object.entries(REPLACEMENTS)) {
        const vid = extractYoutubeId(url);
        const ok = vid ? await checkYoutube(vid) : false;
        if (ok) {
            await Movie.updateOne({ title }, { $set: { trailer: url } });
            console.log('FIXED ', title);
            fixed++;
        } else {
            console.log('STILL BROKEN', title, '→', url);
            skipped++;
        }
    }

    console.log(`\nFixed: ${fixed}, Still broken: ${skipped}`);
    process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
