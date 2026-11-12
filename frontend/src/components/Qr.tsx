import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function Qr({ value, size = 220 }: { value: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    QRCode.toCanvas(ref.current, value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#1E2A4A', light: '#FFFFFF' },
    });
  }, [value, size]);
  return <canvas ref={ref} width={size} height={size} aria-label="Invitation QR code" role="img" />;
}
