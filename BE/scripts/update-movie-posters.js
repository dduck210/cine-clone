require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Movie = require('../models/Movie');

const W = 'https://image.tmdb.org/t/p/w780';

// All real movies: upgrade to w780, fix wrong poster paths
// Sources verified via TMDB (tmdb.org)
const FIXES = [
  // --- w300_and_h450_face → w780 same path ---
  { title: 'Avatar 3: Fire and Ash',                                  poster: `${W}/w6DBmG260sCHBQdGzkBIVn9gAQZ.jpg` },
  { title: 'Doraemon: Nobita và Bản Giao Hưởng Địa Cầu',            poster: `${W}/wovo2VvBVDI39S0y6sGenuJ03vd.jpg` },
  { title: 'Interstellar',                                            poster: `${W}/if4TI9LbqNIrzkoOgWjX5PZYDYe.jpg` },
  { title: 'Lật Mặt 8: Vòng Tay Nắng',                              poster: `${W}/5MRo3arvulO98v27OPO5DXA7UDy.jpg` },
  { title: 'Mai',                                                     poster: `${W}/2nF8xD200rcDawuCg5ObxxqA2fC.jpg` },
  { title: 'Spider-Man: Beyond the Spider-Verse',                    poster: `${W}/9PIhQqqI6Q4a5YjwMjxvzZcPJhf.jpg` },
  { title: 'The Avengers',                                           poster: `${W}/rX46P5ZwcHOvrkhtYDYhnNf46Bo.jpg` },
  { title: 'The Notebook',                                           poster: `${W}/jSM8ufnkCpdf5sVHu9ESFQDowRF.jpg` },
  { title: 'The Ring',                                               poster: `${W}/is0Y28s3Gs8ae3vTkx9CJSVQdaw.jpg` },

  // --- Wrong poster path → correct TMDB path at w780 ---
  { title: 'Dragon Ball Super: Broly',                               poster: `${W}/tviumel4bhjuPki15Jl3hdGoa8K.jpg` },
  { title: 'Superbad',                                               poster: `${W}/ibK8ZVLL8XO1kV06VGliH4syCUc.jpg` },
  { title: 'Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô', poster: `${W}/ctboIRYQHYJMge6M6fgcwrhREsj.jpg` },
  { title: 'The Batman 2',                                           poster: `${W}/qv4YTyxvaujP79a5XZJ6F4G8Nyi.jpg` },
  { title: 'Wicked',                                                 poster: `${W}/v0wmLuNj4rsyfTF6V30StYZAXdb.jpg` },
  { title: 'Jurassic World Rebirth',                                 poster: `${W}/2IVVciw7dPhUlNmYIaz0s1d56SZ.jpg` },

  // --- w500 → w780 (same path, higher resolution) ---
  { title: 'A Quiet Place: Day One',                                 poster: `${W}/yrpPYKijwdMHyTGIOd1iK1h0Xno.jpg` },
  { title: 'Alien: Romulus',                                         poster: `${W}/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg` },
  { title: 'Aquaman and the Lost Kingdom',                           poster: `${W}/7lTnXOy0iNtBAdRP3TZvaKJ77F6.jpg` },
  { title: 'Avengers: Doomsday',                                     poster: `${W}/8HkIe2i4ScpCkcX9SzZ9IPasqWV.jpg` },
  { title: 'Barbie',                                                 poster: `${W}/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg` },
  { title: 'Captain America: Brave New World',                       poster: `${W}/pzIddUEMWhWzfvLI3TwxUG2wGoi.jpg` },
  { title: 'Deadpool & Wolverine',                                   poster: `${W}/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg` },
  { title: 'Dune: Part Two',                                         poster: `${W}/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg` },
  { title: 'Em và Trịnh',                                           poster: `${W}/x72eRMK9GzYVVER04hEsLxhWeUb.jpg` },
  { title: 'Fast X',                                                 poster: `${W}/fiVW06jE7z9YnO4trhaMEdclSiC.jpg` },
  { title: 'Godzilla x Kong: The New Empire',                       poster: `${W}/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg` },
  { title: 'Guardians of the Galaxy Vol. 3',                        poster: `${W}/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg` },
  { title: 'Inside Out 2',                                           poster: `${W}/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg` },
  { title: 'It Ends with Us',                                        poster: `${W}/AjV6jFJ2YFIluYo4GQf13AA1tqu.jpg` },
  { title: 'John Wick: Chapter 4',                                   poster: `${W}/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg` },
  { title: 'Killers of the Flower Moon',                             poster: `${W}/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg` },
  { title: 'Kingdom of the Planet of the Apes',                     poster: `${W}/gKkl37BQuKTanygYQG1pyYgLVgf.jpg` },
  { title: 'Kẻ Ăn Hồn',                                            poster: `${W}/hu4H2mIMrqtrTNOEwn1Y6WAHTrl.jpg` },
  { title: 'Mission: Impossible – Dead Reckoning',                  poster: `${W}/NNxYkU70HPurnNCSiCjYAmacwm.jpg` },
  { title: 'Moana 2',                                                poster: `${W}/aLVkiINlIeCkcZIzb7XHzPYgO6L.jpg` },
  { title: 'Nhà Bà Nữ',                                             poster: `${W}/kOvKHespgDEfzbYpq1cas2i8EZn.jpg` },
  { title: 'Oppenheimer',                                            poster: `${W}/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg` },
  { title: 'Smile 2',                                               poster: `${W}/ht8Uv9QPv9y7K0RvUyJIaXOZTfd.jpg` },
  { title: 'Sonic the Hedgehog 3',                                   poster: `${W}/d8Ryb8AunYAuycVKDp5HpdWPKgC.jpg` },
  { title: 'The Fantastic Four: First Steps',                        poster: `${W}/9l1eZiJHmhr5jIlthMdJN5WYoff.jpg` },
  { title: 'The Shawshank Redemption',                               poster: `${W}/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg` },
  { title: 'The Substance',                                          poster: `${W}/lqoMzCcZYEFK729d6qzt349fB4o.jpg` },
  { title: 'Thunderbolts*',                                          poster: `${W}/hqcexYHbiTBfDIdDWxrxPtVndBX.jpg` },
  { title: 'Transformers: Rise of the Beasts',                       poster: `${W}/gPbM0MK8CP8A174rmUwGsADNYKD.jpg` },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  let updated = 0, skipped = 0, notFound = 0;

  for (const { title, poster } of FIXES) {
    const r = await Movie.updateOne({ title }, { $set: { poster } });
    if (r.modifiedCount) {
      console.log(`✓  ${title}`);
      updated++;
    } else if (r.matchedCount) {
      skipped++;
    } else {
      console.log(`✗  NOT FOUND: ${title}`);
      notFound++;
    }
  }

  console.log(`\nDone: ${updated} updated, ${skipped} already up-to-date, ${notFound} not found`);
  process.exit(0);
})();
