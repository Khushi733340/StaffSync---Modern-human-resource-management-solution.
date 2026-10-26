require('dotenv').config();
const express = require('express'), mongoose = require('mongoose'), cors = require('cors');
const app = express();
app.use(cors()); app.use(express.json());
app.use('/api', require('./routes'));
async function connect() {
  if (process.env.MONGO_URI) {
    try { await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }); return console.log('MongoDB connected'); }
    catch (e) { console.log('MONGO_URI failed, using built-in database...'); }
  }
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri());
  console.log('Built-in database started (data resets on restart)');
}
connect().then(async () => {
  await require('./seed')();
  app.listen(process.env.PORT || 5000, () => console.log('Server running on port ' + (process.env.PORT || 5000)));
}).catch(e => console.error('DB error:', e.message));
