// One-off script: add poster + backdrop for "Chúa Tể Địa Ngục (Lucifer)"
const mongoose = require("mongoose");
require("dotenv").config();

// Both verified 200 OK from https://www.themoviedb.org/tv/63174-lucifer
const POSTER   = "https://image.tmdb.org/t/p/w780/hf7PS5SgyPPKYEm83OY9M2bAAsK.jpg";
const BACKDROP = "https://image.tmdb.org/t/p/w1280/mAXOCbZzvmDa6PCh5dcIPOB51Qc.jpg";

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Movie = require("../models/Movie");

  const result = await Movie.findOneAndUpdate(
    { title: /lucifer/i },
    { $set: { poster: POSTER, backdrop: BACKDROP } },
    { new: true }
  );

  if (result) {
    console.log(`✓ Updated: ${result.title}`);
    console.log(`  poster:   ${result.poster}`);
    console.log(`  backdrop: ${result.backdrop}`);
  } else {
    console.log("✗ Movie not found — check title in DB");
  }

  mongoose.disconnect();
}).catch((e) => console.error("DB error:", e.message));
