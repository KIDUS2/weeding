import { useEffect, useState, type FormEvent } from 'react';
import { api, formatTime, type SiteItem, type SiteItemInput, type SiteKind } from '../../api';

const TABS: { kind: SiteKind; label: string; intro: string; add: string }[] = [
  { kind: 'EVENT', label: 'Schedule', intro: 'Each part of the day with its own time and place. Shown in time order.', add: 'Add event' },
  { kind: 'STORY', label: 'Our story', intro: 'Moments from how you met to the proposal, shown as a timeline.', add: 'Add moment' },
  { kind: 'FAQ', label: 'Questions', intro: 'Answer what guests usually ask before they ask it.', add: 'Add question' },
];

/** One-tap starting points, common at Ethiopian weddings. */
const SUGGESTIONS: Record<SiteKind, Partial<SiteItemInput>[]> = {
  EVENT: [
    { title: 'Church ceremony', titleAm: 'የቤተ ክርስቲያን ሥነ ሥርዓት' },
    { title: 'Photo session', titleAm: 'የፎቶ ፕሮግራም' },
    { title: 'Reception', titleAm: 'የሰርግ ግብዣ' },
    { title: 'Melse', titleAm: 'መልስ' },
  ],
  STORY: [
    { label: '', title: 'How we met', titleAm: 'እንዴት ተገናኘን' },
    { label: '', title: 'First date', titleAm: 'የመጀመሪያ ቀጠሯችን' },
    { label: '', title: 'The proposal', titleAm: 'የጋብቻ ጥያቄው' },
    { label: '', title: 'Telosh / engagement', titleAm: 'ጥሎሽ' },
  ],
  FAQ: [
    { title: 'Is there parking at the hall?', titleAm: 'አዳራሹ ላይ የመኪና ማቆሚያ አለ?' },
    { title: 'Can I bring my children?', titleAm: 'ልጆቼን ይዤ መምጣት እችላለሁ?' },
    { title: 'What should I wear?', titleAm: 'ምን ልልበስ?' },
    { title: 'Can I bring a guest who is not on my invitation?', titleAm: 'በግብዣዬ ላይ ያልተጠቀሰ ሰው ይዤ መምጣት እችላለሁ?' },
  ],
};

const blank = (kind: SiteKind): SiteItemInput => ({
  kind, title: '', titleAm: '', body: '', bodyAm: '', label: '', startsAt: null, endsAt: null,
  venueName: '', venueAddress: '', mapUrl: '',
});

const dayLabel = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

