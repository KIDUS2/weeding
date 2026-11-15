import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  api, type BudgetLine, type BudgetLineInput, type PlanCategory, type PlanSummary, type PlanTask, type PlanTaskInput,
} from '../../api';
import '../../planning.css';

export const CATEGORIES: Record<PlanCategory, string> = {
  VENUE: 'Hall & venue', CEREMONY: 'Ceremony', FOOD: 'Food & drinks', ATTIRE: 'Dress & attire',
  PHOTO_VIDEO: 'Photo & video', MUSIC: 'Music & MC', DECOR: 'Decor & flowers', BEAUTY: 'Makeup & hair',
  TRANSPORT: 'Cars & transport', GUESTS: 'Guests & invitations', RINGS: 'Rings', HONEYMOON: 'Honeymoon', OTHER: 'Other',
};
const CAT_KEYS = Object.keys(CATEGORIES) as PlanCategory[];

const birr = (n: number | null | undefined) =>
  n == null ? '—' : `${Math.round(n).toLocaleString('en-US')} Br`;

const today = () => new Date().toISOString().slice(0, 10);
const shortDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

type Tab = 'overview' | 'checklist' | 'budget';

export default function Planning() {
  const [tab, setTab] = useState<Tab>('overview');
  const [summary, setSummary] = useState<PlanSummary | null>(null);
  const [toast, setToast] = useState('');
  const refreshSummary = useCallback(() => api.planSummary().then(setSummary), []);
  useEffect(() => { refreshSummary(); }, [refreshSummary]);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  return (
    <div className="panel wide plan">
      <div className="panel-head">
        <div>
          <h1 className="title-sm">Planning</h1>
          <p className="muted">Only you and other admins see this. Guests never do.</p>
        </div>
        {summary?.daysToGo != null && summary.daysToGo >= 0 && (
          <p className="days-to-go"><b>{summary.daysToGo}</b> days to go</p>
        )}
      </div>

      <div className="tabs" role="tablist" aria-label="Planning">
        {(['overview', 'checklist', 'budget'] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {t === 'overview' ? 'Overview' : t === 'checklist' ? 'Checklist' : 'Budget'}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="plan-body">
        {tab === 'overview' && summary && <Overview s={summary} go={setTab} onChange={refreshSummary} />}
        {tab === 'checklist' && <Checklist onChange={refreshSummary} flash={flash} weddingDate={summary?.weddingDate ?? null} />}
        {tab === 'budget' && <Budget summary={summary} onChange={refreshSummary} setSummary={setSummary} flash={flash} />}
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

/* ---------------- Overview ---------------- */

function Overview({ s, go, onChange }: { s: PlanSummary; go: (t: Tab) => void; onChange: () => void }) {
  const pct = s.tasksTotal ? Math.round((s.tasksDone / s.tasksTotal) * 100) : 0;
  const over = s.left != null && s.left < 0;
  const maxCat = Math.max(1, ...s.byCategory.map((c) => c.expected));

  return (
    <div className="ov">
      <section className="ov-tiles">
        <div className="tile">
          <span className="tile-label">Checklist</span>
          <b className="tile-num">{pct}%</b>
          <span className="tile-sub">{s.tasksDone} of {s.tasksTotal} done{s.tasksOverdue > 0 && <>, <em className="late">{s.tasksOverdue} overdue</em></>}</span>
          <span className="meter" aria-hidden><span style={{ width: `${pct}%` }} /></span>
        </div>
        <div className="tile">
          <span className="tile-label">Expected cost</span>
          <b className="tile-num">{birr(s.expected)}</b>
          <span className="tile-sub">{s.totalBudget != null ? <>of {birr(s.totalBudget)} budget</> : 'No total budget set'}</span>
          {s.totalBudget != null && s.totalBudget > 0 && (
            <span className={`meter ${over ? 'over' : ''}`} aria-hidden>
              <span style={{ width: `${Math.min(100, (s.expected / s.totalBudget) * 100)}%` }} />
            </span>
          )}
        </div>
        <div className="tile">
          <span className="tile-label">Paid so far</span>
          <b className="tile-num">{birr(s.paid)}</b>
          <span className="tile-sub">{birr(s.stillToPay)} still to pay</span>
        </div>
        <div className={`tile ${over ? 'tile-over' : ''}`}>
          <span className="tile-label">{over ? 'Over budget' : 'Left in budget'}</span>
          <b className="tile-num">{s.left == null ? '—' : birr(Math.abs(s.left))}</b>
          <span className="tile-sub">{s.left == null ? <button className="link-btn" onClick={() => go('budget')}>Set a total budget</button> : over ? 'Expected cost is above the budget' : 'After expected costs'}</span>
        </div>
      </section>

      <div className="ov-cols">
        <section className="ov-card">
          <header><h2 className="title-xs">Coming up</h2><button className="link-btn" onClick={() => go('checklist')}>Open checklist</button></header>
          {s.nextTasks.length === 0 ? (
            <p className="muted">{s.tasksTotal ? 'Everything is done. Enjoy the day!' : 'No tasks yet.'}</p>
          ) : (
            <ul className="mini-tasks">
              {s.nextTasks.map((t) => (
                <li key={t.id}>
                  <label>
                    <input type="checkbox" onChange={async () => { await api.setTaskDone(t.id, true); onChange(); }} />
                    <span>{t.title}</span>
                  </label>
                  {t.dueDate && <DueTag date={t.dueDate} />}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="ov-card">
          <header><h2 className="title-xs">Payments due</h2><button className="link-btn" onClick={() => go('budget')}>Open budget</button></header>
          {s.paymentsDue.length === 0 ? (
            <p className="muted">No dated payments waiting. Add due dates to budget lines to see them here.</p>
          ) : (
            <ul className="mini-pay">
              {s.paymentsDue.map((b) => (
                <li key={b.id}>
                  <div><strong>{b.name}</strong>{b.vendorName && <small>{b.vendorName}</small>}</div>
                  <div className="pay-right"><b>{birr((b.actual ?? b.estimated) - b.paid)}</b>{b.dueDate && <DueTag date={b.dueDate} />}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {s.byCategory.length > 0 && (
        <section className="ov-card">
          <header><h2 className="title-xs">Where the money goes</h2></header>
          <div className="legend" aria-hidden>
            <span><i className="sw sw-paid" />Paid</span>
            <span><i className="sw sw-due" />Still to pay</span>
          </div>
          <ul className="cat-bars">
            {s.byCategory.map((c) => {
              const due = Math.max(0, c.expected - c.paid);
              return (
                <li key={c.category} title={`${CATEGORIES[c.category]}: ${birr(c.paid)} paid, ${birr(due)} still to pay`}>
                  <span className="cat-name">{CATEGORIES[c.category]}</span>
                  <span className="cat-track" aria-hidden>
                    <span className="seg seg-paid" style={{ width: `${(Math.min(c.paid, c.expected) / maxCat) * 100}%` }} />
                    <span className="seg seg-due" style={{ width: `${(due / maxCat) * 100}%` }} />
                  </span>
                  <span className="cat-val">{birr(c.expected)}<small>{birr(c.paid)} paid</small></span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function DueTag({ date }: { date: string }) {
  const days = Math.round((new Date(`${date}T00:00:00`).getTime() - new Date(`${today()}T00:00:00`).getTime()) / 86400000);
  const cls = days < 0 ? 'due late' : days <= 14 ? 'due soon' : 'due';
  const text = days < 0 ? `${-days} days late` : days === 0 ? 'Today' : days <= 14 ? `In ${days} days` : shortDate(date);
  return <span className={cls}>{text}</span>;
}

/* ---------------- Checklist ---------------- */

const emptyTask: PlanTaskInput = { title: '', category: 'OTHER', dueDate: null, done: false, assignee: '', notes: '' };

function Checklist({ onChange, flash, weddingDate }: { onChange: () => void; flash: (m: string) => void; weddingDate: string | null }) {
  const [tasks, setTasks] = useState<PlanTask[] | null>(null);
  const [filter, setFilter] = useState<PlanCategory | 'ALL'>('ALL');
  const [showDone, setShowDone] = useState(false);
  const [quick, setQuick] = useState('');
  const [editing, setEditing] = useState<{ id: number | null; form: PlanTaskInput } | null>(null);

  const load = useCallback(() => api.planTasks().then(setTasks), []);
  useEffect(() => { load(); }, [load]);
  const changed = () => { load(); onChange(); };

  const groups = useMemo(() => {
    const t = today();
    const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const list = (tasks ?? []).filter((x) => filter === 'ALL' || x.category === filter);
    return [
      { key: 'late', title: 'Overdue', items: list.filter((x) => !x.done && x.dueDate && x.dueDate < t) },
      { key: 'soon', title: 'Next 30 days', items: list.filter((x) => !x.done && x.dueDate && x.dueDate >= t && x.dueDate <= in30) },
      { key: 'later', title: 'Later', items: list.filter((x) => !x.done && x.dueDate && x.dueDate > in30) },
      { key: 'nodate', title: 'No date', items: list.filter((x) => !x.done && !x.dueDate) },
      { key: 'done', title: 'Done', items: list.filter((x) => x.done) },
    ];
  }, [tasks, filter]);

  if (!tasks) return <p className="muted">Loading…</p>;

  if (tasks.length === 0) {
    return (
      <div className="suggest">
        <p><strong>Start with a ready-made Ethiopian wedding checklist</strong></p>
        <p>33 tasks, from booking the hall and church to the melse and thank-you messages.
          {weddingDate ? ` Due dates are counted back from ${shortDate(weddingDate)}.` : ' Set the wedding date in Wedding details first to get due dates.'}</p>
        <div className="row-gap center">
          <button className="btn btn-ink" onClick={async () => { await api.starterTasks(); changed(); flash('Checklist added'); }}>Add the starter checklist</button>
          <button className="btn btn-ghost" onClick={() => setEditing({ id: null, form: emptyTask })}>Start empty</button>
        </div>
        {editing && <TaskDialog {...editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); changed(); }} />}
      </div>
    );
  }

  const addQuick = async (e: FormEvent) => {
    e.preventDefault();
    if (!quick.trim()) return;
    await api.createTask({ ...emptyTask, title: quick.trim(), category: filter === 'ALL' ? 'OTHER' : filter });
    setQuick('');
    changed();
  };

  const toggle = async (t: PlanTask) => {
    setTasks((all) => all!.map((x) => (x.id === t.id ? { ...x, done: !t.done } : x)));
    await api.setTaskDone(t.id, !t.done);
    changed();
  };

  return (
    <div className="checklist">
      <div className="toolbar">
        <form onSubmit={addQuick} className="quick-add">
          <input value={quick} onChange={(e) => setQuick(e.target.value)} placeholder="Add a task and press Enter" maxLength={200} aria-label="New task" />
        </form>
        <select value={filter} onChange={(e) => setFilter(e.target.value as PlanCategory | 'ALL')} aria-label="Filter by category">
          <option value="ALL">All categories</option>
          {CAT_KEYS.map((k) => <option key={k} value={k}>{CATEGORIES[k]}</option>)}
        </select>
      </div>

      {groups.map((g) => {
        if (g.items.length === 0) return null;
        if (g.key === 'done') {
          return (
            <section key={g.key} className="task-group">
              <button className="group-toggle" aria-expanded={showDone} onClick={() => setShowDone((v) => !v)}>
                {showDone ? 'Hide' : 'Show'} {g.items.length} done
              </button>
              {showDone && <TaskList items={g.items} onToggle={toggle} onEdit={(t) => setEditing({ id: t.id, form: { ...t, assignee: t.assignee ?? '', notes: t.notes ?? '' } })} />}
            </section>
          );
        }
        return (
          <section key={g.key} className={`task-group g-${g.key}`}>
            <h3>{g.title} <span>{g.items.length}</span></h3>
            <TaskList items={g.items} onToggle={toggle} onEdit={(t) => setEditing({ id: t.id, form: { ...t, assignee: t.assignee ?? '', notes: t.notes ?? '' } })} />
          </section>
        );
      })}

      {editing && <TaskDialog {...editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); changed(); flash('Task saved'); }}
                              onDelete={editing.id ? async () => { await api.deleteTask(editing.id!); setEditing(null); changed(); flash('Task deleted'); } : undefined} />}
    </div>
  );
}

function TaskList({ items, onToggle, onEdit }: { items: PlanTask[]; onToggle: (t: PlanTask) => void; onEdit: (t: PlanTask) => void }) {
  return (
    <ul className="tasks">
      {items.map((t) => (
        <li key={t.id} className={t.done ? 'is-done' : ''}>
          <input type="checkbox" checked={t.done} onChange={() => onToggle(t)} aria-label={`Mark "${t.title}" ${t.done ? 'not done' : 'done'}`} />
          <button className="task-main" onClick={() => onEdit(t)}>
            <span className="task-title">{t.title}</span>
            <span className="task-meta">
              <span className="cat-tag">{CATEGORIES[t.category]}</span>
              {t.assignee && <span>· {t.assignee}</span>}
              {t.notes && <span className="has-note">· note</span>}
            </span>
          </button>
          {t.dueDate && !t.done && <DueTag date={t.dueDate} />}
        </li>
      ))}
    </ul>
  );
}

function TaskDialog({ id, form, onClose, onSaved, onDelete }: {
  id: number | null; form: PlanTaskInput; onClose: () => void; onSaved: () => void; onDelete?: () => void;
}) {
  const [f, setF] = useState(form);
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (id) await api.updateTask(id, f); else await api.createTask(f);
      onSaved();
    } catch (err) { setError((err as Error).message); }
  };
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form className="dialog" role="dialog" aria-modal="true" aria-labelledby="task-title" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
        <h2 id="task-title" className="title-sm">{id ? 'Edit task' : 'Add task'}</h2>
        <label className="field"><span>Task</span>
          <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required maxLength={200} autoFocus />
        </label>
        <div className="grid2">
          <label className="field"><span>Category</span>
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as PlanCategory })}>
              {CAT_KEYS.map((k) => <option key={k} value={k}>{CATEGORIES[k]}</option>)}
            </select>
          </label>
          <label className="field"><span>Due date</span>
            <input type="date" value={f.dueDate ?? ''} onChange={(e) => setF({ ...f, dueDate: e.target.value || null })} />
          </label>
        </div>
        <label className="field"><span>Who is doing it</span>
          <input value={f.assignee ?? ''} onChange={(e) => setF({ ...f, assignee: e.target.value })} maxLength={80} placeholder="e.g. Selam, the groom's brother" />
        </label>
        <label className="field"><span>Notes</span>
          <textarea rows={3} value={f.notes ?? ''} onChange={(e) => setF({ ...f, notes: e.target.value })} maxLength={1000} />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="dialog-foot">
          {onDelete && <button type="button" className="btn btn-danger" onClick={() => { if (confirm('Delete this task?')) onDelete(); }}>Delete</button>}
          <div className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-ink">Save task</button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- Budget ---------------- */

const emptyLine: BudgetLineInput = {
  name: '', category: 'VENUE', vendorName: '', vendorPhone: '', estimated: 0, actual: null, paid: 0, dueDate: null, notes: '',
};

function Budget({ summary, onChange, setSummary, flash }: {
  summary: PlanSummary | null; onChange: () => void; setSummary: (s: PlanSummary) => void; flash: (m: string) => void;
}) {
  const [lines, setLines] = useState<BudgetLine[] | null>(null);
  const [editing, setEditing] = useState<{ id: number | null; form: BudgetLineInput } | null>(null);
  const [total, setTotal] = useState<string>(summary?.totalBudget != null ? String(Math.round(summary.totalBudget)) : '');

  const load = useCallback(() => api.budget().then(setLines), []);
  useEffect(() => { load(); }, [load]);
  const changed = () => { load(); onChange(); };

  const saveTotal = async () => {
    const v = total.replace(/[^\d.]/g, '');
    const s = await api.setTotalBudget(v ? Number(v) : null);
    setSummary(s);
    flash('Total budget saved');
  };

  const byCat = useMemo(() => {
    const m = new Map<PlanCategory, BudgetLine[]>();
    (lines ?? []).forEach((l) => m.set(l.category, [...(m.get(l.category) ?? []), l]));
    return CAT_KEYS.filter((k) => m.has(k)).map((k) => ({ cat: k, items: m.get(k)! }));
  }, [lines]);

  if (!lines) return <p className="muted">Loading…</p>;

  return (
    <div className="budget">
      <div className="budget-top">
        <label className="field total-field">
          <span>Total budget (Br)</span>
          <div className="row-gap">
            <input inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="e.g. 500000" onBlur={saveTotal}
                   onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
          </div>
        </label>
        {summary && (
          <dl className="budget-sums">
            <div><dt>Expected</dt><dd>{birr(summary.expected)}</dd></div>
            <div><dt>Paid</dt><dd>{birr(summary.paid)}</dd></div>
            <div><dt>Still to pay</dt><dd>{birr(summary.stillToPay)}</dd></div>
            {summary.left != null && <div className={summary.left < 0 ? 'neg' : ''}><dt>{summary.left < 0 ? 'Over by' : 'Left'}</dt><dd>{birr(Math.abs(summary.left))}</dd></div>}
          </dl>
        )}
        <button className="btn btn-ink" onClick={() => setEditing({ id: null, form: emptyLine })}>Add cost</button>
      </div>

      {lines.length === 0 ? (
        <div className="suggest">
          <p>No costs yet. Add the hall, catering, photographer and so on. Use the estimate first, then fill in the agreed price and what you've paid.</p>
          <div className="chips">
            {(['VENUE', 'FOOD', 'PHOTO_VIDEO', 'ATTIRE', 'MUSIC', 'DECOR', 'TRANSPORT', 'BEAUTY'] as PlanCategory[]).map((c) => (
              <button key={c} className="chip" onClick={() => setEditing({ id: null, form: { ...emptyLine, category: c, name: CATEGORIES[c] } })}>+ {CATEGORIES[c]}</button>
            ))}
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="guests budget-table">
            <thead>
              <tr><th>Item</th><th>Vendor</th><th className="num">Estimate</th><th className="num">Agreed</th><th className="num">Paid</th><th className="num">To pay</th><th><span className="sr">Edit</span></th></tr>
            </thead>
            {byCat.map(({ cat, items }) => {
              const exp = items.reduce((a, l) => a + (l.actual ?? l.estimated), 0);
              const paid = items.reduce((a, l) => a + l.paid, 0);
              return (
                <tbody key={cat}>
                  <tr className="cat-row"><th colSpan={2}>{CATEGORIES[cat]}</th><td className="num" colSpan={2}>{birr(exp)}</td><td className="num">{birr(paid)}</td><td className="num">{birr(Math.max(0, exp - paid))}</td><td /></tr>
                  {items.map((l) => {
                    const toPay = Math.max(0, (l.actual ?? l.estimated) - l.paid);
                    return (
                      <tr key={l.id}>
                        <td><strong>{l.name}</strong>{l.dueDate && toPay > 0 && <DueTag date={l.dueDate} />}</td>
                        <td>{l.vendorName ?? <span className="muted">—</span>}{l.vendorPhone && <a className="tel" href={`tel:${l.vendorPhone}`}>{l.vendorPhone}</a>}</td>
                        <td className="num muted">{birr(l.estimated)}</td>
                        <td className="num">{l.actual != null ? birr(l.actual) : <span className="muted">—</span>}</td>
                        <td className="num">{birr(l.paid)}</td>
                        <td className="num">{toPay > 0 ? <b>{birr(toPay)}</b> : <span className="paid-tag">Paid</span>}</td>
                        <td className="actions"><button className="btn btn-small btn-ghost" onClick={() => setEditing({ id: l.id, form: { ...l, vendorName: l.vendorName ?? '', vendorPhone: l.vendorPhone ?? '', notes: l.notes ?? '' } })}>Edit</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              );
            })}
          </table>
        </div>
      )}

      {editing && (
        <BudgetDialog {...editing} onClose={() => setEditing(null)}
                      onSaved={() => { setEditing(null); changed(); flash('Saved'); }}
                      onDelete={editing.id ? async () => { await api.deleteBudget(editing.id!); setEditing(null); changed(); flash('Deleted'); } : undefined} />
      )}
    </div>
  );
}

function MoneyInput({ label, value, onChange, optional }: { label: string; value: number | null; onChange: (v: number | null) => void; optional?: boolean }) {
  return (
    <label className="field"><span>{label}</span>
      <input inputMode="decimal" value={value ?? ''} placeholder={optional ? 'Not agreed yet' : '0'}
             onChange={(e) => {
               const v = e.target.value.replace(/[^\d.]/g, '');
               onChange(v === '' ? (optional ? null : 0) : Number(v));
             }} />
    </label>
  );
}

function BudgetDialog({ id, form, onClose, onSaved, onDelete }: {
  id: number | null; form: BudgetLineInput; onClose: () => void; onSaved: () => void; onDelete?: () => void;
}) {
  const [f, setF] = useState(form);
  const [error, setError] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (id) await api.updateBudget(id, f); else await api.createBudget(f);
      onSaved();
    } catch (err) { setError((err as Error).message); }
  };
  const toPay = Math.max(0, (f.actual ?? f.estimated) - f.paid);
  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form className="dialog" role="dialog" aria-modal="true" aria-labelledby="cost-title" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
        <h2 id="cost-title" className="title-sm">{id ? 'Edit cost' : 'Add cost'}</h2>
        <div className="grid2">
          <label className="field"><span>What is it</span>
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required maxLength={200} autoFocus />
          </label>
          <label className="field"><span>Category</span>
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as PlanCategory })}>
              {CAT_KEYS.map((k) => <option key={k} value={k}>{CATEGORIES[k]}</option>)}
            </select>
          </label>
          <label className="field"><span>Vendor</span>
            <input value={f.vendorName ?? ''} onChange={(e) => setF({ ...f, vendorName: e.target.value })} maxLength={160} />
          </label>
          <label className="field"><span>Vendor phone</span>
            <input inputMode="tel" value={f.vendorPhone ?? ''} onChange={(e) => setF({ ...f, vendorPhone: e.target.value })} maxLength={40} placeholder="09…" />
          </label>
        </div>
        <div className="grid3">
          <MoneyInput label="Estimate (Br)" value={f.estimated} onChange={(v) => setF({ ...f, estimated: v ?? 0 })} />
          <MoneyInput label="Agreed price (Br)" value={f.actual} onChange={(v) => setF({ ...f, actual: v })} optional />
          <MoneyInput label="Paid so far (Br)" value={f.paid} onChange={(v) => setF({ ...f, paid: v ?? 0 })} />
        </div>
        <p className="muted small">Still to pay: <b>{birr(toPay)}</b></p>
        <div className="grid2">
          <label className="field"><span>Next payment due</span>
            <input type="date" value={f.dueDate ?? ''} onChange={(e) => setF({ ...f, dueDate: e.target.value || null })} />
          </label>
          <label className="field"><span>Notes</span>
            <input value={f.notes ?? ''} onChange={(e) => setF({ ...f, notes: e.target.value })} maxLength={1000} />
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="dialog-foot">
          {onDelete && <button type="button" className="btn btn-danger" onClick={() => { if (confirm('Delete this cost?')) onDelete(); }}>Delete</button>}
          <div className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-ink">Save cost</button>
        </div>
      </form>
    </div>
  );
}
