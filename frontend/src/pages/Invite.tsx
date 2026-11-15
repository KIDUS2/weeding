import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, inviteUrl, mediaSrc, type Invite as InviteT, type PublicMedia, type WeddingEvent } from '../api';
import Gallery from '../components/Gallery';
import MusicButton from '../components/MusicButton';
import Qr from '../components/Qr';
import Countdown from '../components/Countdown';
import { downloadInviteCard } from '../components/inviteCard';
import { useLang, type Lang, type Strings } from '../i18n';
import { ethDateAm, ethDateEn, ethTimeAm } from '../ethiopian';
import { downloadIcs, googleCalendarUrl } from '../calendar';
import '../invite.css';

type Stage = 'sealed' | 'opening' | 'open';

const MUTED_KEY = 'wedding.music.muted';
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function names(ev: WeddingEvent | null, lang: Lang) {
  const bride = (lang === 'am' && ev?.brideNameAm) || ev?.brideName || '';
  const groom = (lang === 'am' && ev?.groomNameAm) || ev?.groomName || '';
  return { bride, groom };
}

function initial(s: string) {
  return Array.from(s.trim())[0] ?? '';
}

export default function Invite() {
  const { code = '' } = useParams();
  const { lang, setLang, t } = useLang();
  const [inv, setInv] = useState<InviteT | null>(null);
  const [error, setError] = useState('');
  const seenKey = `wedding.opened.${code}`;
  const [stage, setStage] = useState<Stage>(() => {
    try { return localStorage.getItem(seenKey) ? 'open' : 'sealed'; } catch { return 'sealed'; }
  });

  const [media, setMedia] = useState<PublicMedia | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    api.invite(code).then(setInv).catch((e) => setError(e.message));
    api.publicMedia().then(setMedia).catch(() => setMedia(null));
  }, [code]);

  /** Must be called from a tap so the browser allows sound. Fades in gently. */
  const playMusic = () => {
    const a = audio.current;
    if (!a) return;
    a.volume = 0;
    a.play().then(() => {
      const fade = setInterval(() => {
        a.volume = Math.min(0.6, a.volume + 0.05);
        if (a.volume >= 0.6) clearInterval(fade);
      }, 120);
    }).catch(() => { /* blocked or no network: the button stays available */ });
  };

  const toggleMusic = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      try { localStorage.removeItem(MUTED_KEY); } catch { /* ignore */ }
      playMusic();
    } else {
      a.pause();
      try { localStorage.setItem(MUTED_KEY, '1'); } catch { /* ignore */ }
    }
  };

  const open = () => {
    let muted = false;
    try { localStorage.setItem(seenKey, '1'); muted = !!localStorage.getItem(MUTED_KEY); } catch { /* ignore */ }
    if (!muted) playMusic();
    if (reducedMotion()) return setStage('open');
    setStage('opening');
    setTimeout(() => setStage('open'), 1500);
  };

  const replay = () => {
    window.scrollTo({ top: 0 });
    setStage('sealed');
  };

  if (error) {
    return (
      <main className="inv-stage">
        <LangSwitch lang={lang} setLang={setLang} />
        <section className="inv-sheet inv-narrow">
          <div className="tilet" aria-hidden />
          <div className="inv-pad">
            <h1 className="inv-h2">{t.invalidTitle}</h1>
            <p className="inv-muted">{t.invalidBody}</p>
          </div>
        </section>
      </main>
    );
  }
  if (!inv) return <div className="inv-stage inv-loading" aria-busy="true">{t.opening}</div>;

  const { bride, groom } = names(inv.event, lang);

  return (
    <main className={`inv-stage lang-${lang}`}>
      <LangSwitch lang={lang} setLang={setLang} />
      {media?.music && (
        <>
          <audio ref={audio} src={mediaSrc(media.music.url)} loop preload="none"
                 onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
          {stage !== 'sealed' && <MusicButton playing={playing} onToggle={toggleMusic} t={t} />}
        </>
      )}
      {stage !== 'open'
        ? <Envelope guest={inv.guestName} bride={bride} groom={groom} stage={stage} onOpen={open} t={t} />
        : <Invitation inv={inv} setInv={setInv} lang={lang} t={t} bride={bride} groom={groom} onReplay={replay} media={media} />}
    </main>
  );
}

function LangSwitch({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="lang-switch" role="group" aria-label="Language">
      <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
      <button aria-pressed={lang === 'am'} onClick={() => setLang('am')} lang="am">አማ</button>
    </div>
  );
}

