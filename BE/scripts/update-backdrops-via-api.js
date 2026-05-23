/**
 * Script: update-backdrops-via-api.js
 * Update backdrop cho movies qua REST API (không cần kết nối DB trực tiếp).
 * Yêu cầu: BE server đang chạy tại localhost:5000
 * Usage: node BE/scripts/update-backdrops-via-api.js
 */
const http = require("http");

const API = "http://localhost:5000/api";
const BASE = "https://image.tmdb.org/t/p/original";

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

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: "localhost", port: 5000,
      path: `/api${path}`, method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };
    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  // 1. Login
  console.log("🔑 Logging in as admin...");
  const loginRes = await request("POST", "/auth/login", {
    email: "admin@cinema.com",
    password: "123456",
  });
  if (!loginRes.body.token) {
    console.error("❌ Login failed:", JSON.stringify(loginRes.body));
    process.exit(1);
  }
  const token = loginRes.body.token;
  console.log("✅ Logged in\n");

  // 2. Get all movies
  const moviesRes = await request("GET", "/movies", null, token);
  const movies = moviesRes.body;
  if (!Array.isArray(movies)) {
    console.error("❌ Could not fetch movies:", JSON.stringify(movies).slice(0, 200));
    process.exit(1);
  }
  console.log(`🎬 Found ${movies.length} movies in DB\n`);

  let updated = 0, skipped = 0;

  for (const movie of movies) {
    const backdrop = BACKDROP_MAP[movie.title];
    if (!backdrop) { skipped++; continue; }
    if (movie.backdrop === backdrop) {
      console.log(`  ⏩ Already set: ${movie.title}`);
      skipped++; continue;
    }

    // Some movies may be missing required screeningEndDate — provide a fallback
    const body = { backdrop };
    if (!movie.screeningEndDate) {
      const base = movie.releaseDate ? new Date(movie.releaseDate) : new Date();
      base.setFullYear(base.getFullYear() + 1);
      body.screeningEndDate = base.toISOString();
    }
    const res = await request("PUT", `/movies/${movie._id}`, body, token);
    if (res.status === 200) {
      console.log(`  ✅ ${movie.title}`);
      updated++;
    } else {
      console.log(`  ❌ Failed (${res.status}): ${movie.title}`);
      skipped++;
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`\n🏁 Done: ${updated} updated, ${skipped} skipped/not found`);
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
