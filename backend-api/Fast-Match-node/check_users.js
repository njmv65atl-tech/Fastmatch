const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb+srv://njmv65atl_db_user:KK1pIRyz5ZsLYifN@fastmatch.fni3ard.mongodb.net/fastmatch');
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}, { projection: { profilePicture: 1, displayName: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(10).toArray();
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}
run();