function Envelope({ guest, bride, groom, stage, onOpen, t }: {
  guest: string; bride: string; groom: string; stage: Stage; onOpen: () => void; t: Strings;
}) {
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => { btn.current?.focus({ preventScroll: true }); }, []);
  return (
    <section className={`env-scene ${stage === 'opening' ? 'is-opening' : ''}`}>
      <p className="env-for">{t.forGuest}</p>
      <p className="env-guest">{guest}</p>
      <div className="envelope" aria-hidden>
        <div className="env-back" />
        <div className="env-letter">
          <div className="tilet" />
          <span className="env-letter-names">{bride} &amp; {groom}</span>
        </div>
        <div className="env-front" />
        <div className="env-flap" />
        <div className="env-seal"><span>{initial(bride)}</span><i>&amp;</i><span>{initial(groom)}</span></div>
      </div>
      <button ref={btn} className="env-open" onClick={onOpen} disabled={stage === 'opening'}>
        {t.tapToOpen}
      </button>
    </section>
  );
}

function Invitation({ inv, setInv, lang, t, bride, groom, onReplay, media }: {
  inv: InviteT; setInv: (i: InviteT) => void; lang: Lang; t: Strings; bride: string; groom: string; onReplay: () => void;
  media: PublicMedia | null;
}) {
  const ev = inv.event;
  const date = ev?.eventDate ? new Date(ev.eventDate) : null;
  const venue = (lang === 'am' && ev?.venueNameAm) || ev?.venueName;
  const message = (lang === 'am' && ev?.messageAm) || ev?.message;
  const link = inviteUrl(inv.code);
  const [toast, setToast] = useState('');
  const [calOpen, setCalOpen] = useState(false);

  const gregLong = date?.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const gregTime = date?.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });

  const share = async () => {
    const text = `${bride} & ${groom}`;
    if (navigator.share) {
      try { await navigator.share({ title: text, url: link }); } catch { /* cancelled */ }
      return;
    }
    await navigator.clipboard.writeText(link);
    setToast(t.linkCopied);
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <div className="inv-flow">
      <article className="inv-sheet inv-rise">
        {media?.cover && (
          <figure className="inv-cover">
            <img src={mediaSrc(media.cover.url)} alt={media.cover.caption ?? `${bride} & ${groom}`} />
          </figure>
        )}
        <div className="tilet" aria-hidden />
        <div className="inv-pad inv-center">
          <p className="inv-lead">
            {t.dear} <strong>{inv.guestName}</strong>,<br />{t.invitedTo}
          </p>
          <h1 className="inv-names">
            <span>{bride}</span>
            <span className="inv-amp" aria-label="and">&amp;</span>
            <span>{groom}</span>
          </h1>

          {date ? (
            <div className="inv-date">
              {lang === 'am' ? (
                <>
                  <p className="inv-date-main">{ethDateAm(date)}</p>
                  <p className="inv-date-time">{ethTimeAm(date)}</p>
                  <p className="inv-date-alt">{gregLong}, {gregTime}</p>
                </>
              ) : (
                <>
                  <p className="inv-date-main">{gregLong}</p>
                  <p className="inv-date-time">{gregTime}</p>
                  <p className="inv-date-alt">{ethDateEn(date)} · <span lang="am">{ethTimeAm(date)}</span></p>
                </>
              )}
            </div>
          ) : <p className="inv-date-main">{t.dateTba}</p>}

          {message && <p className="inv-message">{message}</p>}
        </div>

        <dl className="inv-facts">
          {venue && (
            <div>
              <dt>{t.where}</dt>
              <dd>
                <span className="inv-fact-main">{venue}</span>
                {ev?.venueAddress && <span className="inv-fact-sub">{ev.venueAddress}</span>}
              </dd>
            </div>
          )}
          {ev?.dressCode && <div><dt>{t.dressCode}</dt><dd><span className="inv-fact-main">{ev.dressCode}</span></dd></div>}
          {inv.tableName && <div><dt>{t.yourTable}</dt><dd><span className="inv-fact-main">{inv.tableName}</span></dd></div>}
        </dl>

        <div className="inv-actions">
          {ev?.mapUrl && <a className="ibtn ibtn-line" href={ev.mapUrl} target="_blank" rel="noreferrer">{t.directions}</a>}
          {ev && date && (
            <div className="inv-cal">
              <button className="ibtn ibtn-line" aria-expanded={calOpen} onClick={() => setCalOpen((o) => !o)}>{t.addToCalendar}</button>
              {calOpen && (
                <div className="inv-cal-menu">
                  <a href={googleCalendarUrl(ev, link)} target="_blank" rel="noreferrer" onClick={() => setCalOpen(false)}>{t.googleCalendar}</a>
                  <button onClick={() => { downloadIcs(ev, link); setCalOpen(false); }}>{t.appleCalendar}</button>
                </div>
              )}
            </div>
          )}
        </div>

        {ev?.eventDate && (
          <div className="inv-pad inv-center inv-count">
            <Countdown to={ev.eventDate} labels={t} />
          </div>
        )}
        <div className="tilet" aria-hidden />
      </article>

      {media && media.photos.length > 0 && <Gallery photos={media.photos} t={t} />}

      <Pass inv={inv} t={t} onShare={share} />

      <Rsvp inv={inv} setInv={setInv} t={t} />

      <button className="inv-replay" onClick={onReplay}>{t.replay}</button>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function Pass({ inv, t, onShare }: { inv: InviteT; t: Strings; onShare: () => void }) {
  const full = inv.checkedInCount >= inv.seats;
  const partly = inv.checkedInCount > 0 && !full;
  return (
    <section className={`pass ${full ? 'is-used' : ''}`} aria-labelledby="pass-title">
      <header className="pass-head">
        <h2 id="pass-title">{t.passTitle}</h2>
        <span className="pass-admits">{t.admits(inv.seats)}</span>
      </header>
      <div className="pass-body">
        <div className="pass-qr">
          <Qr value={inviteUrl(inv.code)} size={240} />
          {full && <div className="pass-stamp" role="status">{t.checkedIn}</div>}
        </div>
        <p className="pass-code" aria-label={`Code ${inv.code}`}>{inv.code.match(/.{1,5}/g)?.join(' ')}</p>
        <p className="pass-name">{inv.guestName}</p>
        {partly && <p className="pass-partly">{t.checkedInPartly(inv.checkedInCount, inv.seats)}</p>}
        {!full && <p className="pass-hint">{t.showAtDoor}. {t.brightness}</p>}
      </div>
      <footer className="pass-foot">
        <button className="ibtn ibtn-gold" onClick={() => downloadInviteCard(inv.guestName, inv.seats, inv.code, inv.event)}>{t.savePass}</button>
        <button className="ibtn ibtn-line" onClick={onShare}>{t.share}</button>
      </footer>
    </section>
  );
}

function Rsvp({ inv, setInv, t }: { inv: InviteT; setInv: (i: InviteT) => void; t: Strings }) {
  const [editing, setEditing] = useState(inv.rsvpStatus === 'PENDING');
  const [choice, setChoice] = useState<'yes' | 'no' | null>(
    inv.rsvpStatus === 'ATTENDING' ? 'yes' : inv.rsvpStatus === 'DECLINED' ? 'no' : null);
  const [count, setCount] = useState(inv.rsvpCount || inv.seats);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [justSent, setJustSent] = useState(false);

  const send = async () => {
    if (!choice) return;
    setBusy(true);
    setError('');
    try {
      const updated = await api.rsvp(inv.code, choice === 'yes', choice === 'yes' ? count : 0, note);
      setInv(updated);
      setEditing(false);
      setJustSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    const yes = inv.rsvpStatus === 'ATTENDING';
    return (
      <section className={`rsvp-card rsvp-answered ${yes ? 'yes' : 'no'} ${justSent ? 'just-sent' : ''}`} aria-live="polite">
        <div className="rsvp-seal" aria-hidden>{yes ? '✓' : '♡'}</div>
        <p className="rsvp-thanks">{yes ? t.thanksYes(inv.rsvpCount) : t.thanksNo}</p>
        <button className="inv-link" onClick={() => { setEditing(true); setJustSent(false); }}>{t.changeAnswer}</button>
      </section>
    );
  }

  return (
    <section className="rsvp-card" aria-labelledby="rsvp-title">
      <h2 id="rsvp-title" className="inv-h2">{t.rsvpTitle}</h2>
      <div className="rsvp-choice" role="radiogroup" aria-labelledby="rsvp-title">
        <button role="radio" aria-checked={choice === 'yes'} className="choice choice-yes" onClick={() => setChoice('yes')}>
          <span className="choice-mark" aria-hidden />{t.accept}
        </button>
        <button role="radio" aria-checked={choice === 'no'} className="choice choice-no" onClick={() => setChoice('no')}>
          <span className="choice-mark" aria-hidden />{t.decline}
        </button>
      </div>

      {choice === 'yes' && inv.seats > 1 && (
        <div className="rsvp-count">
          <span id="count-label">{t.howMany}</span>
          <div className="seat-picker" role="radiogroup" aria-labelledby="count-label">
            {Array.from({ length: inv.seats }, (_, i) => i + 1).map((n) => (
              <button key={n} role="radio" aria-checked={count === n} onClick={() => setCount(n)}>{n}</button>
            ))}
          </div>
        </div>
      )}

      {choice && (
        <label className="rsvp-note">
          <span>{t.note}</span>
          <textarea rows={2} maxLength={500} value={note} placeholder={t.notePlaceholder} onChange={(e) => setNote(e.target.value)} />
        </label>
      )}

      {error && <p className="inv-error" role="alert">{error}</p>}
      <button className="ibtn ibtn-ink ibtn-wide" disabled={!choice || busy} onClick={send}>
        {busy ? t.sending : t.sendReply}
      </button>
    </section>
  );
}
