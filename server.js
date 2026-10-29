const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const { Alumni } = require('./models');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// forwards rejected promises to the error handler (exception handling)
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);

// Read: query operators ($regex, $or, $gte, $in) + projection (field list)
app.get('/api/alumni', wrap(async (req, res) => {
  const { q, batch, dept, limit } = req.query, filter = {};
  if (q) filter.$or = ['name', 'company', 'role'].map(k => ({ [k]: { $regex: q, $options: 'i' } }));
  if (batch) filter.batch = { $gte: +batch };
  if (dept) filter.dept = { $in: dept.split(',') };
  res.json(await Alumni.find(filter, 'name role company location dept batch photo connections').sort('-connections name').limit(+limit || 0));
}));

app.get('/api/alumni/stats', wrap(async (req, res) => {
  const [alumni, companies, [sum]] = await Promise.all([
    Alumni.countDocuments(), Alumni.distinct('company'),
    Alumni.aggregate([{ $group: { _id: null, total: { $sum: '$connections' } } }]),
  ]);
  res.json({ alumni, companies: companies.length, connections: sum ? sum.total : 0 });
}));

app.get('/api/alumni/:id', wrap(async (req, res) => {
  const a = await Alumni.findById(req.params.id, '-__v');
  a ? res.json(a) : res.status(404).json({ error: 'Alumni not found' });
}));

app.post('/api/alumni', wrap(async (req, res) => res.status(201).json(await Alumni.create(req.body))));

// Update: $inc operator
app.patch('/api/alumni/:id/connect', wrap(async (req, res) => {
  const a = await Alumni.findByIdAndUpdate(req.params.id, { $inc: { connections: 1 } }, { new: true, projection: 'connections' });
  a ? res.json(a) : res.status(404).json({ error: 'Alumni not found' });
}));

app.delete('/api/alumni/:id', wrap(async (req, res) => {
  await Alumni.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found' }));

app.use((err, req, res, next) => {
  const code = ['ValidationError', 'CastError'].includes(err.name) ? 400 : err.code === 11000 ? 409 : 500;
  res.status(code).json({ error: err.code === 11000 ? 'Email already registered' : err.message });
});

// Seed from JSON file using a callback-style fs call
const seed = () => fs.readFile('data/alumni.json', 'utf8', async (err, text) => {
  if (err || await Alumni.countDocuments({ photo: { $exists: true } })) return;
  await Alumni.deleteMany({ email: /@example\.com$/ }); // remove the old placeholder profiles
  await Alumni.insertMany(JSON.parse(text));
  console.log('Seeded Karunya distinguished alumni');
});

(async () => {
  // already running? say so instead of failing on the database lock
  const running = await fetch('http://localhost:3000/api/alumni/stats').then(r => r.ok, () => false);
  if (running) return console.log('Alumni Connect is already running. Just open http://localhost:3000 in your browser.');

  let uri = process.env.MONGO_URI;
  if (!uri) { // no MONGO_URI: start a local MongoDB that stores data in ./mongo-data
    fs.mkdirSync('mongo-data', { recursive: true });
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create({ instance: { dbPath: 'mongo-data', storageEngine: 'wiredTiger' } });
    uri = mongod.getUri();
    // stop MongoDB cleanly on Ctrl-C so it never keeps mongo-data/ locked
    process.on('SIGINT', async () => { await mongod.stop({ doCleanup: false }); process.exit(); });
  }
  await mongoose.connect(uri);
  await Alumni.syncIndexes(); // email index is now unique + sparse
  seed();
  app.listen(3000, () => console.log('Alumni Connect running at http://localhost:3000'));
})().catch(e => { console.error('Startup failed:', e.message); process.exit(1); });
