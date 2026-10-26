import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import api, { err } from './api';

const Ctx = createContext(); const useAuth = () => useContext(Ctx);
const D = d => (d ? new Date(d).toLocaleDateString() : '-'); const T = d => (d ? new Date(d).toLocaleTimeString() : '-');
const useForm = init => { const [f, sf] = useState(init); return [f, e => sf({ ...f, [e.target.name]: e.target.value }), () => sf(init), sf]; };
const useList = url => { const [l, sl] = useState([]); const load = () => api.get(url).then(r => sl(r.data)).catch(err); useEffect(() => { load(); }, []); return [l, load]; };
const Badge = ({ s }) => <span className={'badge bg-' + (s === 'Approved' ? 'success' : s === 'Rejected' ? 'danger' : 'warning text-dark')}>{s}</span>;
const Card = ({ title, children }) => <div className="card mb-4 shadow-sm"><div className="card-header fw-bold">{title}</div><div className="card-body">{children}</div></div>;

function Login() {
  const { login } = useAuth(); const nav = useNavigate(); const [reg, setReg] = useState(false); const [f, ch] = useForm({ name: '', email: '', password: '' });
  const submit = async e => { e.preventDefault(); try { const r = await api.post(reg ? '/auth/register' : '/auth/login', f); login(r.data); nav('/'); } catch (x) { err(x); } };
  return (<div className="container" style={{ maxWidth: 420, marginTop: 80 }}><div className="card shadow"><div className="card-body p-4">
    <h3 className="text-center mb-3">StaffSync</h3>
    <form onSubmit={submit}>
      {reg && <input className="form-control mb-3" name="name" placeholder="Full name" value={f.name} onChange={ch} required />}
      <input className="form-control mb-3" type="email" name="email" placeholder="Email" value={f.email} onChange={ch} required />
      <input className="form-control mb-3" type="password" name="password" placeholder="Password" value={f.password} onChange={ch} required />
      <button className="btn btn-primary w-100">{reg ? 'Register' : 'Login'}</button>
    </form>
    <button className="btn btn-link w-100 mt-2" onClick={() => setReg(!reg)}>{reg ? 'Already have an account? Login' : 'New employee? Register'}</button>
    <small className="text-muted d-block mt-2">Demo: hr@staffsync.com / manager@staffsync.com / employee@staffsync.com — password 123456</small>
  </div></div></div>);
}

function Dashboard() {
  const { user } = useAuth(); const [a] = useList('/announcements');
  return (<><h4 className="mb-3">Welcome, {user.name} <span className="badge bg-secondary">{user.role.toUpperCase()}</span></h4>
    <Card title="Latest Announcements">{a.length ? a.slice(0, 5).map(x => <div key={x._id} className="mb-2"><b>{x.title}</b> <small className="text-muted">{D(x.createdAt)}</small><div>{x.message}</div></div>) : 'No announcements'}</Card></>);
}

function Employees() {
  const { user } = useAuth(); const [list, load] = useList('/employees'); const [f, ch, reset] = useForm({ name: '', email: '', password: '', role: 'employee', department: '', phone: '' });
  const add = async e => { e.preventDefault(); try { await api.post('/employees', f); reset(); load(); } catch (x) { err(x); } };
  const del = async id => { if (confirm('Delete employee?')) { try { await api.delete('/employees/' + id); load(); } catch (x) { err(x); } } };
  return (<>{user.role === 'hr' && <Card title="Add Employee"><form onSubmit={add} className="row g-2">
    <div className="col-md-4"><input className="form-control" name="name" placeholder="Name" value={f.name} onChange={ch} required /></div>
    <div className="col-md-4"><input className="form-control" type="email" name="email" placeholder="Email" value={f.email} onChange={ch} required /></div>
    <div className="col-md-4"><input className="form-control" name="password" placeholder="Password (default 123456)" value={f.password} onChange={ch} /></div>
    <div className="col-md-3"><select className="form-select" name="role" value={f.role} onChange={ch}><option value="employee">Employee</option><option value="manager">Manager</option><option value="hr">HR</option></select></div>
    <div className="col-md-4"><input className="form-control" name="department" placeholder="Department" value={f.department} onChange={ch} /></div>
    <div className="col-md-3"><input className="form-control" name="phone" placeholder="Phone" value={f.phone} onChange={ch} /></div>
    <div className="col-md-2"><button className="btn btn-primary w-100">Add</button></div></form></Card>}
    <Card title="Employees"><div className="table-responsive"><table className="table table-hover"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Dept</th><th>Phone</th><th></th></tr></thead><tbody>
      {list.map(e => <tr key={e._id}><td>{e.name}</td><td>{e.email}</td><td>{e.role}</td><td>{e.department}</td><td>{e.phone}</td>
        <td>{user.role === 'hr' && e._id !== user._id && <button className="btn btn-sm btn-danger" onClick={() => del(e._id)}>Delete</button>}</td></tr>)}</tbody></table></div></Card></>);
}

