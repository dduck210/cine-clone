/**
 * Database Recovery Script — Orphaned Reviews
 *
 * Finds reviews whose user reference points to a deleted/non-existent user,
 * and sets user to null so the API fallback ("Người dùng đã xóa") kicks in.
 *
 * Usage: node BE/recover-orphaned-reviews.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cine-clone';

async function recover() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('[Recovery] Connected to MongoDB');

        const Review = require('./models/Review');
        const User = require('./models/User');

        // Step 1: Find all reviews
        const allReviews = await Review.find({}).lean();
        console.log(`[Recovery] Total reviews in database: ${allReviews.length}`);

        // Step 2: Find reviews with non-null user that point to deleted users
        const reviewsWithUser = allReviews.filter(r => r.user != null);
        const userIds = [...new Set(reviewsWithUser.map(r => r.user.toString()))];

        console.log(`[Recovery] Unique user IDs referenced in reviews: ${userIds.length}`);

        const existingUsers = await User.find({ _id: { $in: userIds } }).select('_id').lean();
        const existingUserIds = new Set(existingUsers.map(u => u._id.toString()));

        const orphanedWithStaleRef = reviewsWithUser.filter(
            r => !existingUserIds.has(r.user.toString())
        );

        console.log(`[Recovery] Reviews with stale user reference (user deleted): ${orphanedWithStaleRef.length}`);

        // Step 3: Find reviews with user already null
        const alreadyOrphaned = allReviews.filter(r => r.user == null);
        console.log(`[Recovery] Reviews already orphaned (user=null): ${alreadyOrphaned.length}`);

        // Step 4: Fix orphaned reviews — set user to null
        if (orphanedWithStaleRef.length > 0) {
            const idsToFix = orphanedWithStaleRef.map(r => r._id);
            const result = await Review.updateMany(
                { _id: { $in: idsToFix } },
                { $set: { user: null } }
            );
            console.log(`[Recovery] Fixed ${result.modifiedCount} orphaned reviews (user set to null)`);
        }

        // Step 5: Summary
        const finalState = await Review.find({}).lean();
        const finalOrphaned = finalState.filter(r => r.user == null);
        const finalValid = finalState.filter(r => r.user != null);

        console.log('\n--- Recovery Summary ---');
        console.log(`Total reviews: ${finalState.length}`);
        console.log(`Valid reviews (with existing user): ${finalValid.length}`);
        console.log(`Orphaned reviews (user deleted): ${finalOrphaned.length}`);

        if (finalOrphaned.length > 0) {
            console.log('\nOrphaned review IDs (will display as "Người dùng đã xóa"):');
            finalOrphaned.forEach(r => {
                console.log(`  - ${r._id} | movie: ${r.movie} | rating: ${r.rating} | "${(r.comment || '').substring(0, 60)}"`);
            });
        }

        console.log('\n[Recovery] Done.');
    } catch (error) {
        console.error('[Recovery] Error:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('[Recovery] Disconnected from MongoDB');
    }
}

recover();
