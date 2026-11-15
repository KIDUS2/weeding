import type { Strings } from '../i18n';

export default function MusicButton({ playing, onToggle, t }: { playing: boolean; onToggle: () => void; t: Strings }) {
  return (
    <button className={`music-btn ${playing ? 'is-playing' : ''}`} onClick={onToggle}
            aria-pressed={playing} aria-label={playing ? t.pauseMusic : t.playMusic} title={playing ? t.pauseMusic : t.playMusic}>
      {playing ? (
        <span className="eq" aria-hidden><i /><i /><i /><i /></span>
      ) : (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="6.5" cy="18" r="2.5" fill="currentColor" />
          <circle cx="16.5" cy="16" r="2.5" fill="currentColor" />
        </svg>
      )}
    </button>
  );
}
