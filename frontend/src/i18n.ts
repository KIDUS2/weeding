// Guest-facing text in English and Amharic.
import { useCallback, useState } from 'react';

export type Lang = 'en' | 'am';

const en = {
  forGuest: 'An invitation for',
  tapToOpen: 'Open invitation',
  dear: 'Dear',
  invitedTo: 'you are warmly invited to celebrate the wedding of',
  when: 'When',
  where: 'Where',
  dressCode: 'Dress code',
  yourTable: 'Your table',
  directions: 'Get directions',
  addToCalendar: 'Add to calendar',
  googleCalendar: 'Google Calendar',
  appleCalendar: 'Apple / Outlook (.ics)',
  dateTba: 'Date to be announced',
  days: 'days', hours: 'hours', minutes: 'minutes', seconds: 'seconds',
  started: 'The celebration has begun',
  passTitle: 'Entry pass',
  admits: (n: number) => (n === 1 ? 'Admits 1 person' : `Admits ${n} people`),
  showAtDoor: 'Show this at the hall entrance',
  brightness: 'Turn your screen brightness up when you arrive.',
  checkedIn: 'Welcome! You have checked in',
  checkedInPartly: (inn: number, total: number) => `${inn} of ${total} have checked in`,
  savePass: 'Save pass',
  share: 'Share',
  linkCopied: 'Link copied',
  rsvpTitle: 'Will you join us?',
  accept: 'Joyfully accept',
  decline: 'Regretfully decline',
  howMany: 'How many of you are coming?',
  note: 'A note for the couple (optional)',
  notePlaceholder: 'Congratulations…',
  sendReply: 'Send reply',
  sending: 'Sending…',
  thanksYes: (n: number) => (n === 1 ? 'Thank you! Your seat is saved.' : `Thank you! ${n} seats are saved for you.`),
  thanksNo: 'Thank you for letting us know. You will be missed.',
  changeAnswer: 'Change my answer',
  invalidTitle: "This invitation link isn't valid",
  invalidBody: "Check that you opened the full link you were sent, or contact the couple's family.",
  opening: 'Opening your invitation…',
  replay: 'Replay opening',
  ourMoments: 'Our moments',
  photoOf: (i: number, n: number) => `Photo ${i} of ${n}`,
  close: 'Close',
  prevPhoto: 'Previous photo',
  nextPhoto: 'Next photo',
  playMusic: 'Play music',
  pauseMusic: 'Pause music',
  schedule: 'The day',
  ourStory: 'Our story',
  faq: 'Good to know',
  navPhotos: 'Photos',
  navPass: 'Entry pass',
  navRsvp: 'RSVP',
};

const am: typeof en = {
  forGuest: 'ግብዣ ለ',
  tapToOpen: 'ግብዣውን ይክፈቱ',
  dear: 'ውድ',
  invitedTo: 'በሰርጋችን ላይ እንዲገኙልን በአክብሮት ጋብዘንዎታል',
  when: 'ቀን',
  where: 'ቦታ',
  dressCode: 'አለባበስ',
  yourTable: 'ጠረጴዛዎ',
  directions: 'አቅጣጫ ይመልከቱ',
  addToCalendar: 'ቀን መቁጠሪያ ላይ ያስቀምጡ',
  googleCalendar: 'Google Calendar',
  appleCalendar: 'Apple / Outlook (.ics)',
  dateTba: 'ቀኑ ገና አልተወሰነም',
  days: 'ቀን', hours: 'ሰዓት', minutes: 'ደቂቃ', seconds: 'ሰከንድ',
  started: 'በዓሉ ጀምሯል',
  passTitle: 'የመግቢያ ካርድ',
  admits: (n: number) => `${n} ሰው ያስገባል`,
  showAtDoor: 'በአዳራሹ መግቢያ ላይ ያሳዩ',
  brightness: 'ሲደርሱ የስልክዎን ብርሃን ከፍ ያድርጉ።',
  checkedIn: 'እንኳን ደህና መጡ! ገብተዋል',
  checkedInPartly: (inn: number, total: number) => `ከ${total} ሰው ${inn} ገብተዋል`,
  savePass: 'ካርዱን ያስቀምጡ',
  share: 'ያጋሩ',
  linkCopied: 'ሊንኩ ተቀድቷል',
  rsvpTitle: 'ይገኛሉ?',
  accept: 'በደስታ እገኛለሁ',
  decline: 'ይቅርታ፣ አልገኝም',
  howMany: 'ስንት ሰው ይመጣል?',
  note: 'ለሙሽሮቹ መልዕክት (አማራጭ)',
  notePlaceholder: 'እንኳን ደስ አላችሁ…',
  sendReply: 'መልስ ይላኩ',
  sending: 'በመላክ ላይ…',
  thanksYes: (n: number) => `እናመሰግናለን! ${n} ቦታ ተይዞልዎታል።`,
  thanksNo: 'ስላሳወቁን እናመሰግናለን።',
  changeAnswer: 'መልሴን ቀይር',
  invalidTitle: 'ይህ የግብዣ ሊንክ ትክክል አይደለም',
  invalidBody: 'የተላከልዎትን ሙሉ ሊንክ መክፈትዎን ያረጋግጡ ወይም የሙሽሮቹን ቤተሰብ ያነጋግሩ።',
  opening: 'ግብዣዎ እየተከፈተ ነው…',
  replay: 'እንደገና ይክፈቱ',
  ourMoments: 'የእኛ ትዝታዎች',
  photoOf: (i: number, n: number) => `ፎቶ ${i} ከ${n}`,
  close: 'ዝጋ',
  prevPhoto: 'ቀዳሚ ፎቶ',
  nextPhoto: 'ቀጣይ ፎቶ',
  playMusic: 'ሙዚቃ አጫውት',
  pauseMusic: 'ሙዚቃ አቁም',
  schedule: 'የዕለቱ መርሐ ግብር',
  ourStory: 'የእኛ ታሪክ',
  faq: 'ማወቅ ያለብዎት',
  navPhotos: 'ፎቶዎች',
  navPass: 'መግቢያ ካርድ',
  navRsvp: 'መልስ',
};

export type Strings = typeof en;
const dict: Record<Lang, Strings> = { en, am };
const KEY = 'wedding.lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'en' || saved === 'am') return saved;
  } catch { /* storage unavailable */ }
  return navigator.language?.startsWith('am') ? 'am' : 'en';
}

export function useLang() {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
    document.documentElement.lang = l;
  }, []);
  return { lang, setLang, t: dict[lang] };
}