function Leaves() {
  const { user } = useAuth(); const [list, load] = useList('/leaves'); const [f, ch, reset] = useForm({ type: 'Casual', from: '', to: '', reason: '' });
  const apply = async e => { e.preventDefault(); try { await api.post('/leaves', f); reset(); load(); } catch (x) { err(x); } };
  const set = async (id, status) => { try { await api.put('/leaves/' + id, { status }); load(); } catch (x) { err(x); } };
  const canApprove = user.role !== 'employee';
  return (<><Card title="Apply for Leave"><form onSubmit={apply} className="row g-2">
    <div className="col-md-2"><select className="form-select" name="type" value={f.type} onChange={ch}><option>Casual</option><option>Sick</option><option>Paid</option></select></div>
    <div className="col-md-2"><input className="form-control" type="date" name="from" value={f.from} onChange={ch} required /></div>
    <div className="col-md-2"><input className="form-control" type="date" name="to" value={f.to} onChange={ch} required /></div>
    <div className="col-md-4"><input className="form-control" name="reason" placeholder="Reason" value={f.reason} onChange={ch} required /></div>
    <div className="col-md-2"><button className="btn btn-primary w-100">Apply</button></div></form></Card>
    <Card title={canApprove ? 'All Leave Requests' : 'My Leaves'}><div className="table-responsive"><table className="table"><thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Reason</th><th>Status</th>{canApprove && <th>Action</th>}</tr></thead><tbody>
      {list.map(l => <tr key={l._id}><td>{l.user?.name}</td><td>{l.type}</td><td>{D(l.from)}</td><td>{D(l.to)}</td><td>{l.reason}</td><td><Badge s={l.status} /></td>
        {canApprove && <td>{l.status === 'Pending' && <><button className="btn btn-sm btn-success me-1" onClick={() => set(l._id, 'Approved')}>Approve</button><button className="btn btn-sm btn-danger" onClick={() => set(l._id, 'Rejected')}>Reject</button></>}</td>}</tr>)}</tbody></table></div></Card></>);
}

function Attendance() {
  const { user } = useAuth(); const [list, load] = useList('/attendance');
  const act = async p => { try { await api.post('/attendance/' + p); load(); } catch (x) { err(x); } };
  return (<><Card title="Mark Attendance"><button className="btn btn-success me-2" onClick={() => act('checkin')}>Check In</button><button className="btn btn-warning" onClick={() => act('checkout')}>Check Out</button></Card>
    <Card title={user.role === 'hr' ? 'All Attendance' : 'My Attendance'}><table className="table"><thead><tr><th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th></tr></thead><tbody>
      {list.map(a => <tr key={a._id}><td>{a.user?.name}</td><td>{a.date}</td><td>{T(a.checkIn)}</td><td>{T(a.checkOut)}</td></tr>)}</tbody></table></Card></>);
}

function Announcements() {
  const { user } = useAuth(); const [list, load] = useList('/announcements'); const [f, ch, reset] = useForm({ title: '', message: '' });
  const add = async e => { e.preventDefault(); try { await api.post('/announcements', f); reset(); load(); } catch (x) { err(x); } };
  const del = async id => { try { await api.delete('/announcements/' + id); load(); } catch (x) { err(x); } };
  return (<>{user.role === 'hr' && <Card title="Post Announcement / News"><form onSubmit={add}>
    <input className="form-control mb-2" name="title" placeholder="Title" value={f.title} onChange={ch} required />
    <textarea className="form-control mb-2" name="message" placeholder="Message" value={f.message} onChange={ch} required /><button className="btn btn-primary">Post</button></form></Card>}
    <Card title="Announcements">{list.map(a => <div key={a._id} className="border-bottom pb-2 mb-2"><b>{a.title}</b> <small className="text-muted">{D(a.createdAt)} by {a.postedBy?.name}</small>
      {user.role === 'hr' && <button className="btn btn-sm btn-outline-danger float-end" onClick={() => del(a._id)}>Delete</button>}<div>{a.message}</div></div>)}</Card></>);
}

