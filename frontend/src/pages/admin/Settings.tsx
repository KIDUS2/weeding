import { useEffect, useState, type FormEvent } from 'react';
import { api, type WeddingEvent } from '../../api';

export default function Settings() {
  const [ev, setEv] = useState<WeddingEvent | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { api.event().then(setEv); }, []);
  if (!ev) return <p className="muted">Loading…</p>;

  const set = <K extends keyof WeddingEvent>(k: K, v: WeddingEvent[K]) => setEv({ ...ev, [k]: v });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setEv(await api.saveEvent(ev));
      setMsg('Wedding details saved');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form className="panel" onSubmit={save}>
      <h1 className="title-sm">Wedding details</h1>
      <p className="muted">These appear on every guest's invitation.</p>
      <div className="grid2">
        <label className="field"><span>Bride</span>
          <input value={ev.brideName} onChange={(e) => set('brideName', e.target.value)} required maxLength={120} />
        </label>
        <label className="field"><span>Groom</span>
          <input value={ev.groomName} onChange={(e) => set('groomName', e.target.value)} required maxLength={120} />
        </label>
        <label className="field"><span>Date and time</span>
          <input type="datetime-local" value={ev.eventDate?.slice(0, 16) ?? ''}
                 onChange={(e) => set('eventDate', e.target.value ? `${e.target.value}:00` : null)} />
        </label>
        <label className="field"><span>Dress code</span>
          <input value={ev.dressCode ?? ''} onChange={(e) => set('dressCode', e.target.value)} maxLength={200}
                 placeholder="e.g. Traditional habesha attire" />
        </label>
        <label className="field"><span>Hall name</span>
          <input value={ev.venueName ?? ''} onChange={(e) => set('venueName', e.target.value)} maxLength={200} />
        </label>
        <label className="field"><span>Address</span>
          <input value={ev.venueAddress ?? ''} onChange={(e) => set('venueAddress', e.target.value)} maxLength={300} />
        </label>
      </div>
      <label className="field"><span>Map link</span>
        <input type="url" value={ev.mapUrl ?? ''} onChange={(e) => set('mapUrl', e.target.value)} maxLength={500}
               placeholder="https://maps.google.com/…" />
      </label>
      <label className="field"><span>Invitation message</span>
        <textarea rows={4} value={ev.message ?? ''} onChange={(e) => set('message', e.target.value)} maxLength={2000} />
      </label>
      {error && <p className="error">{error}</p>}
      {msg && <p className="ok">{msg}</p>}
      <button className="btn btn-ink">Save details</button>
    </form>
  );
}
