const r = require('express').Router(), jwt = require('jsonwebtoken'), bcrypt = require('bcryptjs');
const { User, Leave, Attendance, Announcement, Training } = require('./models');
const w = f => (q, s) => f(q, s).catch(e => s.status(400).json({ message: e.message }));
const auth = async (q, s, n) => { try { const t = (q.headers.authorization || '').split(' ')[1];
  const d = jwt.verify(t, process.env.JWT_SECRET); q.user = await User.findById(d.id).select('-password'); if (!q.user) throw 0; n(); }
  catch { s.status(401).json({ message: 'Unauthorized, please login again' }); } };
const only = (...roles) => (q, s, n) => roles.includes(q.user.role) ? n() : s.status(403).json({ message: 'Access denied' });
const token = u => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const clean = u => { const o = u.toObject(); delete o.password; return o; };
const today = () => new Date().toISOString().slice(0, 10);

r.post('/auth/register', w(async (q, s) => { const { name, email, password } = q.body;
  if (!name || !email || !password) throw new Error('All fields required');
  if (await User.findOne({ email })) throw new Error('Email already exists');
  const u = await User.create({ name, email, password: await bcrypt.hash(password, 10), role: 'employee' });
  s.json({ token: token(u), user: clean(u) }); }));
r.post('/auth/login', w(async (q, s) => { const u = await User.findOne({ email: (q.body.email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(q.body.password || '', u.password))) throw new Error('Invalid email or password');
  s.json({ token: token(u), user: clean(u) }); }));
r.get('/auth/me', auth, (q, s) => s.json(q.user));
r.put('/profile', auth, w(async (q, s) => { const { name, phone, department, address } = q.body;
  s.json(await User.findByIdAndUpdate(q.user._id, { name, phone, department, address }, { new: true }).select('-password')); }));

r.get('/employees', auth, only('hr', 'manager'), w(async (q, s) => s.json(await User.find().select('-password').sort('name'))));
r.post('/employees', auth, only('hr'), w(async (q, s) => { const b = q.body;
  if (await User.findOne({ email: b.email })) throw new Error('Email already exists');
  const u = await User.create({ ...b, password: await bcrypt.hash(b.password || '123456', 10) }); s.json(clean(u)); }));
r.delete('/employees/:id', auth, only('hr'), w(async (q, s) => { await User.findByIdAndDelete(q.params.id); s.json({ ok: true }); }));

r.get('/leaves', auth, w(async (q, s) => s.json(await Leave.find(q.user.role === 'employee' ? { user: q.user._id } : {}).populate('user', 'name').sort('-createdAt'))));
r.post('/leaves', auth, w(async (q, s) => s.json(await Leave.create({ ...q.body, user: q.user._id }))));
r.put('/leaves/:id', auth, only('hr', 'manager'), w(async (q, s) => s.json(await Leave.findByIdAndUpdate(q.params.id, { status: q.body.status }, { new: true }))));

r.get('/attendance', auth, w(async (q, s) => s.json(await Attendance.find(q.user.role === 'hr' ? {} : { user: q.user._id }).populate('user', 'name').sort('-date'))));
r.post('/attendance/checkin', auth, w(async (q, s) => { if (await Attendance.findOne({ user: q.user._id, date: today() })) throw new Error('Already checked in today');
  s.json(await Attendance.create({ user: q.user._id, date: today(), checkIn: new Date() })); }));
r.post('/attendance/checkout', auth, w(async (q, s) => { const a = await Attendance.findOne({ user: q.user._id, date: today() });
  if (!a) throw new Error('Check in first'); if (a.checkOut) throw new Error('Already checked out'); a.checkOut = new Date(); s.json(await a.save()); }));

r.get('/announcements', auth, w(async (q, s) => s.json(await Announcement.find().populate('postedBy', 'name').sort('-createdAt'))));
r.post('/announcements', auth, only('hr'), w(async (q, s) => s.json(await Announcement.create({ ...q.body, postedBy: q.user._id }))));
r.delete('/announcements/:id', auth, only('hr'), w(async (q, s) => { await Announcement.findByIdAndDelete(q.params.id); s.json({ ok: true }); }));

r.get('/training', auth, w(async (q, s) => s.json(await Training.find().populate('createdBy', 'name').sort('-createdAt'))));
r.post('/training', auth, only('hr', 'manager'), w(async (q, s) => s.json(await Training.create({ ...q.body, createdBy: q.user._id }))));
r.delete('/training/:id', auth, only('hr', 'manager'), w(async (q, s) => { await Training.findByIdAndDelete(q.params.id); s.json({ ok: true }); }));
module.exports = r;
