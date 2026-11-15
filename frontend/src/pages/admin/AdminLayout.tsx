import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="admin">
      <div className="tilet thin" aria-hidden />
      <header className="admin-top">
        <span className="brand">Wedding guests</span>
        <nav>
          <NavLink to="/admin" end>Guests</NavLink>
          <NavLink to="/scan">Door scanner</NavLink>
          <NavLink to="/admin/settings">Wedding details</NavLink>
          <NavLink to="/admin/media">Photos &amp; music</NavLink>
          <NavLink to="/admin/staff">Staff</NavLink>
        </nav>
        <div className="who">
          <span>{user?.displayName}</span>
          <button className="link-btn" onClick={logout}>Sign out</button>
        </div>
      </header>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