function Training() {
  const { user } = useAuth(); const [list, load] = useList('/training'); const [f, ch, reset] = useForm({ title: '', description: '', date: '' });
  const can = user.role !== 'employee';
  const add = async e => { e.preventDefault(); try { await api.post('/training', f); reset(); load(); } catch (x) { err(x); } };
  const del = async id => { try { await api.delete('/training/' + id); load(); } catch (x) { err(x); } };
  return (<>{can && <Card title="Add Training Program"><form onSubmit={add} className="row g-2">
    <div className="col-md-3"><input className="form-control" name="title" placeholder="Title" value={f.title} onChange={ch} required /></div>
    <div className="col-md-4"><input className="form-control" name="description" placeholder="Description" value={f.description} onChange={ch} required /></div>
    <div className="col-md-3"><input className="form-control" type="date" name="date" value={f.date} onChange={ch} required /></div>
    <div className="col-md-2"><button className="btn btn-primary w-100">Add</button></div></form></Card>}
    <Card title="Training & Development"><table className="table"><thead><tr><th>Title</th><th>Description</th><th>Date</th><th>By</th>{can && <th></th>}</tr></thead><tbody>
      {list.map(t => <tr key={t._id}><td>{t.title}</td><td>{t.description}</td><td>{D(t.date)}</td><td>{t.createdBy?.name}</td>{can && <td><button className="btn btn-sm btn-danger" onClick={() => del(t._id)}>Delete</button></td>}</tr>)}</tbody></table></Card></>);
}

function Profile() {
  const { user, setUser } = useAuth(); const [f, ch] = useForm({ name: user.name || '', phone: user.phone || '', department: user.department || '', address: user.address || '' });
  const save = async e => { e.preventDefault(); try { const r = await api.put('/profile', f); setUser(r.data); alert('Profile updated'); } catch (x) { err(x); } };
  return (<Card title="My Profile"><form onSubmit={save}>
    <input className="form-control mb-2" value={user.email} disabled />
    {['name', 'phone', 'department', 'address'].map(k => <input key={k} className="form-control mb-2" name={k} placeholder={k} value={f[k]} onChange={ch} />)}
    <button className="btn btn-primary">Save</button></form></Card>);
}

function Layout({ children }) {
  const { user, logout } = useAuth();
  const links = [['/', 'Dashboard'], ...(user.role !== 'employee' ? [['/employees', 'Employees']] : []), ['/leaves', 'Leaves'], ['/attendance', 'Attendance'], ['/announcements', 'Announcements'], ['/training', 'Training'], ['/profile', 'Profile']];
  return (<><nav className="navbar navbar-expand navbar-dark bg-dark px-3"><span className="navbar-brand">StaffSync</span>
    <div className="navbar-nav me-auto flex-wrap">{links.map(([to, n]) => <NavLink key={to} to={to} end className="nav-link">{n}</NavLink>)}</div>
    <button className="btn btn-outline-light btn-sm" onClick={logout}>Logout</button></nav><div className="container py-4">{children}</div></>);
}

export default function App() {
  const [user, setUser] = useState(null); const [ready, setReady] = useState(false);
  useEffect(() => { if (localStorage.getItem('token')) api.get('/auth/me').then(r => setUser(r.data)).catch(() => localStorage.removeItem('token')).finally(() => setReady(true)); else setReady(true); }, []);
  const login = d => { localStorage.setItem('token', d.token); setUser(d.user); };
  const logout = () => { localStorage.removeItem('token'); setUser(null); };
  if (!ready) return null;
  const P = ({ el }) => (user ? <Layout>{el}</Layout> : <Navigate to="/login" />);
  return (<Ctx.Provider value={{ user, setUser, login, logout }}><BrowserRouter><Routes>
    <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
    <Route path="/" element={<P el={user && <Dashboard />} />} />
    <Route path="/employees" element={<P el={user && (user.role !== 'employee' ? <Employees /> : <Navigate to="/" />)} />} />
    <Route path="/leaves" element={<P el={<Leaves />} />} /><Route path="/attendance" element={<P el={<Attendance />} />} />
    <Route path="/announcements" element={<P el={<Announcements />} />} /><Route path="/training" element={<P el={<Training />} />} />
    <Route path="/profile" element={<P el={user && <Profile />} />} /><Route path="*" element={<Navigate to="/" />} />
  </Routes></BrowserRouter></Ctx.Provider>);
}
