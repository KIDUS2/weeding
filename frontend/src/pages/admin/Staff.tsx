import { useEffect, useState, type FormEvent } from 'react';
import { api, type Role, type User } from '../../api';
import { useAuth } from '../../auth';

export default function Staff() {
  const { user: me } = useAuth();
  const [staff, setStaff] = useState<User[]>([]);
  const [form, setForm] = useState({ username: '', password: '', displayName: '', role: 'USHER' as Role });
  const [error, setError] = useState('');

  const load = () => api.staff().then(setStaff);
  useEffect(() => { load(); }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.createStaff(form);
      setForm({ username: '', password: '', displayName: '', role: 'USHER' });
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const act = async (fn: () => Promise<unknown>) => {
    setError('');
    try { await fn(); load(); } catch (err) { setError((err as Error).message); }
  };

  return (
    <div className="panel">
      <h1 className="title-sm">Staff</h1>
      <p className="muted">Ushers can only use the door scanner. Admins manage everything.</p>

      <table className="guests">
        <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th><span className="sr">Actions</span></th></tr></thead>
        <tbody>
          {staff.map((s) => (
            <tr key={s.id}>
              <td><strong>{s.displayName}</strong></td>
              <td>{s.username}</td>
              <td>{s.role === 'ADMIN' ? 'Admin' : 'Usher'}</td>
              <td>{s.active ? 'Active' : <span className="muted">Disabled</span>}</td>
              <td className="actions">
                <button className="btn btn-small btn-ghost" onClick={() => {
                  const p = prompt(`New password for ${s.displayName} (at least 6 characters)`);
                  if (p) void act(() => api.updateStaff(s.id, { password: p }));
                }}>Set password</button>
                {s.id !== me?.id && (
                  <>
                    <button className="btn btn-small btn-ghost" onClick={() => act(() => api.updateStaff(s.id, { active: !s.active }))}>
                      {s.active ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn btn-small btn-danger" onClick={() => {
                      if (confirm(`Remove ${s.displayName}?`)) void act(() => api.deleteStaff(s.id));
                    }}>Remove</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form onSubmit={add} className="add-staff">
        <h2 className="title-xs">Add staff member</h2>
        <div className="grid2">
          <label className="field"><span>Name</span>
            <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required />
          </label>
          <label className="field"><span>Username</span>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required minLength={3} autoCapitalize="none" />
          </label>
          <label className="field"><span>Password</span>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </label>
          <label className="field"><span>Role</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="USHER">Usher (door only)</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-ink">Add staff member</button>
      </form>
    </div>
  );
}
