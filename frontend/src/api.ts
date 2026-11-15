// Thin fetch wrapper + shared types for the wedding API.

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
const TOKEN_KEY = 'wedding.token';

export type Role = 'ADMIN' | 'USHER';
export type Side = 'BRIDE' | 'GROOM' | 'BOTH';
export type RsvpStatus = 'PENDING' | 'ATTENDING' | 'DECLINED';

export interface User { id: number; username: string; displayName: string; role: Role; active: boolean }

export interface WeddingEvent {
  brideName: string; groomName: string; eventDate: string | null;
  venueName: string | null; venueAddress: string | null; mapUrl: string | null;
  dressCode: string | null; message: string | null;
  brideNameAm: string | null; groomNameAm: string | null; venueNameAm: string | null; messageAm: string | null;
}

export interface Guest {
  id: number; fullName: string; phone: string | null; side: Side; tableName: string | null;
  seats: number; inviteCode: string; rsvpStatus: RsvpStatus; rsvpCount: number; rsvpNote: string | null;
  rsvpAt: string | null; checkedInCount: number; firstCheckedInAt: string | null;
  lastCheckedInAt: string | null; notes: string | null; createdAt: string;
}

export interface GuestInput {
  fullName: string; phone: string; side: Side; tableName: string; seats: number; notes: string;
}

export interface Invite {
  code: string; guestName: string; seats: number; side: Side; tableName: string | null;
  rsvpStatus: RsvpStatus; rsvpCount: number; checkedInCount: number; event: WeddingEvent | null;
}

export interface Stats {
  invitations: number; totalSeats: number; attendingInvitations: number; attendingPeople: number;
  declinedInvitations: number; pendingInvitations: number; checkedInInvitations: number; checkedInPeople: number;
}

export interface ScanResult {
  guestId: number; code: string; guestName: string; side: Side; tableName: string | null;
  seats: number; checkedInCount: number; remaining: number; rsvpStatus: RsvpStatus; rsvpCount: number;
  notes: string | null; firstCheckedInAt: string | null; lastCheckedInAt: string | null; fullyCheckedIn: boolean;
}

export interface CheckinEntry {
  id: number; guestId: number; guestName: string; people: number; action: string; scannedBy: string; at: string;
}

export interface MediaItem {
  id: number; kind: 'PHOTO' | 'MUSIC'; url: string; caption: string | null; sortOrder: number;
  cover: boolean; originalName: string | null; sizeBytes: number;
}

export interface PublicMedia { cover: MediaItem | null; photos: MediaItem[]; music: MediaItem | null }

export type SiteKind = 'EVENT' | 'STORY' | 'FAQ';

export interface SiteItem {
  id: number; kind: SiteKind; title: string; titleAm: string | null; body: string | null; bodyAm: string | null;
  label: string | null; startsAt: string | null; endsAt: string | null; venueName: string | null;
  venueAddress: string | null; mapUrl: string | null; sortOrder: number;
}

export type SiteItemInput = Omit<SiteItem, 'id' | 'sortOrder'>;

export interface PublicSite { events: SiteItem[]; story: SiteItem[]; faq: SiteItem[] }

export type PlanCategory = 'VENUE' | 'CEREMONY' | 'FOOD' | 'ATTIRE' | 'PHOTO_VIDEO' | 'MUSIC' | 'DECOR' | 'BEAUTY'
  | 'TRANSPORT' | 'GUESTS' | 'RINGS' | 'HONEYMOON' | 'OTHER';

export interface PlanTask {
  id: number; title: string; category: PlanCategory; dueDate: string | null; done: boolean;
  doneAt: string | null; assignee: string | null; notes: string | null;
}
export type PlanTaskInput = Omit<PlanTask, 'id' | 'doneAt'>;

export interface BudgetLine {
  id: number; category: PlanCategory; name: string; vendorName: string | null; vendorPhone: string | null;
  estimated: number; actual: number | null; paid: number; dueDate: string | null; notes: string | null;
}
export type BudgetLineInput = Omit<BudgetLine, 'id'>;

export interface PlanSummary {
  totalBudget: number | null; estimated: number; expected: number; paid: number; stillToPay: number; left: number | null;
  byCategory: { category: PlanCategory; expected: number; paid: number }[];
  tasksTotal: number; tasksDone: number; tasksOverdue: number; nextTasks: PlanTask[]; paymentsDue: BudgetLine[];
  weddingDate: string | null; daysToGo: number | null;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const token = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(method: string, path: string, body?: unknown, auth = true): Promise<T> {
  const headers: Record<string, string> = {};
  const t = token.get();
  if (auth && t) headers.Authorization = `Bearer ${t}`;
  let payload: BodyInit | undefined;
  if (body instanceof FormData) payload = body;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(BASE + path, { method, headers, body: payload });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check the internet connection.');
  }
  if (res.status === 401 && auth) {
    token.clear();
    if (!location.pathname.startsWith('/login')) location.href = '/login';
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { const j = await res.json(); if (j?.message) msg = j.message; } catch { /* not json */ }
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; expiresAt: string; user: User }>('POST', '/api/auth/login', { username, password }, false),
  me: () => request<User>('GET', '/api/auth/me'),