export default function Website() {
  const [tab, setTab] = useState<SiteKind>('EVENT');
  const [items, setItems] = useState<SiteItem[]>([]);
  const [editing, setEditing] = useState<{ id: number | null; form: SiteItemInput } | null>(null);
  const [toast, setToast] = useState('');
  const meta = TABS.find((t) => t.kind === tab)!;

  const load = (k = tab) => api.siteItems(k).then(setItems);
  useEffect(() => { load(tab); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const move = async (i: number, dir: -1 | 1) => {
    const next = [...items];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
    await api.reorderSiteItems(tab, next.map((x) => x.id));
  };

  const startNew = (preset?: Partial<SiteItemInput>) => setEditing({ id: null, form: { ...blank(tab), ...preset } });
  const startEdit = (it: SiteItem) => setEditing({
    id: it.id,
    form: { ...blank(it.kind), ...Object.fromEntries(Object.entries(it).map(([k, v]) => [k, v ?? ''])), startsAt: it.startsAt, endsAt: it.endsAt } as SiteItemInput,
  });

  return (
    <div className="panel wide">
      <h1 className="title-sm">Wedding website</h1>
      <p className="muted">These sections appear on every guest's invitation, in English or Amharic.</p>

      <div className="tabs" role="tablist" aria-label="Sections">
        {TABS.map((t) => (
          <button key={t.kind} role="tab" aria-selected={tab === t.kind} onClick={() => setTab(t.kind)}>{t.label}</button>
        ))}
      </div>

      <div role="tabpanel">
        <div className="tab-head">
          <p className="muted">{meta.intro}</p>
          <button className="btn btn-ink" onClick={() => startNew()}>{meta.add}</button>
        </div>

        {items.length === 0 ? (
          <div className="suggest">
            <p>Nothing here yet. Start from one of these:</p>
            <div className="chips">
              {SUGGESTIONS[tab].map((s) => (
                <button key={s.title} className="chip" onClick={() => startNew(s)}>+ {s.title}</button>
              ))}
            </div>
          </div>
        ) : (
          <ol className={`site-list kind-${tab.toLowerCase()}`}>
            {items.map((it, i) => (
              <li key={it.id}>
                <div className="site-when">
                  {tab === 'EVENT' && it.startsAt && <><b>{formatTime(it.startsAt)}</b><small>{dayLabel(it.startsAt)}</small></>}
                  {tab === 'STORY' && <b>{it.label || '—'}</b>}
                  {tab === 'FAQ' && <b>Q</b>}
                </div>
                <div className="site-main">
                  <strong>{it.title}</strong>
                  {it.titleAm && <span lang="am" className="muted">{it.titleAm}</span>}
                  {tab === 'EVENT' && it.venueName && <span className="muted small">{it.venueName}</span>}
                  {it.body && <p className="site-body">{it.body}</p>}
                  {!it.titleAm && <span className="hint-am">No Amharic yet</span>}
                </div>
                <div className="site-tools">
                  {tab !== 'EVENT' && (
                    <>
                      <button className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                      <button className="icon-btn" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">↓</button>
                    </>
                  )}
                  <button className="btn btn-small btn-ghost" onClick={() => startEdit(it)}>Edit</button>
                  <button className="btn btn-small btn-danger" onClick={async () => {
                    if (!confirm(`Delete "${it.title}"?`)) return;
                    await api.deleteSiteItem(it.id); load(); flash('Deleted');
                  }}>Delete</button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {editing && (
        <ItemDialog
          id={editing.id}
          initial={editing.form}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); flash('Saved'); }}
        />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function ItemDialog({ id, initial, onClose, onSaved }: {
  id: number | null; initial: SiteItemInput; onClose: () => void; onSaved: () => void;
}) {
  const [f, setF] = useState<SiteItemInput>(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof SiteItemInput>(k: K, v: SiteItemInput[K]) => setF((x) => ({ ...x, [k]: v }));
  const k = f.kind;
  const dt = (v: string | null) => v?.slice(0, 16) ?? '';
  const toIso = (v: string) => (v ? `${v}:00` : null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (id) await api.updateSiteItem(id, f); else await api.createSiteItem(f);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const titleLabel = k === 'EVENT' ? 'Event name' : k === 'STORY' ? 'Title' : 'Question';
  const bodyLabel = k === 'EVENT' ? 'Details for guests' : k === 'STORY' ? 'The story' : 'Answer';

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form className="dialog" role="dialog" aria-modal="true" aria-labelledby="item-title" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
        <h2 id="item-title" className="title-sm">{id ? 'Edit' : 'Add'} {k === 'EVENT' ? 'event' : k === 'STORY' ? 'moment' : 'question'}</h2>

        {k === 'STORY' && (
          <label className="field"><span>When</span>
            <input value={f.label ?? ''} onChange={(e) => set('label', e.target.value)} maxLength={60} placeholder="e.g. 2019, or March 2023" />
          </label>
        )}

        <div className="grid2">
          <label className="field"><span>{titleLabel}</span>
            <input value={f.title} onChange={(e) => set('title', e.target.value)} required maxLength={200} autoFocus />
          </label>
          <label className="field"><span>{titleLabel} (Amharic)</span>
            <input lang="am" value={f.titleAm ?? ''} onChange={(e) => set('titleAm', e.target.value)} maxLength={200} />
          </label>
        </div>

        {k === 'EVENT' && (
          <>
            <div className="grid2">
              <label className="field"><span>Starts</span>
                <input type="datetime-local" value={dt(f.startsAt)} onChange={(e) => set('startsAt', toIso(e.target.value))} required />
              </label>
              <label className="field"><span>Ends (optional)</span>
                <input type="datetime-local" value={dt(f.endsAt)} min={dt(f.startsAt)} onChange={(e) => set('endsAt', toIso(e.target.value))} />
              </label>
              <label className="field"><span>Place</span>
                <input value={f.venueName ?? ''} onChange={(e) => set('venueName', e.target.value)} maxLength={200} placeholder="e.g. Kidist Mariam Church" />
              </label>
              <label className="field"><span>Address</span>
                <input value={f.venueAddress ?? ''} onChange={(e) => set('venueAddress', e.target.value)} maxLength={300} />
              </label>
            </div>
            <label className="field"><span>Map link</span>
              <input type="url" value={f.mapUrl ?? ''} onChange={(e) => set('mapUrl', e.target.value)} maxLength={500} placeholder="https://maps.app.goo.gl/…" />
            </label>
          </>
        )}

        <label className="field"><span>{bodyLabel}</span>
          <textarea rows={3} value={f.body ?? ''} onChange={(e) => set('body', e.target.value)} maxLength={4000} />
        </label>
        <label className="field"><span>{bodyLabel} (Amharic)</span>
          <textarea lang="am" rows={3} value={f.bodyAm ?? ''} onChange={(e) => set('bodyAm', e.target.value)} maxLength={4000} />
        </label>

        {error && <p className="error">{error}</p>}
        <div className="dialog-foot">
          <div className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-ink" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
