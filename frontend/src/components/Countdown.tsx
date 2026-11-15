import { useEffect, useState } from 'react';

interface Labels { days: string; hours: string; minutes: string; seconds: string; started: string }

const EN: Labels = { days: 'days', hours: 'hours', minutes: 'minutes', seconds: 'seconds', started: 'The celebration has begun' };

export default function Countdown({ to, labels = EN }: { to: string; labels?: Labels }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(to).getTime() - now;
  if (diff <= 0) return <p className="countdown-done">{labels.started}</p>;
  const parts: [number, string][] = [
    [Math.floor(diff / 86400000), labels.days],
    [Math.floor((diff % 86400000) / 3600000), labels.hours],
    [Math.floor((diff % 3600000) / 60000), labels.minutes],
    [Math.floor((diff % 60000) / 1000), labels.seconds],
  ];
  return (
    <div className="countdown" role="timer" aria-label={parts.map(([n, l]) => `${n} ${l}`).join(', ')}>
      {parts.map(([n, l]) => (
        <span key={l}><b>{String(n).padStart(2, '0')}</b>{l}</span>
      ))}
    </div>
  );
}
