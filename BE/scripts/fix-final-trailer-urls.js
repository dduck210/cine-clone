require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Movie = require('../models/Movie');

const REPLACEMENTS = {
  'The Ring':             'https://www.youtube.com/watch?v=QdIN7ezh8ng',
  'Dragon Ball Super: Broly': 'https://www.youtube.com/watch?v=U_WaYehNVAM',
  'Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô': 'https://www.youtube.com/watch?v=AftPh1PFFrs',
  'Doraemon: Nobita và Bản Giao Hưởng Địa Cầu': 'https://www.youtube.com/watch?v=cbo9u5afb9c',
  'Lật Mặt 8: Vòng Tay Nắng': 'https://www.youtube.com/watch?v=9Rj2V8qvKoc',
  'Mai':                  'https://www.youtube.com/watch?v=EX6clvId19s',
  'Kẻ Ăn Hồn':           'https://www.youtube.com/watch?v=GMLKxb8spNI',
  'Nhà Bà Nữ':           'https://www.youtube.com/watch?v=IkaP0KJWTsQ',
  'Em và Trịnh':         'https://www.youtube.com/watch?v=zzik4JB9D1Q',
};

async function checkYoutube(url) {
    const m = url?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?]+)/);
    if (!m) return false;
    try {
        const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${m[1]}&format=json`, { signal: AbortSignal.timeout(8000) });
        return r.status === 200;
    } catch { return false; }
}

(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected\n');

    let fixed = 0, broken = 0;
    for (const [title, url] of Object.entries(REPLACEMENTS)) {
        const ok = await checkYoutube(url);
        if (ok) {
            await Movie.updateOne({ title }, { $set: { trailer: url } });
            console.log('FIXED ', title);
            fixed++;
        } else {
            console.log('BROKEN', title, '→', url);
            broken++;
        }
    }

    console.log(`\nFixed: ${fixed}, Still broken: ${broken}`);
    process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
