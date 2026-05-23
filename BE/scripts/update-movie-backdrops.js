/**
 * Script: update-movie-backdrops.js
 * Auto-fetch TMDB backdrop images for all movies in DB and update the backdrop field.
 * Usage: TMDB_API_KEY=<your_key> node BE/scripts/update-movie-backdrops.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const https = require("https");
const mongoose = require("mongoose");

const TMDB_KEY = process.env.TMDB_API_KEY;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const TMDB_IMG = "https://image.tmdb.org/t/p/original";

if (!TMDB_KEY) {
  console.error("❌ Thiếu TMDB_API_KEY trong .env");
  process.exit(1);
}

// Minimal Movie schema (only fields we need)
const Movie = mongoose.model(
  "Movie",
  new mongoose.Schema({ title: String, backdrop: String }, { strict: false })
);

function tmdbGet(path) {
  return new Promise((resolve, reject) => {
    const url = `https://api.themoviedb.org/3${path}&api_key=${TMDB_KEY}`;
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

async function findBackdrop(title) {
  // Search in English first, then Vietnamese
  for (const lang of ["en-US", "vi-VN"]) {
    const q = encodeURIComponent(title);
    const data = await tmdbGet(`/search/movie?query=${q}&language=${lang}&page=1`);
    if (data.results && data.results.length > 0) {
      // Pick result with a backdrop
      const hit = data.results.find((r) => r.backdrop_path) || data.results[0];
      if (hit && hit.backdrop_path) {
        return `${TMDB_IMG}${hit.backdrop_path}`;
      }
    }
  }
  return null;
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const movies = await Movie.find({ backdrop: { $in: [null, "", undefined] } }).select("_id title backdrop");
  console.log(`🎬 Found ${movies.length} movies without backdrop\n`);

  let updated = 0;
  let skipped = 0;

  for (const movie of movies) {
    // Skip test/dummy movies
    if (/^(test|dsfds|fasdsad|ádf)/i.test(movie.title)) {
      console.log(`  ⏩ Skip: ${movie.title}`);
      skipped++;
      continue;
    }

    const backdrop = await findBackdrop(movie.title);

    if (backdrop) {
      await Movie.findByIdAndUpdate(movie._id, { backdrop });
      console.log(`  ✅ ${movie.title}`);
      console.log(`     → ${backdrop}`);
      updated++;
    } else {
      console.log(`  ⚠️  Not found on TMDB: ${movie.title}`);
      skipped++;
    }

    // Respect TMDB rate limit (40 req/10s)
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n🏁 Done: ${updated} updated, ${skipped} skipped`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
