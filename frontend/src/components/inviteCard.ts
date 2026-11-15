// Renders a shareable PNG of the invitation (for Telegram / WhatsApp / printing).
import QRCode from 'qrcode';
import { formatDate, inviteUrl, type WeddingEvent } from '../api';
import { ethDateEn } from '../ethiopian';

const INK = '#1E2A4A';
const GOLD = '#D4A63A';
const GREEN = '#2F7D5B';
const RED = '#B23A48';
const PAPER = '#FFFDF8';

/** Draws one row of the woven tilet band: alternating diamonds and stripes. */
function drawTilet(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = GOLD;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = INK;
  ctx.fillRect(x, y + 3, w, 2);
  ctx.fillRect(x, y + h - 5, w, 2);
  const step = h * 1.1;
  for (let i = 0, cx = x + step / 2; cx < x + w; i++, cx += step) {
    const cy = y + h / 2;
    const r = h * 0.32;
    ctx.fillStyle = i % 2 ? GREEN : RED;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PAPER;
    ctx.fillRect(cx - 2, cy - 2, 4, 4);
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(/\s+/);
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = w;
      y += lh;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y);
  return y + lh;
}

export async function renderInviteCard(guestName: string, seats: number, code: string, event: WeddingEvent | null) {
  await document.fonts.ready;
  const W = 1080, H = 1620;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = PAPER;
  ctx.fillRect(48, 48, W - 96, H - 96);
  drawTilet(ctx, 48, 48, W - 96, 44);
  drawTilet(ctx, 48, H - 92, W - 96, 44);

  ctx.textAlign = 'center';
  ctx.fillStyle = GREEN;
  ctx.font = '500 34px Karla, sans-serif';
  ctx.fillText('You are invited to the wedding of', W / 2, 200);

  ctx.fillStyle = INK;
  ctx.font = '88px Marcellus, "Noto Serif Ethiopic", serif';
  const bride = event?.brideName ?? 'Bride';
  const groom = event?.groomName ?? 'Groom';
  ctx.fillText(bride, W / 2, 320);
  ctx.fillStyle = GOLD;
  ctx.font = '60px Marcellus, serif';
  ctx.fillText('&', W / 2, 400);
  ctx.fillStyle = INK;
  ctx.font = '88px Marcellus, "Noto Serif Ethiopic", serif';
  ctx.fillText(groom, W / 2, 490);

  ctx.font = '500 34px Karla, sans-serif';
  ctx.fillStyle = INK;
  ctx.fillText(formatDate(event?.eventDate ?? null), W / 2, 580);
  if (event?.eventDate) {
    ctx.font = '400 28px Karla, sans-serif';
    ctx.fillStyle = '#5B6584';
    ctx.fillText(ethDateEn(new Date(event.eventDate)), W / 2, 620);
    ctx.fillStyle = INK;
  }
  if (event?.venueName) {
    ctx.font = '700 32px Karla, sans-serif';
    ctx.fillText(event.venueName, W / 2, 662);
  }

  // QR medallion
  const qrSize = 520;
  const qx = (W - qrSize) / 2, qy = 720;
  ctx.fillStyle = GOLD;
  ctx.fillRect(qx - 22, qy - 22, qrSize + 44, qrSize + 44);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qx - 10, qy - 10, qrSize + 20, qrSize + 20);
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, inviteUrl(code), {
    width: qrSize, margin: 0, errorCorrectionLevel: 'M', color: { dark: INK, light: '#FFFFFF' },
  });
  ctx.drawImage(qrCanvas, qx, qy, qrSize, qrSize);

  ctx.fillStyle = INK;
  ctx.font = '60px Marcellus, "Noto Serif Ethiopic", serif';
  const nameEnd = wrap(ctx, guestName, W / 2, 1350, W - 200, 68);
  ctx.font = '500 32px Karla, sans-serif';
  ctx.fillStyle = GREEN;
  ctx.fillText(seats === 1 ? 'Admits 1 person' : `Admits ${seats} people`, W / 2, nameEnd + 4);
  ctx.fillStyle = INK;
  ctx.font = '500 26px Karla, sans-serif';
  ctx.fillText(`Show this code at the door · ${code}`, W / 2, H - 130);

  return c.toDataURL('image/png');
}

export async function downloadInviteCard(guestName: string, seats: number, code: string, event: WeddingEvent | null) {
  const url = await renderInviteCard(guestName, seats, code, event);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invitation-${guestName.replace(/[^\p{L}\p{N}]+/gu, '-')}.png`;
  a.click();
}
