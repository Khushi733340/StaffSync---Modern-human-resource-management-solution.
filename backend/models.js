const m = require('mongoose'), { Schema } = m;
const ref = { type: Schema.Types.ObjectId, ref: 'User' };
exports.User = m.model('User', new Schema({ name: String, email: { type: String, unique: true, lowercase: true }, password: String,
  role: { type: String, enum: ['hr', 'manager', 'employee'], default: 'employee' }, department: String, phone: String, address: String }, { timestamps: true }));
exports.Leave = m.model('Leave', new Schema({ user: ref, type: String, from: Date, to: Date, reason: String, status: { type: String, default: 'Pending' } }, { timestamps: true }));
exports.Attendance = m.model('Attendance', new Schema({ user: ref, date: String, checkIn: Date, checkOut: Date }));
exports.Announcement = m.model('Announcement', new Schema({ title: String, message: String, postedBy: ref }, { timestamps: true }));
exports.Training = m.model('Training', new Schema({ title: String, description: String, date: Date, createdBy: ref }, { timestamps: true }));
