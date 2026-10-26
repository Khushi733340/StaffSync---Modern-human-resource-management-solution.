const bcrypt = require('bcryptjs'); const { User } = require('./models');
module.exports = async () => {
  if (await User.countDocuments()) return;
  const p = await bcrypt.hash('123456', 10);
  await User.insertMany([
    { name: 'HR Admin', email: 'hr@staffsync.com', password: p, role: 'hr', department: 'HR' },
    { name: 'Team Manager', email: 'manager@staffsync.com', password: p, role: 'manager', department: 'IT' },
    { name: 'Demo Employee', email: 'employee@staffsync.com', password: p, role: 'employee', department: 'IT' }]);
  console.log('Demo users created (password: 123456)');
};
