import type { SiteItem } from '../api';
import type { Lang, Strings } from '../i18n';
import { ethDateAm, ethTimeAm } from '../ethiopian';

const pick = (lang: Lang, en: string | null, am: string | null) => (lang === 'am' && am) || en || '';

const timeEn = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });
const dayKey = (iso: string) => iso.slice(0, 10);
const dayEn = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

export function Schedule({ events, lang, t }: { events: SiteItem[]; lang: Lang; t: Strings }) {
  if (!events.length) return null;
  const multiDay = new Set(events.map((e) => dayKey(e.startsAt!))).size > 1;
  let lastDay = '';
  return (
    <section id="schedule" className="sec sec-paper" aria-labelledby="schedule-title">
      <h2 id="schedule-title" className="sec-title">{t.schedule}</h2>
      <ol className="sched">
        {events.map((e) => {
          const start = e.startsAt!;
          const showDay = multiDay && dayKey(start) !== lastDay;
          lastDay = dayKey(start);
          const body = pick(lang, e.body, e.bodyAm);
          return (
            <li key={e.id} className={showDay ? 'has-day' : ''}>
              {showDay && <p className="sched-day">{lang === 'am' ? ethDateAm(new Date(start)) : dayEn(start)}</p>}
              <div className="sched-row">
                <div className="sched-time">
                  {lang === 'am' ? (
                    <><b>{ethTimeAm(new Date(start)).replace(' ሰዓት', '')}</b><small>{timeEn(start)}</small></>
                  ) : (
                    <><b>{timeEn(start)}</b>{e.endsAt && <small>– {timeEn(e.endsAt)}</small>}</>
                  )}
                </div>
                <span className="sched-dot" aria-hidden />
                <div className="sched-body">
                  <h3>{pick(lang, e.title, e.titleAm)}</h3>
                  {e.venueName && <p className="sched-place">{e.venueName}</p>}
                  {e.venueAddress && <p className="sched-addr">{e.venueAddress}</p>}
                  {body && <p className="sched-text">{body}</p>}
                  {e.mapUrl && <a className="sched-map" href={e.mapUrl} target="_blank" rel="noreferrer">{t.directions}</a>}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function Story({ story, lang, t }: { story: SiteItem[]; lang: Lang; t: Strings }) {
  if (!story.length) return null;
  return (
    <section id="story" className="sec sec-dark" aria-labelledby="story-title">
      <h2 id="story-title" className="sec-title">{t.ourStory}</h2>
      <ol className="story">
        {story.map((s) => {
          const body = pick(lang, s.body, s.bodyAm);
          return (
            <li key={s.id}>
              {s.label && <span className="story-when">{s.label}</span>}
              <h3>{pick(lang, s.title, s.titleAm)}</h3>
              {body && <p>{body}</p>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function Faq({ faq, lang, t }: { faq: SiteItem[]; lang: Lang; t: Strings }) {
  if (!faq.length) return null;
  return (
    <section id="faq" className="sec sec-paper" aria-labelledby="faq-title">
      <h2 id="faq-title" className="sec-title">{t.faq}</h2>
      <div className="faq">
        {faq.map((q) => (
          <details key={q.id}>
            <summary>{pick(lang, q.title, q.titleAm)}</summary>
            <p>{pick(lang, q.body, q.bodyAm)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function SectionNav({ links }: { links: { id: string; label: string }[] }) {
  if (links.length < 3) return null;
  return (
    <nav className="sec-nav" aria-label="Sections">
      {links.map((l) => (
        <a key={l.id} href={`#${l.id}`} onClick={(e) => {
          e.preventDefault();
          document.getElementById(l.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}>{l.label}</a>
      ))}
    </nav>
  );
}
