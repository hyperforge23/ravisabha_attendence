const { MongoClient } = require('mongodb');

const uri = 'mongodb://dhyan:puw8NMtuHijBUcVg@ac-j2jytdi-shard-00-00.jtdnnju.mongodb.net:27017,ac-j2jytdi-shard-00-01.jtdnnju.mongodb.net:27017,ac-j2jytdi-shard-00-02.jtdnnju.mongodb.net:27017/ravishabha_attendence?ssl=true&replicaSet=atlas-7ov270-shard-0&authSource=admin';

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  console.log('Connected to MongoDB Atlas');

  const col = client.db('ravishabha_attendence').collection('ravisabha_details');

  const total = await col.countDocuments({});
  const withField = await col.countDocuments({ pre_attendance: { $exists: true } });
  const withoutField = await col.countDocuments({ pre_attendance: { $exists: false } });

  console.log('Total docs:', total);
  console.log('With pre_attendance:', withField);
  console.log('Without pre_attendance:', withoutField);

  const sample = await col.find({}).limit(3).toArray();
  console.log('Sample docs:');
  sample.forEach(function(d) {
    console.log('  date:', d.date, '| pre_attendance:', d.pre_attendance);
  });

  await client.close();
  console.log('Connection closed.');
}

run().catch(console.error);
