/**
 * Migration Script: Add pre_attendance field to existing ravisabha_details documents
 *
 * PURPOSE:
 *   Adds `pre_attendance: false` to every existing document in the
 *   `ravisabha_details` collection that does NOT already have the field.
 *   Existing data is NOT deleted or modified in any other way.
 *
 * HOW TO RUN (two options):
 *
 * Option A – Node.js (recommended):
 *   1. npm install mongodb   (if not already installed in the project)
 *   2. node scripts/migrate_pre_attendance.js
 *      (set env vars MONGODB_URI and MONGODB_DB if needed)
 *
 * Option B – MongoDB Compass Shell:
 *   1. Open MongoDB Compass → Connect to your cluster
 *   2. Click "Open MongoDB Shell" at the bottom
 *   3. Switch to your database:  use ravisabha   (or your actual DB name)
 *   4. Paste and run the following two lines:
 *
 *       db.ravisabha_details.updateMany(
 *         { pre_attendance: { $exists: false } },
 *         { $set: { pre_attendance: false } }
 *       )
 *
 * SAFE TO RE-RUN: Uses `$exists: false` filter so it only patches
 * documents that genuinely lack the field – running multiple times is harmless.
 */

const { MongoClient } = require('mongodb');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://dhyan:puw8NMtuHijBUcVg@ac-j2jytdi-shard-00-00.jtdnnju.mongodb.net:27017,ac-j2jytdi-shard-00-01.jtdnnju.mongodb.net:27017,ac-j2jytdi-shard-00-02.jtdnnju.mongodb.net:27017/ravishabha_attendence?ssl=true&replicaSet=atlas-7ov270-shard-0&authSource=admin&retryWrites=true&w=majority';
const DB_NAME   = process.env.MONGODB_DB  || 'ravishabha_attendence';
// ─────────────────────────────────────────────────────────────────────────────

async function runMigration() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const collection = db.collection('ravisabha_details');

    // Count documents that still need the field
    const toUpdateCount = await collection.countDocuments({
      pre_attendance: { $exists: false },
    });

    if (toUpdateCount === 0) {
      console.log('✅ All documents already have the pre_attendance field. Nothing to migrate.');
      return;
    }

    console.log(`🔄 Found ${toUpdateCount} document(s) missing pre_attendance. Migrating...`);

    const result = await collection.updateMany(
      { pre_attendance: { $exists: false } }, // Only patch docs without the field
      { $set: { pre_attendance: false } }
    );

    console.log(`✅ Migration complete!`);
    console.log(`   Matched  : ${result.matchedCount}`);
    console.log(`   Modified : ${result.modifiedCount}`);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Connection closed.');
  }
}

runMigration();
