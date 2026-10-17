import fs from "node:fs";
import mongoose from "mongoose";

function loadLocalEnv() {
  if (process.env.MONGODB_URI) return;
  const contents = fs.readFileSync(".env.local", "utf8");
  const match = contents.match(/^MONGODB_URI=(.+)$/m);
  if (match) process.env.MONGODB_URI = match[1].trim();
}

loadLocalEnv();

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is required");
}

const execute = process.argv.includes("--execute");
const filter = { SmkId: /^Non_/i };

await mongoose.connect(process.env.MONGODB_URI);

try {
  const db = mongoose.connection.db;
  const source = db.collection("smkdetails");
  const destination = db.collection("non_smk_candidates");
  const candidates = await source.find(filter).toArray();

  console.log(`${execute ? "EXECUTE" : "DRY RUN"}: ${candidates.length} candidate(s) found`);
  console.log(
    JSON.stringify(
      candidates.slice(0, 10).map((candidate) => ({
        _id: candidate._id,
        SmkId: candidate.SmkId,
        name: [candidate.FirstName, candidate.MiddleName, candidate.LastName]
          .filter(Boolean)
          .join(" "),
      })),
      null,
      2
    )
  );

  if (!execute) {
    console.log(
      "No changes made. Re-run with --execute after reviewing the candidates."
    );
    process.exitCode = 0;
  } else {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        if (candidates.length > 0) {
          await destination.bulkWrite(
            candidates.map((candidate) => ({
              replaceOne: {
                filter: { _id: candidate._id },
                replacement: candidate,
                upsert: true,
              },
            })),
            { session, ordered: false }
          );

          const copiedCount = await destination.countDocuments(
            { _id: { $in: candidates.map((candidate) => candidate._id) } },
            { session }
          );
          if (copiedCount !== candidates.length) {
            throw new Error(
              `Verification failed: expected ${candidates.length} copied documents, found ${copiedCount}`
            );
          }

          await source.deleteMany(
            { _id: { $in: candidates.map((candidate) => candidate._id) } },
            { session }
          );
        }

        await db.collection("sequences").updateOne(
          { key: "non_smk_kutumb_id" },
          { $setOnInsert: { key: "non_smk_kutumb_id", value: 100000 } },
          { upsert: true, session }
        );
      });
      console.log(
        `Migrated ${candidates.length} candidate(s), preserving _id values. Kutumb counter is ready at 100000 or above.`
      );
    } finally {
      await session.endSession();
    }
  }
} finally {
  await mongoose.disconnect();
}
