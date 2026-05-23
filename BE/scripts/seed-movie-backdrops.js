/**
 * Script: seed-movie-backdrops.js
 * Cập nhật backdrop images cho movies trong DB từ TMDB (đã fetch sẵn, không cần API key).
 * Usage: node BE/scripts/seed-movie-backdrops.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const BASE = "https://image.tmdb.org/t/p/original";

// title (exact match từ DB) → backdrop path từ TMDB
const BACKDROP_MAP = {
  "The Avengers":                                 `${BASE}/9BBTo63ANSmhC4e6r62OJFuK2GL.jpg`,
  "Superbad":                                     `${BASE}/xzF3SOwPaiZ3rySbSkWQeYbSpVD.jpg`,
  "The Shawshank Redemption":                     `${BASE}/zfbjgQE1uSd9wiPTX4VzsLi0rGG.jpg`,
  "The Notebook":                                 `${BASE}/zdXnJqBaGFVtLoPNuMeKfEYUViZ.jpg`,
  "Dragon Ball Super: Broly":                     `${BASE}/pJWfJT6gYLLNdlFmy36KXAr4p5Y.jpg`,
  "Interstellar":                                 `${BASE}/2ssWTSVklAEc98frZUQhgtGHx7s.jpg`,
  "Fast X":                                       `${BASE}/4XM8DUTQb3lhLemJC51Jx4a2EuA.jpg`,
  "Mission: Impossible – Dead Reckoning":         `${BASE}/628Dep6AxEtDxjZoGP78TsOxYbK.jpg`,
  "Guardians of the Galaxy Vol. 3":               `${BASE}/5YZbUmjbMa3ClvSW1Wj3D6XGolb.jpg`,
  "Deadpool & Wolverine":                         `${BASE}/ufpeVEM64uZHPpzzeiDNIAdaeOD.jpg`,
  "Thunderbolts*":                                `${BASE}/rthMuZfFv4fqEU4JVbgSW9wQ8rs.jpg`,
  "Oppenheimer":                                  `${BASE}/neeNHeXjMF5fXoCJRsOmkNGC7q.jpg`,
  "The Fantastic Four: First Steps":              `${BASE}/s94NjfKkcSczZ1FembwmQZwsuwY.jpg`,
  "Aquaman and the Lost Kingdom":                 `${BASE}/7S0bXv3BqCuPfImKRf5kkmBVYZR.jpg`,
  "Godzilla x Kong: The New Empire":              `${BASE}/gvLG3Fnznkxl4SmYfcK8gUuqxM8.jpg`,
  "Transformers: Rise of the Beasts":             `${BASE}/2vFuG6bWGyQUzYS9d69E5l85nIz.jpg`,
  "Smile 2":                                      `${BASE}/iR79ciqhtaZ9BE7YFA1HpCHQgX4.jpg`,
  "Sonic the Hedgehog 3":                         `${BASE}/zOpe0eHsq0A2NvNyBbtT6sj53qV.jpg`,
  "Killers of the Flower Moon":                   `${BASE}/1X7vow16X7CnCoexXh4H4F2yDJv.jpg`,
  "Nhà Bà Nữ":                                   `${BASE}/tBLRdEQCth9gj5VHZbx2sO4coCY.jpg`,
  "Em và Trịnh":                                  `${BASE}/7wsCWdSY8U1tfB4P9hkQmeTOBdc.jpg`,
  "Jurassic World Rebirth":                       `${BASE}/zNriRTr0kWwyaXPzdg1EIxf0BWk.jpg`,
  "John Wick: Chapter 4":                         `${BASE}/7I6VUdPj6tQECNHdviJkUHD2u89.jpg`,
  "Captain America: Brave New World":             `${BASE}/8eifdha9GQeZAkexgtD45546XKx.jpg`,
  "Kingdom of the Planet of the Apes":            `${BASE}/fypydCipcWDKDTTCoPucBsdGYXW.jpg`,
  "Dune: Part Two":                               `${BASE}/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg`,
  "Alien: Romulus":                               `${BASE}/iYqSQaWDttQIQzsxg9xHyg0bttG.jpg`,
  "Barbie":                                       `${BASE}/ctMserH8g2SeOAnCw5gFjdQF8mo.jpg`,
  "Inside Out 2":                                 `${BASE}/p5ozvmdgsmbWe0H8Xk7Rc8SCwAB.jpg`,
  "It Ends with Us":                              `${BASE}/8yPSYhooj8nyBbmV3GVdLDwuE7e.jpg`,
  "A Quiet Place: Day One":                       `${BASE}/6XjMwQTvnICBz6TguiDKkDVHvgS.jpg`,
  "The Substance":                                `${BASE}/8ODNt5olCeIqBYTP3GgXEQYTfeX.jpg`,
  "Moana 2":                                      `${BASE}/zo8CIjJ2nfNOevqNajwMRO6Hwka.jpg`,
  "Wicked":                                       `${BASE}/uVlUu174iiKhsUGqnOSy46eIIMU.jpg`,
  "Avengers: Doomsday":                           `${BASE}/iA4mbnxs58l97r5yu44PzAsMi83.jpg`,
  "Mai":                                          `${BASE}/g3yFCzkHAvB7oFvt9HJDxBxo1al.jpg`,
  "Avatar 3: Fire and Ash":                       `${BASE}/iN41Ccw4DctL8npfmYg1j5Tr1eb.jpg`,
  "Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô": `${BASE}/4TMkOnI6rCYxqD059aeeQSBv5mc.jpg`,
  "Doraemon: Nobita và Bản Giao Hưởng Địa Cầu":  `${BASE}/Z3mSxuPRNiFYxf1LBoGz3YrJzC.jpg`,
};

const Movie = mongoose.model(
  "Movie",
  new mongoose.Schema({ title: String, backdrop: String }, { strict: false })
);

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB\n");

  let updated = 0;
  let notFound = 0;

  for (const [title, url] of Object.entries(BACKDROP_MAP)) {
    const result = await Movie.findOneAndUpdate(
      { title },
      { backdrop: url },
      { new: false }
    );
    if (result) {
      console.log(`✅ ${title}`);
      updated++;
    } else {
      console.log(`⚠️  Not in DB: "${title}"`);
      notFound++;
    }
  }

  console.log(`\n🏁 Done: ${updated} updated, ${notFound} not in DB`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
