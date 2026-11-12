import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  api, formatTime, inviteUrl, sideLabel,
  type Guest, type GuestInput, type Side, type Stats, type WeddingEvent,
} from '../../api';
import Qr from '../../components/Qr';
import { downloadInviteCard } from '../../components/inviteCard';

type Filter = 'all' | 'pending' | 'attending' | 'declined' | 'inside' | 'notInside';

const empty: GuestInput = { fullName: '', phone: '', side: 'BOTH', tableName: '', seats: 1, notes: '' };

function shareText(g: Guest, ev: WeddingEvent | null) {
  const couple = ev ? `${ev.brideName} & ${ev.groomName}` : 'our';
  return `Dear ${g.fullName}, you are invited to ${couple} wedding. Your personal invitation and entry QR code: ${inviteUrl(g.inviteCode)}`;
}

/** Ethiopian numbers like 0911… -> 251911… for wa.me */
function waNumber(phone: string | null) {
  if (!phone) return '';
  const d = phone.replace(/\D/g, '');
  if (d.startsWith('0')) return '251' + d.slice(1);
  return d;
}

export default function Guests() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<Guest | 'new' | null>(null);
  const [sharing, setSharing] = useState<Guest | null>(null);
  const [toast, setToast] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    api.guests().then(setGuests);
    api.stats().then(setStats);
  }, []);

  useEffect(() => { load(); api.event().then(setEvent); }, [load]);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500); };

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return guests.filter((g) => {
      if (s && !(g.fullName.toLowerCase().includes(s) || g.phone?.includes(s)
        || g.inviteCode.toLowerCase().includes(s) || g.tableName?.toLowerCase().includes(s))) return false;
      switch (filter) {
        case 'pending': return g.rsvpStatus === 'PENDING';
        case 'attending': return g.rsvpStatus === 'ATTENDING';
        case 'declined': return g.rsvpStatus === 'DECLINED';
        case 'inside': return g.checkedInCount > 0;
        case 'notInside': return g.checkedInCount === 0 && g.rsvpStatus !== 'DECLINED';
        default: return true;
      }
    });
  }, [guests, q, filter]);

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const r = await api.importGuests(file);
      flash(`Imported ${r.created} guest(s)${r.skipped ? `, skipped ${r.skipped}: ${r.errors.slice(0, 3).join('; ')}` : ''}`);
      load();
    } catch (e) {
      flash((e as Error).message);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const remove = async (g: Guest) => {
    if (!confirm(`Delete the invitation for ${g.fullName}? Their QR code will stop working.`)) return;
    await api.deleteGuest(g.id);
    flash('Invitation deleted');
    load();
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    flash('Copied');
  };

  return (
    <>
      {stats && (
        <section className="stats" aria-label="Summary">
          <div><b>{stats.invitations}</b><span>invitations, {stats.totalSeats} seats</span></div>
          <div><b>{stats.attendingPeople}</b><span>coming ({stats.attendingInvitations} invitations)</span></div>
          <div><b>{stats.pendingInvitations}</b><span>waiting for an answer</span></div>
          <div><b>{stats.declinedInvitations}</b><span>declined</span></div>
          <div className="stat-inside"><b>{stats.checkedInPeople}</b><span>inside the hall now</span></div>
        </section>
      )}

      <section className="toolbar">
        <input type="search" placeholder="Search name, phone, table or code" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} aria-label="Filter">
          <option value="all">All guests</option>
          <option value="pending">No answer yet</option>
          <option value="attending">Coming</option>
          <option value="declined">Declined</option>
          <option value="inside">Inside the hall</option>
          <option value="notInside">Not arrived yet</option>
        </select>
        <div className="spacer" />
        <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>Import CSV</button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => onImport(e.target.files?.[0])} />
        <button className="btn btn-ink" onClick={() => setEditing('new')}>Add guest</button>
      </section>
      <p className="muted small">CSV columns: name, phone, seats, side (bride/groom/both), table, notes.</p>

      <div className="table-wrap">
        <table className="guests">
          <thead>
            <tr><th>Guest</th><th>Seats</th><th>RSVP</th><th>At the door</th><th>Table</th><th><span className="sr">Actions</span></th></tr>
          </thead>
          <tbody>
            {shown.map((g) => (
              <tr key={g.id}>
                <td>
                  <strong>{g.fullName}</strong>
                  <small>{g.phone ?? 'No phone'} · {sideLabel[g.side]}</small>
                </td>
                <td>{g.seats}</td>
                <td>
                  <span className={`pill pill-${g.rsvpStatus.toLowerCase()}`}>
                    {g.rsvpStatus === 'ATTENDING' ? `Coming (${g.rsvpCount})` : g.rsvpStatus === 'DECLINED' ? 'Declined' : 'No answer'}
                  </span>
                </td>
                <td>
                  {g.checkedInCount > 0
                    ? <span className="pill pill-inside">{g.checkedInCount}/{g.seats} in, {formatTime(g.lastCheckedInAt)}</span>
                    : <span className="muted">Not arrived</span>}
                </td>
                <td>{g.tableName ?? '—'}</td>
                <td className="actions">
                  <button className="btn btn-small btn-gold" onClick={() => setSharing(g)}>Send invite</button>
                  <button className="btn btn-small btn-ghost" onClick={() => setEditing(g)}>Edit</button>
                  <button className="btn btn-small btn-danger" onClick={() => remove(g)}>Delete</button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={6} className="empty">
                {guests.length === 0 ? 'No guests yet. Add your first guest or import a CSV list.' : 'No guests match this search.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <GuestDialog
          guest={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(g, created) => {
            setEditing(null);
            load();
            flash(created ? 'Guest added' : 'Guest saved');
            if (created) setSharing(g);
          }}
        />
      )}

      {sharing && (
        <div className="dialog-backdrop" onClick={() => setSharing(null)}>
          <div className="dialog share" role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="share-title" className="title-sm">Send invitation to {sharing.fullName}</h2>
            <div className="medallion small"><Qr value={inviteUrl(sharing.inviteCode)} size={180} /></div>
            <p className="code-line">Code <b>{sharing.inviteCode}</b></p>
            <div className="share-grid">
              <a className="btn btn-ink" target="_blank" rel="noreferrer"
                 href={`https://t.me/share/url?url=${encodeURIComponent(inviteUrl(sharing.inviteCode))}&text=${encodeURIComponent(shareText(sharing, event))}`}>
                Telegram
              </a>
              <a className="btn btn-ink" target="_blank" rel="noreferrer"
                 href={`https://wa.me/${waNumber(sharing.phone)}?text=${encodeURIComponent(shareText(sharing, event))}`}>
                WhatsApp
              </a>
              {sharing.phone && (
                <a className="btn btn-ink" href={`sms:${sharing.phone}?body=${encodeURIComponent(shareText(sharing, event))}`}>SMS</a>
              )}
              <button className="btn btn-ghost" onClick={() => copy(inviteUrl(sharing.inviteCode))}>Copy link</button>
              <button className="btn btn-gold" onClick={() => downloadInviteCard(sharing.fullName, sharing.seats, sharing.inviteCode, event)}>
                Download card image
              </button>
              <a className="btn btn-ghost" href={inviteUrl(sharing.inviteCode)} target="_blank" rel="noreferrer">Preview</a>
            </div>
            <div className="dialog-foot">
              {sharing.checkedInCount > 0 && (
                <button className="link-btn" onClick={async () => {
                  if (!confirm('Reset check-in? The guest will be able to enter again.')) return;
                  setSharing(await api.resetCheckin(sharing.id)); load(); flash('Check-in reset');
                }}>Reset check-in</button>
              )}
              <button className="link-btn" onClick={async () => {
                if (!confirm('Create a new code? The old link and QR stop working.')) return;
                setSharing(await api.regenerateCode(sharing.id)); load(); flash('New code created');
              }}>Replace code</button>
              <div className="spacer" />
              <button className="btn btn-ghost" onClick={() => setSharing(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

function GuestDialog({ guest, onClose, onSaved }: {
  guest: Guest | null; onClose: () => void; onSaved: (g: Guest, created: boolean) => void;
}) {
  const [form, setForm] = useState<GuestInput>(guest ? {
    fullName: guest.fullName, phone: guest.phone ?? '', side: guest.side,
    tableName: guest.tableName ?? '', seats: guest.seats, notes: guest.notes ?? '',
  } : empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof GuestInput>(k: K, v: GuestInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const saved = guest ? await api.updateGuest(guest.id, form) : await api.createGuest(form);
      onSaved(saved, !guest);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form className="dialog" role="dialog" aria-modal="true" aria-labelledby="guest-title" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
        <h2 id="guest-title" className="title-sm">{guest ? 'Edit guest' : 'Add guest'}</h2>
        <label className="field"><span>Name on the invitation</span>
          <input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} required maxLength={160} autoFocus
                 placeholder="e.g. Ato Abebe Kebede & family" />
        </label>
        <div className="grid2">
          <label className="field"><span>Phone</span>
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} maxLength={40} inputMode="tel" placeholder="09…" />
          </label>
          <label className="field"><span>People allowed</span>
            <input type="number" min={Math.max(1, guest?.checkedInCount ?? 1)} max={50} value={form.seats}
                   onChange={(e) => set('seats', Number(e.target.value))} required />
          </label>
          <label className="field"><span>Side</span>
            <select value={form.side} onChange={(e) => set('side', e.target.value as Side)}>
              <option value="BRIDE">Bride's side</option>
              <option value="GROOM">Groom's side</option>
              <option value="BOTH">Both families</option>
            </select>
          </label>
          <label className="field"><span>Table</span>
            <input value={form.tableName} onChange={(e) => set('tableName', e.target.value)} maxLength={60} />
          </label>
        </div>
        <label className="field"><span>Note for door staff</span>
          <input value={form.notes} onChange={(e) => set('notes', e.target.value)} maxLength={500} placeholder="e.g. VIP, seat near the front" />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="dialog-foot">
          <div className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-ink" disabled={busy}>{guest ? 'Save guest' : 'Add guest'}</button>
        </div>
      </form>
    </div>
  );
}
