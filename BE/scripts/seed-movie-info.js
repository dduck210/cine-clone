/**
 * Script: seed-movie-info.js
 * Cập nhật director, cast, language cho tất cả movies trong DB.
 * Usage: node BE/scripts/seed-movie-info.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const Movie = mongoose.model(
  "Movie",
  new mongoose.Schema(
    { title: String, director: String, cast: String, language: String },
    { strict: false }
  )
);

// title (exact match) → { director, cast, language }
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
};

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB\n");

  let updated = 0;
  let notFound = 0;

  for (const [title, info] of Object.entries(MOVIE_INFO)) {
    const result = await Movie.findOneAndUpdate(
      { title },
      { director: info.director, cast: info.cast, language: info.language },
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
