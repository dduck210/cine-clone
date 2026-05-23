/**
 * Script: seed-movie-info-api.js
 * Cập nhật director, cast, language cho tất cả movies qua REST API (cần server đang chạy).
 * Usage: node BE/scripts/seed-movie-info-api.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const http = require("http");

const BASE_URL = "http://localhost:5000/api";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@cinema.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";

const MOVIE_INFO = {
  "The Avengers": {
    director: "Joss Whedon",
    cast: "Robert Downey Jr., Chris Evans, Mark Ruffalo, Chris Hemsworth, Scarlett Johansson, Jeremy Renner",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Superbad": {
    director: "Greg Mottola",
    cast: "Jonah Hill, Michael Cera, Christopher Mintz-Plasse, Seth Rogen, Emma Stone",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "The Shawshank Redemption": {
    director: "Frank Darabont",
    cast: "Tim Robbins, Morgan Freeman, Bob Gunton, William Sadler, Clancy Brown",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "The Notebook": {
    director: "Nick Cassavetes",
    cast: "Ryan Gosling, Rachel McAdams, James Garner, Gena Rowlands, Joan Allen",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Dragon Ball Super: Broly": {
    director: "Tatsuya Nagamine",
    cast: "Masako Nozawa, Ryō Horikawa, Bin Shimada, Ryūsei Nakao, Toshio Furukawa",
    language: "Tiếng Nhật - Phụ đề Việt",
  },
  "Interstellar": {
    director: "Christopher Nolan",
    cast: "Matthew McConaughey, Anne Hathaway, Jessica Chastain, Michael Caine, Matt Damon",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Fast X": {
    director: "Louis Leterrier",
    cast: "Vin Diesel, Michelle Rodriguez, Jason Momoa, Tyrese Gibson, Ludacris, John Cena",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Mission: Impossible – Dead Reckoning": {
    director: "Christopher McQuarrie",
    cast: "Tom Cruise, Hayley Atwell, Ving Rhames, Simon Pegg, Rebecca Ferguson, Vanessa Kirby",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Guardians of the Galaxy Vol. 3": {
    director: "James Gunn",
    cast: "Chris Pratt, Zoe Saldana, Dave Bautista, Bradley Cooper, Vin Diesel, Karen Gillan",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Deadpool & Wolverine": {
    director: "Shawn Levy",
    cast: "Ryan Reynolds, Hugh Jackman, Emma Corrin, Jennifer Garner, Wesley Snipes",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Thunderbolts*": {
    director: "Jake Schreier",
    cast: "Florence Pugh, Sebastian Stan, David Harbour, Wyatt Russell, Julia Louis-Dreyfus",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Oppenheimer": {
    director: "Christopher Nolan",
    cast: "Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr., Florence Pugh",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "The Fantastic Four: First Steps": {
    director: "Matt Shakman",
    cast: "Pedro Pascal, Vanessa Kirby, Joseph Quinn, Ebon Moss-Bachrach, Julia Garner",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Aquaman and the Lost Kingdom": {
    director: "James Wan",
    cast: "Jason Momoa, Patrick Wilson, Yahya Abdul-Mateen II, Amber Heard, Nicole Kidman",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Godzilla x Kong: The New Empire": {
    director: "Adam Wingard",
    cast: "Rebecca Hall, Brian Tyree Henry, Dan Stevens, Kaylee Hottle, Alex Ferns",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Transformers: Rise of the Beasts": {
    director: "Steven Caple Jr.",
    cast: "Anthony Ramos, Dominique Fishback, Peter Cullen, Peter Dinklage, Michelle Yeoh",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Smile 2": {
    director: "Parker Finn",
    cast: "Naomi Scott, Lukas Gage, Miles Gutierrez-Riley, Dylan Gelula, Rosemarie DeWitt",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Sonic the Hedgehog 3": {
    director: "Jeff Fowler",
    cast: "Ben Schwartz, James Marsden, Jim Carrey, Keanu Reeves, Idris Elba, Tika Sumpter",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Killers of the Flower Moon": {
    director: "Martin Scorsese",
    cast: "Leonardo DiCaprio, Robert De Niro, Lily Gladstone, Jesse Plemons, Tantoo Cardinal",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Nhà Bà Nữ": {
    director: "Trấn Thành",
    cast: "Ngân Chi, Lê Giang, Trấn Thành, NSƯT Hữu Châu, Uyển Ân",
    language: "Tiếng Việt",
  },
  "Em và Trịnh": {
    director: "Phan Gia Nhật Linh",
    cast: "Avin Lu, Bùi Lan Hương, Hoàng Hà, Kaity Nguyễn, Nhan Phúc Vinh",
    language: "Tiếng Việt",
  },
  "Jurassic World Rebirth": {
    director: "Gareth Edwards",
    cast: "Scarlett Johansson, Jonathan Bailey, Mahershala Ali, Manuel Garcia-Rulfo, Rupert Friend",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "John Wick: Chapter 4": {
    director: "Chad Stahelski",
    cast: "Keanu Reeves, Donnie Yen, Bill Skarsgård, Laurence Fishburne, Hiroyuki Sanada",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Captain America: Brave New World": {
    director: "Julius Onah",
    cast: "Anthony Mackie, Harrison Ford, Danny Ramirez, Shira Haas, Carl Lumbly",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Kingdom of the Planet of the Apes": {
    director: "Wes Ball",
    cast: "Owen Teague, Freya Allan, Kevin Durand, Peter Macon, William H. Macy",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Dune: Part Two": {
    director: "Denis Villeneuve",
    cast: "Timothée Chalamet, Zendaya, Rebecca Ferguson, Austin Butler, Javier Bardem, Florence Pugh",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Alien: Romulus": {
    director: "Fede Álvarez",
    cast: "Cailee Spaeny, David Jonsson, Archie Renaux, Isabela Merced, Spike Fearn",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Barbie": {
    director: "Greta Gerwig",
    cast: "Margot Robbie, Ryan Gosling, America Ferrera, Kate McKinnon, Issa Rae",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Inside Out 2": {
    director: "Kelsey Mann",
    cast: "Amy Poehler, Maya Hawke, Kensington Tallman, Liza Lapira, Tony Hale, Lewis Black",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "It Ends with Us": {
    director: "Justin Baldoni",
    cast: "Blake Lively, Justin Baldoni, Brandon Sklenar, Hasan Minhaj, Jenny Slate",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "A Quiet Place: Day One": {
    director: "Michael Sarnoski",
    cast: "Lupita Nyong'o, Joseph Quinn, Alex Wolff, Djimon Hounsou, Alfie Williams",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "The Substance": {
    director: "Coralie Fargeat",
    cast: "Demi Moore, Margaret Qualley, Dennis Quaid, Hugo Diego Garcia",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Moana 2": {
    director: "Dana Ledoux Miller, David Derrick Jr.",
    cast: "Auli'i Cravalho, Dwayne Johnson, Alan Tudyk, Rose Matafeo, Rachel House",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Wicked": {
    director: "Jon M. Chu",
    cast: "Cynthia Erivo, Ariana Grande, Jonathan Bailey, Jeff Goldblum, Michelle Yeoh",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Avengers: Doomsday": {
    director: "Anthony Russo, Joe Russo",
    cast: "Robert Downey Jr., Chris Evans, Chris Hemsworth, Scarlett Johansson, Tom Holland",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Mai": {
    director: "Trấn Thành",
    cast: "Phương Anh Đào, Tuấn Trần, Hồng Đào, Thái Hòa, NSND Hồng Vân",
    language: "Tiếng Việt",
  },
  "Avatar 3: Fire and Ash": {
    director: "James Cameron",
    cast: "Sam Worthington, Zoe Saldana, Sigourney Weaver, Kate Winslet, Stephen Lang",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô": {
    director: "Tomoka Nagaoka",
    cast: "Kappei Yamaguchi, Minami Takayama, Wakana Yamazaki, Rikiya Koyama",
    language: "Tiếng Nhật - Phụ đề Việt",
  },
  "Doraemon: Nobita và Bản Giao Hưởng Địa Cầu": {
    director: "Kazuaki Imai",
    cast: "Wasabi Mizuta, Megumi Ōhara, Yumi Kakazu, Subaru Kimura, Tomokazu Seki",
    language: "Tiếng Nhật - Phụ đề Việt",
  },
  "The Ring": {
    director: "Gore Verbinski",
    cast: "Naomi Watts, Martin Henderson, Brian Cox, David Dorfman, Jane Alexander",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Lật Mặt 8: Vòng Tay Nắng": {
    director: "Lý Hải",
    cast: "Lý Hải, Minh Hà, Võ Thành Tâm, Hà Trí Quang, Hồng Thanh",
    language: "Tiếng Việt",
  },
  "The Batman 2": {
    director: "Matt Reeves",
    cast: "Robert Pattinson, Zoë Kravitz, Andy Serkis, Jeffrey Wright",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Spider-Man: Beyond the Spider-Verse": {
    director: "Joaquim Dos Santos, Kemp Powers, Justin K. Thompson",
    cast: "Shameik Moore, Hailee Steinfeld, Oscar Isaac, Issa Rae, Jake Johnson",
    language: "Tiếng Anh - Phụ đề Việt",
  },
  "Kẻ Ăn Hồn": {
    director: "Trịnh Đình Lê Minh",
    cast: "Quang Tuấn, Lê Bảo Bình, Võ Điền Gia Huy, Hải Triều",
    language: "Tiếng Việt",
  },
  "Chúa Tể Địa Ngục (Lucifer)": {
    director: "Various",
    cast: "Tom Ellis, Lauren German, Kevin Alejandro, Lesley-Ann Brandt",
    language: "Tiếng Anh - Phụ đề Việt",
  },
};

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "localhost",
      port: 5000,
      path: `/api${path}`,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };
    const req = http.request(options, (res) => {
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
  // 1. Login as admin
  const loginRes = await request("POST", "/auth/login", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (!loginRes.body.token) {
    console.error("❌ Login failed:", JSON.stringify(loginRes.body));
    process.exit(1);
  }
  const token = loginRes.body.token;
  console.log("✅ Logged in as admin\n");

  // 2. Get all movies
  const moviesRes = await request("GET", "/movies", null, token);
  const movies = moviesRes.body;
  if (!Array.isArray(movies)) {
    console.error("❌ Could not fetch movies:", JSON.stringify(movies));
    process.exit(1);
  }
  console.log(`🎬 Found ${movies.length} movies in DB\n`);

  let updated = 0;
  let notFound = 0;

  // 3. Update each movie that has matching entry in MOVIE_INFO
  for (const movie of movies) {
    const info = MOVIE_INFO[movie.title];
    if (!info) {
      console.log(`⏩ No info for: "${movie.title}"`);
      notFound++;
      continue;
    }
    const payload = { director: info.director, cast: info.cast, language: info.language };
    // Some movies may have missing required fields — echo them back to pass validation
    if (!movie.screeningEndDate) {
      const futureDate = new Date(movie.releaseDate || Date.now());
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      payload.screeningEndDate = futureDate.toISOString();
    }
    const res = await request("PUT", `/movies/${movie._id}`, payload, token);
    if (res.status === 200) {
      console.log(`✅ ${movie.title}`);
      updated++;
    } else {
      console.log(`❌ Failed (${res.status}): ${movie.title}`);
    }
  }

  console.log(`\n🏁 Done: ${updated} updated, ${notFound} skipped (no info)`);
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
