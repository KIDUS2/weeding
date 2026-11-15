import { useCallback, useEffect, useRef, useState } from 'react';
import { mediaSrc, type MediaItem } from '../api';
import type { Strings } from '../i18n';

export default function Gallery({ photos, t }: { photos: MediaItem[]; t: Strings }) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const track = useRef<HTMLUListElement>(null);

  // Track which slide is centred for the dot indicator.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.i))),
      { root: el, threshold: 0.6 },
    );
    el.querySelectorAll('li').forEach((li) => io.observe(li));
    return () => io.disconnect();
  }, [photos]);

  if (photos.length === 0) return null;

  const scrollTo = (i: number) => {
    const li = track.current?.children[i] as HTMLElement | undefined;
    li?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  return (
    <section className="gallery" aria-labelledby="gallery-title">
      <h2 id="gallery-title" className="gallery-title">{t.ourMoments}</h2>
      <ul ref={track} className="gallery-track">
        {photos.map((p, i) => (
          <li key={p.id} data-i={i}>
            <button className="gallery-item" onClick={() => setOpenAt(i)} aria-label={`${t.photoOf(i + 1, photos.length)}${p.caption ? `: ${p.caption}` : ''}`}>
              <img src={mediaSrc(p.url)} alt="" loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
            </button>
            {p.caption && <p className="gallery-caption">{p.caption}</p>}
          </li>
        ))}
      </ul>
      {photos.length > 1 && (
        <div className="gallery-dots" aria-hidden>
          {photos.map((p, i) => (
            <button key={p.id} tabIndex={-1} className={i === active ? 'on' : ''} onClick={() => scrollTo(i)} />
          ))}
        </div>
      )}
      {openAt !== null && <Lightbox photos={photos} start={openAt} onClose={() => setOpenAt(null)} t={t} />}
    </section>
  );
}

function Lightbox({ photos, start, onClose, t }: { photos: MediaItem[]; start: number; onClose: () => void; t: Strings }) {
  const [i, setI] = useState(start);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const prev = useCallback(() => setI((n) => (n - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setI((n) => (n + 1) % photos.length), [photos.length]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus();
    };
  }, [onClose, prev, next]);

  const p = photos[i];
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={t.photoOf(i + 1, photos.length)}
         onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
         onTouchEnd={(e) => {
           if (touchX.current === null) return;
           const dx = e.changedTouches[0].clientX - touchX.current;
           if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
           touchX.current = null;
         }}>
      <div className="lightbox-bar">
        <span>{i + 1} / {photos.length}</span>
        <button ref={closeBtn} onClick={onClose} aria-label={t.close}>✕</button>
      </div>
      <figure className="lightbox-figure" onClick={onClose}>
        <img key={p.id} src={mediaSrc(p.url)} alt={p.caption ?? ''} onClick={(e) => e.stopPropagation()} />
        {p.caption && <figcaption>{p.caption}</figcaption>}
      </figure>
      {photos.length > 1 && (
        <>
          <button className="lightbox-nav prev" onClick={prev} aria-label={t.prevPhoto}>‹</button>
          <button className="lightbox-nav next" onClick={next} aria-label={t.nextPhoto}>›</button>
        </>
      )}
    </div>
  );
}
