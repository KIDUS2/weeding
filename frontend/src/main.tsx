import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, RequireRole } from './auth';
import Home from './pages/Home';
import Invite from './pages/Invite';
import Login from './pages/Login';
import AdminLayout from './pages/admin/AdminLayout';
import Guests from './pages/admin/Guests';
import Settings from './pages/admin/Settings';
import Staff from './pages/admin/Staff';
import Media from './pages/admin/Media';
import Website from './pages/admin/Website';
import Planning from './pages/admin/Planning';
import './styles.css';

const Scan = lazy(() => import('./pages/Scan'));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/invite/:code" element={<Invite />} />
          <Route path="/login" element={<Login />} />
          <Route path="/scan" element={<RequireRole roles={['ADMIN', 'USHER']}><Suspense fallback={<div className="page-loading">Starting camera…</div>}><Scan /></Suspense></RequireRole>} />
          <Route path="/admin" element={<RequireRole roles={['ADMIN']}><AdminLayout /></RequireRole>}>
            <Route index element={<Guests />} />
            <Route path="settings" element={<Settings />} />
            <Route path="staff" element={<Staff />} />
            <Route path="media" element={<Media />} />
            <Route path="website" element={<Website />} />
            <Route path="planning" element={<Planning />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