  event: () => request<WeddingEvent>('GET', '/api/public/event', undefined, false),
  saveEvent: (e: WeddingEvent) => request<WeddingEvent>('PUT', '/api/event', e),

  invite: (code: string) => request<Invite>('GET', `/api/public/invites/${encodeURIComponent(code)}`, undefined, false),
  rsvp: (code: string, attending: boolean, count: number, note: string) =>
    request<Invite>('POST', `/api/public/invites/${encodeURIComponent(code)}/rsvp`, { attending, count, note }, false),

  guests: () => request<Guest[]>('GET', '/api/guests'),
  createGuest: (g: GuestInput) => request<Guest>('POST', '/api/guests', g),
  updateGuest: (id: number, g: GuestInput) => request<Guest>('PUT', `/api/guests/${id}`, g),
  deleteGuest: (id: number) => request<void>('DELETE', `/api/guests/${id}`),
  regenerateCode: (id: number) => request<Guest>('POST', `/api/guests/${id}/regenerate-code`),
  resetCheckin: (id: number) => request<Guest>('POST', `/api/guests/${id}/reset-checkin`),
  importGuests: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<{ created: number; skipped: number; errors: string[] }>('POST', '/api/guests/import', fd);
  },
  stats: () => request<Stats>('GET', '/api/stats'),

  lookup: (code: string) => request<ScanResult>('POST', '/api/checkin/lookup', { code }),
  approve: (code: string, people: number) => request<ScanResult>('POST', '/api/checkin/approve', { code, people }),
  recent: () => request<CheckinEntry[]>('GET', '/api/checkin/recent'),

  publicMedia: () => request<PublicMedia>('GET', '/api/public/media', undefined, false),
  media: () => request<MediaItem[]>('GET', '/api/media'),
  uploadMedia: (file: Blob, name: string, caption = '') => {
    const fd = new FormData();
    fd.append('file', file, name);
    if (caption) fd.append('caption', caption);
    return request<MediaItem>('POST', '/api/media', fd);
  },
  updateMedia: (id: number, body: { caption?: string; cover?: boolean }) => request<MediaItem>('PUT', `/api/media/${id}`, body),
  reorderMedia: (ids: number[]) => request<MediaItem[]>('PUT', '/api/media/order', { ids }),
  deleteMedia: (id: number) => request<void>('DELETE', `/api/media/${id}`),

  publicSite: () => request<PublicSite>('GET', '/api/public/site', undefined, false),
  siteItems: (kind: SiteKind) => request<SiteItem[]>('GET', `/api/site-items?kind=${kind}`),
  createSiteItem: (i: SiteItemInput) => request<SiteItem>('POST', '/api/site-items', i),
  updateSiteItem: (id: number, i: SiteItemInput) => request<SiteItem>('PUT', `/api/site-items/${id}`, i),
  reorderSiteItems: (kind: SiteKind, ids: number[]) => request<SiteItem[]>('PUT', '/api/site-items/order', { kind, ids }),
  deleteSiteItem: (id: number) => request<void>('DELETE', `/api/site-items/${id}`),

  planSummary: () => request<PlanSummary>('GET', '/api/planning/summary'),
  planTasks: () => request<PlanTask[]>('GET', '/api/planning/tasks'),
  createTask: (t: PlanTaskInput) => request<PlanTask>('POST', '/api/planning/tasks', t),
  updateTask: (id: number, t: PlanTaskInput) => request<PlanTask>('PUT', `/api/planning/tasks/${id}`, t),
  setTaskDone: (id: number, value: boolean) => request<PlanTask>('PATCH', `/api/planning/tasks/${id}/done?value=${value}`),
  deleteTask: (id: number) => request<void>('DELETE', `/api/planning/tasks/${id}`),
  starterTasks: () => request<PlanTask[]>('POST', '/api/planning/tasks/starter'),
  budget: () => request<BudgetLine[]>('GET', '/api/planning/budget'),
  createBudget: (b: BudgetLineInput) => request<BudgetLine>('POST', '/api/planning/budget', b),
  updateBudget: (id: number, b: BudgetLineInput) => request<BudgetLine>('PUT', `/api/planning/budget/${id}`, b),
  deleteBudget: (id: number) => request<void>('DELETE', `/api/planning/budget/${id}`),
  setTotalBudget: (totalBudget: number | null) => request<PlanSummary>('PUT', '/api/planning/settings', { totalBudget }),

  staff: () => request<User[]>('GET', '/api/staff'),
  createStaff: (s: { username: string; password: string; displayName: string; role: Role }) =>
    request<User>('POST', '/api/staff', s),
  updateStaff: (id: number, s: Partial<{ displayName: string; role: Role; active: boolean; password: string }>) =>
    request<User>('PUT', `/api/staff/${id}`, s),
  deleteStaff: (id: number) => request<void>('DELETE', `/api/staff/${id}`),
};

export const mediaSrc = (url: string) => BASE + url;

export const inviteUrl = (code: string) => `${location.origin}/invite/${code}`;

export function formatDate(iso: string | null, withTime = true): string {
  if (!iso) return 'Date to be announced';
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit', hour12: true } : {}),
  });
}

export function formatTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export const sideLabel: Record<Side, string> = { BRIDE: "Bride's side", GROOM: "Groom's side", BOTH: 'Both families' };
