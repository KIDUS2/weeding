import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, formatDate, inviteUrl, type Invite as InviteT } from '../api';
import Qr from '../components/Qr';
import Countdown from '../components/Countdown';
import { downloadInviteCard } from '../components/inviteCard';

export default function Invite() {
  const { code = '' } = useParams();
  const [inv, setInv] = useState<InviteT | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [count, setCount] = useState(1);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [rsvpError, setRsvpError] = useState('');

  useEffect(() => {
    api.invite(code)
      .then((i) => { setInv(i); setCount(i.rsvpCount || i.seats); })
      .catch((e) => setError(e.message));
  }, [code]);

  if (error) {
    return (
      <main className="stage">
        <section className="card"><div className="card-body">
          <h1 className="title-sm">This invitation link isn't valid</h1>
          <p>Check that you opened the full link you were sent, or contact the couple's family.</p>
        </div></section>
      </main>
    );
  }
  if (!inv) return <div className="page-loading">Opening your invitation…</div>;

  const ev = inv.event;
  const showForm = inv.rsvpStatus === 'PENDING' || editing;

  const send = async (attending: boolean) => {
    setBusy(true);
    setRsvpError('');
    try {
      const updated = await api.rsvp(code, attending, attending ? count : 0, note);
      setInv(updated);
      setEditing(false);
    } catch (e) {
      setRsvpError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="stage">
      <article className="card invite-card reveal">
        <div className="tilet" aria-hidden />
        <div className="card-body">
          <p className="invite-lead">Dear {inv.guestName},<br />you are warmly invited to the wedding of</p>
          <h1 className="couple">
            <span>{ev?.brideName}</span>
            <span className="amp" aria-label="and">&amp;</span>
            <span>{ev?.groomName}</span>
          </h1>
          {ev?.message && <p className="message">{ev.message}</p>}

          <dl className="details">
            <div><dt>When</dt><dd>{formatDate(ev?.eventDate ?? null)}</dd></div>
            {ev?.venueName && (
              <div><dt>Where</dt><dd>
                {ev.venueName}
                {ev.venueAddress && <><br /><small>{ev.venueAddress}</small></>}
                {ev.mapUrl && <><br /><a href={ev.mapUrl} target="_blank" rel="noreferrer">Open in maps</a></>}
              </dd></div>
            )}
            {ev?.dressCode && <div><dt>Dress code</dt><dd>{ev.dressCode}</dd></div>}
            {inv.tableName && <div><dt>Your table</dt><dd>{inv.tableName}</dd></div>}
          </dl>

          {ev?.eventDate && <Countdown to={ev.eventDate} />}

          <div className="medallion">
            <Qr value={inviteUrl(inv.code)} size={220} />
          </div>
          <p className="admits">
            {inv.seats === 1 ? 'Admits 1 person' : `Admits ${inv.seats} people`}
            <span className="code">Code {inv.code}</span>
          </p>
          <p className="hint">Show this QR code at the hall entrance.</p>
          <button className="btn btn-gold" onClick={() => downloadInviteCard(inv.guestName, inv.seats, inv.code, ev)}>
            Save invitation to phone
          </button>

          <section className="rsvp" aria-live="polite">
            {showForm ? (
              <>
                <h2 className="title-sm">Will you attend?</h2>
                {inv.seats > 1 && (
                  <label className="field">
                    <span>How many people are coming?</span>
                    <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                      {Array.from({ length: inv.seats }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="field">
                  <span>Message to the couple (optional)</span>
                  <textarea rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
                </label>
                {rsvpError && <p className="error">{rsvpError}</p>}
                <div className="row">
                  <button className="btn btn-ink" disabled={busy} onClick={() => send(true)}>Yes, I'll be there</button>
                  <button className="btn btn-ghost" disabled={busy} onClick={() => send(false)}>Sorry, I can't come</button>
                </div>
              </>
            ) : (
              <>
                <p className={`rsvp-done ${inv.rsvpStatus === 'ATTENDING' ? 'yes' : 'no'}`}>
                  {inv.rsvpStatus === 'ATTENDING'
                    ? `Thank you! We've saved ${inv.rsvpCount === 1 ? 'your seat' : `${inv.rsvpCount} seats`}.`
                    : "Thank you for letting us know. You'll be missed."}
                </p>
                <button className="link-btn" onClick={() => setEditing(true)}>Change my answer</button>
              </>
            )}
          </section>
        </div>
        <div className="tilet" aria-hidden />
      </article>
    </main>
  );
}
