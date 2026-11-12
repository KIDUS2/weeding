import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { api, formatTime, sideLabel, type CheckinEntry, type ScanResult, type Stats } from '../api';
import { useAuth } from '../auth';

type View =
  | { kind: 'scanning' }
  | { kind: 'loading' }
  | { kind: 'found'; result: ScanResult }
  | { kind: 'admitted'; result: ScanResult; people: number }
  | { kind: 'error'; message: string };

const READER_ID = 'qr-reader';

export default function Scan() {
  const { user, logout } = useAuth();
  const [view, setView] = useState<View>({ kind: 'scanning' });
  const [people, setPeople] = useState(1);
  const [manual, setManual] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<CheckinEntry[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [busy, setBusy] = useState(false);

  const scanner = useRef<Html5Qrcode | null>(null);
  const started = useRef<Promise<unknown> | null>(null);
  const handling = useRef(false);

  const refresh = useCallback(() => {
    api.stats().then(setStats).catch(() => {});
    api.recent().then(setRecent).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [refresh]);

  const pause = () => { try { scanner.current?.pause(true); } catch { /* not running */ } };
  const resume = () => {
    handling.current = false;
    try { scanner.current?.resume(); } catch { /* not paused */ }
  };

  const handleCode = useCallback(async (raw: string) => {
    if (handling.current) return;
    handling.current = true;
    pause();
    navigator.vibrate?.(60);
    setView({ kind: 'loading' });
    try {
      const result = await api.lookup(raw);
      setPeople(Math.max(1, Math.min(result.remaining, result.rsvpCount || result.remaining)));
      setView({ kind: 'found', result });
    } catch (e) {
      navigator.vibrate?.([80, 60, 80]);
      setView({ kind: 'error', message: (e as Error).message });
    }
  }, []);

  useEffect(() => {
    const s = new Html5Qrcode(READER_ID, { verbose: false });
    scanner.current = s;
    started.current = s
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: (w, h) => { const m = Math.floor(Math.min(w, h) * 0.7); return { width: m, height: m }; } },
        (text) => { void handleCode(text); },
        () => { /* no QR in frame */ },
      )
      .catch((e: unknown) => setCameraError(
        String(e).includes('Permission') || String(e).includes('NotAllowed')
          ? 'Camera access was blocked. Allow camera access for this site in your browser settings, then reload.'
          : 'The camera could not start. The site must be opened over https, or type the code below instead.',
      ));
    return () => {
      const p = started.current;
      started.current = null;
      void p?.then(() => s.stop()).then(() => s.clear()).catch(() => {});
    };
  }, [handleCode]);

  const approve = async () => {
    if (view.kind !== 'found') return;
    setBusy(true);
    try {
      const result = await api.approve(view.result.code, people);
      navigator.vibrate?.(150);
      setView({ kind: 'admitted', result, people });
      refresh();
      setTimeout(() => {
        setView((v) => (v.kind === 'admitted' ? { kind: 'scanning' } : v));
        resume();
      }, 2500);
    } catch (e) {
      setView({ kind: 'error', message: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const next = () => { setView({ kind: 'scanning' }); resume(); };

  const submitManual = (e: FormEvent) => {
    e.preventDefault();
    if (manual.trim()) { void handleCode(manual); setManual(''); }
  };

  return (
    <main className="scan">
      <header className="scan-top">
        <div>
          <strong>Door check-in</strong>
          <small>{user?.displayName}</small>
        </div>
        {stats && (
          <div className="scan-count" aria-label="People inside">
            <b>{stats.checkedInPeople}</b>
            <small>inside of {stats.attendingPeople || stats.totalSeats} expected</small>
          </div>
        )}
        <nav>
          {user?.role === 'ADMIN' && <Link to="/admin">Admin</Link>}
          <button className="link-btn light" onClick={logout}>Sign out</button>
        </nav>
      </header>

      <div className="reader-wrap">
        <div id={READER_ID} className="reader" />
        {cameraError && <p className="camera-error">{cameraError}</p>}

        {view.kind !== 'scanning' && (
          <div className={`result result-${view.kind === 'found' && view.result.fullyCheckedIn ? 'error' : view.kind}`} role="status">
            {view.kind === 'loading' && <p className="result-title">Checking invitation…</p>}

            {view.kind === 'error' && (
              <>
                <p className="result-icon" aria-hidden>✕</p>
                <p className="result-title">Do not admit</p>
                <p>{view.message}</p>
                <button className="btn btn-light wide" onClick={next}>Scan next guest</button>
              </>
            )}

            {view.kind === 'found' && (
              <>
                <p className="result-title">{view.result.guestName}</p>
                <ul className="result-facts">
                  <li>{sideLabel[view.result.side]}{view.result.tableName ? `, table ${view.result.tableName}` : ''}</li>
                  <li>Invitation for {view.result.seats}; {view.result.checkedInCount} already inside</li>
                  {view.result.rsvpStatus === 'DECLINED' && <li className="warn">This guest said they would not attend</li>}
                  {view.result.rsvpStatus === 'PENDING' && <li>No RSVP received</li>}
                  {view.result.notes && <li className="warn">Note: {view.result.notes}</li>}
                </ul>
                {view.result.fullyCheckedIn ? (
                  <>
                    <p className="result-title">Already entered</p>
                    <p>All seats were used. Last entry at {formatTime(view.result.lastCheckedInAt)}.</p>
                    <button className="btn btn-light wide" onClick={next}>Scan next guest</button>
                  </>
                ) : (
                  <>
                    <div className="stepper" aria-label="People entering now">
                      <button onClick={() => setPeople((p) => Math.max(1, p - 1))} disabled={people <= 1} aria-label="One fewer">−</button>
                      <output>{people}<small>{people === 1 ? 'person' : 'people'} entering</small></output>
                      <button onClick={() => setPeople((p) => Math.min(view.result.remaining, p + 1))} disabled={people >= view.result.remaining} aria-label="One more">+</button>
                    </div>
                    <button className="btn btn-approve wide" onClick={approve} disabled={busy}>
                      {busy ? 'Admitting…' : `Admit ${people}`}
                    </button>
                    <button className="link-btn light" onClick={next}>Cancel</button>
                  </>
                )}
              </>
            )}

            {view.kind === 'admitted' && (
              <>
                <p className="result-icon" aria-hidden>✓</p>
                <p className="result-title">Welcome, {view.result.guestName}</p>
                <p>Admitted {view.people}. {view.result.remaining > 0 ? `${view.result.remaining} seat(s) left on this invitation.` : ''}</p>
              </>
            )}
          </div>
        )}
      </div>

      <form className="manual" onSubmit={submitManual}>
        <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Or type the invitation code"
               autoCapitalize="characters" aria-label="Invitation code" />
        <button className="btn btn-gold">Check</button>
      </form>

      <section className="recent">
        <button className="link-btn light" onClick={() => setShowRecent((s) => !s)} aria-expanded={showRecent}>
          {showRecent ? 'Hide recent entries' : `Recent entries (${recent.length})`}
        </button>
        {showRecent && (
          <ul>
            {recent.map((r) => (
              <li key={r.id}><span>{formatTime(r.at)}</span> {r.guestName} <em>+{r.people}</em> <small>{r.scannedBy}</small></li>
            ))}
            {recent.length === 0 && <li>No one has entered yet.</li>}
          </ul>
        )}
      </section>
    </main>
  );
}
