import fs from "node:fs";
import mongoose from "mongoose";

function loadLocalEnv() {
  if (process.env.MONGODB_URI) return;
  const contents = fs.readFileSync(".env.local", "utf8");
  const match = contents.match(/^MONGODB_URI=(.+)$/m);
  if (match) process.env.MONGODB_URI = match[1].trim();
}

loadLocalEnv();

const execute = process.argv.includes("--execute");
const reset = process.argv.includes("--reset");

const TEST_CANDIDATES = [
  {
    SmkId: "Non_TEST_KUTUMB_ELIG",
    BhaktId: 900001,
    FirstName: "Kutumb",
    LastName: "Eligible",
    MobileNo: 9876500001,
    PresentVillageEng: "Test Village",
    AddressDescription:
      "12 Shanti Society, Opp. Test Mandir, Test Village, Ahmedabad - 380001",
    ravisabhaPresentCount: 3,
  },
  {
    SmkId: "Non_TEST_KUTUMB_PENDING",
    BhaktId: 900002,
    FirstName: "Kutumb",
    LastName: "Pending",
    MobileNo: 9876500002,
    PresentVillageEng: "Demo Nagar",
    AddressDescription:
      "45 Demo Flat, Demo Nagar, Near Ring Road, Ahmedabad - 380015",
    ravisabhaPresentCount: 2,
  },
];

async function resetTestKutumbData(db, spec) {
  const smkDetailsCol = db.collection("smkdetails");
  const candidatesCol = db.collection("non_smk_candidates");
  const attendanceCol = db.collection("ravisabha_attendances");

  const kutumbIds = new Set();
  const relatedSmk = await smkDetailsCol
    .find({ SmkId: spec.SmkId })
    .project({ _id: 1, KutumbId: 1 })
    .toArray();
  for (const row of relatedSmk) {
    if (row.KutumbId != null) kutumbIds.add(row.KutumbId);
  }

  let removedMembers = 0;
  for (const kutumbId of kutumbIds) {
    const result = await smkDetailsCol.deleteMany({ KutumbId: kutumbId });
    removedMembers += result.deletedCount;
  }

  const removedBySmkId = await smkDetailsCol.deleteMany({ SmkId: spec.SmkId });
  await candidatesCol.deleteMany({ SmkId: spec.SmkId });
  await attendanceCol.deleteMany({ SmkId: spec.SmkId });

  return {
    kutumbIds: [...kutumbIds],
    removedSmkRows: removedMembers + removedBySmkId.deletedCount,
  };
}

await mongoose.connect(process.env.MONGODB_URI);

try {
  const db = mongoose.connection.db;
  const candidatesCol = db.collection("non_smk_candidates");
  const attendanceCol = db.collection("ravisabha_attendances");
  const ravisabhaCol = db.collection("ravisabha_details");
  const usersCol = db.collection("users");

  const ravisabhas = await ravisabhaCol.find({}).sort({ date: -1 }).toArray();
  if (ravisabhas.length < 3) {
    throw new Error(
      `Need at least 3 ravisabhas in DB; found ${ravisabhas.length}`
    );
  }

  const adminUser = await usersCol.findOne({});
  if (!adminUser) {
    throw new Error("No user in users collection (required for attendance userId)");
  }

  const plan = [];

  for (const spec of TEST_CANDIDATES) {
    if (reset && execute) {
      const resetInfo = await resetTestKutumbData(db, spec);
      plan.push({
        smkNo: spec.SmkId,
        reset: resetInfo,
      });
    } else if (!reset) {
      const smkDetailsCol = db.collection("smkdetails");
      const promotedMain = await smkDetailsCol.findOne({
        SmkId: spec.SmkId,
        IsMainPersonInFamily: true,
        KutumbId: { $gte: 100001 },
      });

      if (promotedMain) {
        if (execute) {
          await candidatesCol.deleteMany({ SmkId: spec.SmkId });
        }
        plan.push({
          name: `${spec.FirstName} ${spec.LastName}`,
          smkNo: spec.SmkId,
          mobile: spec.MobileNo,
          skipped: true,
          reason: "Already promoted to Kutumb (run with --reset to re-test)",
          kutumbId: promotedMain.KutumbId,
        });
        continue;
      }
    }

    const doc = {
      BhaktId: spec.BhaktId,
      SmkId: spec.SmkId,
      FirstName: spec.FirstName,
      LastName: spec.LastName,
      MobileNo: spec.MobileNo,
      Gender: 1,
      PresentVillageEng: spec.PresentVillageEng,
      AddressDescription: spec.AddressDescription,
      KutumbId: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let candidateId;
    if (execute) {
      const { insertedId } = await candidatesCol.insertOne(doc);
      candidateId = insertedId;
    }

    const targetRavisabhas = ravisabhas.slice(0, spec.ravisabhaPresentCount);
    plan.push({
      name: `${spec.FirstName} ${spec.LastName}`,
      smkNo: spec.SmkId,
      mobile: spec.MobileNo,
      presentVillageEng: spec.PresentVillageEng,
      addressDescription: spec.AddressDescription,
      candidateId: candidateId?.toString(),
      attendanceRavisabhas: targetRavisabhas.map((r) => ({
        id: r._id.toString(),
        date: r.date,
      })),
      eligible: spec.ravisabhaPresentCount >= 3,
    });

    if (execute && candidateId) {
      const rows = targetRavisabhas.map((r) => ({
        smkDetailId: candidateId,
        userId: adminUser._id,
        ravisabhaId: r._id,
        status: "present",
        SmkId: spec.SmkId,
        name: `${spec.FirstName} ${spec.LastName}`,
        date: r.date ? new Date(r.date) : new Date(),
        bhojan: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      if (rows.length > 0) {
        await attendanceCol.insertMany(rows);
      }
    }
  }

  console.log(execute ? "EXECUTED" : "DRY RUN", reset ? "(with --reset)" : "");
  console.log(JSON.stringify(plan, null, 2));
  if (!execute) {
    console.log(
      "\nRe-run with: node scripts/seed-kutumb-test-attendance.mjs --execute --reset"
    );
  }
} finally {
  await mongoose.disconnect();
}
