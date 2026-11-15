// Ethiopian calendar + Ethiopian clock helpers (no dependencies).

const ERA = 1723856; // Amete Mihret epoch as Julian Day Number offset

const MONTHS_AM = ['መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜን'];
const MONTHS_EN = ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miyazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'];
const WEEKDAYS_AM = ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'];

function gregorianToJdn(y: number, m: number, d: number) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

export interface EthDate { year: number; month: number; day: number }

export function toEthiopian(date: Date): EthDate {
  const jdn = gregorianToJdn(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const r = (((jdn - ERA) % 1461) + 1461) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  return {
    year: 4 * Math.floor((jdn - ERA) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460),
    month: Math.floor(n / 30) + 1,
    day: (n % 30) + 1,
  };
}

/** e.g. "ቅዳሜ ታኅሣሥ 18 ቀን 2019 ዓ.ም" */
export function ethDateAm(date: Date) {
  const e = toEthiopian(date);
  return `${WEEKDAYS_AM[date.getDay()]} ${MONTHS_AM[e.month - 1]} ${e.day} ቀን ${e.year} ዓ.ም`;
}

/** e.g. "Tahsas 18, 2019 E.C." */
export function ethDateEn(date: Date) {
  const e = toEthiopian(date);
  return `${MONTHS_EN[e.month - 1]} ${e.day}, ${e.year} E.C.`;
}

/** Ethiopian clock: the day starts at 6 a.m., so 2:00 PM is "ከሰዓት 8:00 ሰዓት". */
export function ethTimeAm(date: Date) {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const eh = ((h + 6) % 12) || 12;
  const period = h >= 6 && h < 12 ? 'ጠዋት' : h >= 12 && h < 18 ? 'ከሰዓት' : h >= 18 ? 'ምሽት' : 'ሌሊት';
  return `${period} ${eh}:${m} ሰዓት`;
}
