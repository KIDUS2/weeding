import { useEffect, useState } from 'react';

export default function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(to).getTime() - now;
  if (diff <= 0) return <p className="countdown-done">The celebration has begun</p>;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <div className="countdown" aria-label="Time until the wedding">
      <span><b>{d}</b>days</span>
      <span><b>{h}</b>hours</span>
      <span><b>{m}</b>minutes</span>
      <span><b>{s}</b>seconds</span>
    </div>
  );
}
