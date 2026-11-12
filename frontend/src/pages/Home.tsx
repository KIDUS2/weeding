import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatDate, type WeddingEvent } from '../api';
import Countdown from '../components/Countdown';

export default function Home() {
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  useEffect(() => { api.event().then(setEvent).catch(() => setEvent(null)); }, []);

  return (
    <main className="stage">
      <section className="card hero-card">
        <div className="tilet" aria-hidden />
        <div className="card-body">
          <p className="invite-lead">We are getting married</p>
          <h1 className="couple">
            <span>{event?.brideName ?? '…'}</span>
            <span className="amp" aria-label="and">&amp;</span>
            <span>{event?.groomName ?? '…'}</span>
          </h1>
          {event && (
            <>
              <p className="when">{formatDate(event.eventDate)}</p>
              {event.venueName && <p className="where">{event.venueName}</p>}
              {event.eventDate && <Countdown to={event.eventDate} />}
              <p className="home-note">Your invitation and entry QR code arrive as a personal link. Open it to RSVP.</p>
            </>
          )}
        </div>
        <div className="tilet" aria-hidden />
      </section>
      <Link to="/login" className="staff-link">Staff sign in</Link>
    </main>
  );
}
