# Wedding invitations & QR door check-in

Send every guest a personal invitation link with a QR code. Guests RSVP from the link. At the hall door, staff scan the QR on the guest's phone (or printed card), see who it is and how many people the invitation admits, and tap **Admit**.

- **backend/**: Spring Boot 3 (Java 21), PostgreSQL, Flyway, JWT auth
- **frontend/**: React + Vite + TypeScript, camera QR scanning (`html5-qrcode`)

## How it works

1. **Admin** signs in, fills in **Wedding details** (couple, date, hall, map link, message).
2. Admin adds guests one by one or **imports a CSV**. Each invitation gets a random, unguessable 10-character code and a number of seats (e.g. "Ato Abebe & family", 4 people).
3. **Send invite** opens the share panel: Telegram, WhatsApp, SMS, copy link, or download a ready-made invitation card image (PNG with the QR on it).
4. The guest opens `/invite/<code>`, sees the invitation, RSVPs, and can save the card to their phone.
5. On the wedding day, **ushers** open `/scan` on a phone. Scan the QR, and the screen shows the guest's name, side, table, notes and how many are already inside. Choose how many people are entering and tap **Admit**.
   - A family can arrive in groups; the app tracks the running count.
   - A fully used invitation shows a red **Already entered** screen with the time.
   - Invalid or fake codes show a red **Do not admit** screen.
   - A database row lock stops two doors from admitting the same invitation twice.
   - The code can also be typed by hand if a phone screen is cracked or dim.

## Photos & music

Admin → **Photos & music**:
- Upload up to 60 photos (JPG/PNG/WebP, resized in the browser before upload). Add captions, reorder, pick a **cover**.
- Upload one background song (MP3/M4A/OGG, ≤ 20 MB). It fades in when a guest taps **Open invitation**; guests can mute it with the floating button, and the choice is remembered.
- Files are checked by their real content (not the file extension) and stored under `STORAGE_DIR` (Docker volume `uploads`). Back this folder up together with the database.

## Roles

| Role  | Can do |
|-------|--------|
| ADMIN | Everything: guests, wedding details, staff, scanner |
| USHER | Door scanner only (plus the live "people inside" counter) |

The first admin is created automatically on an empty database from `ADMIN_USERNAME` / `ADMIN_PASSWORD` (default `admin` / `admin123`). **Change it after first login** via Staff → Set password.

## Run with Docker (recommended)

```bash
cp .env.example .env      # set strong passwords and JWT_SECRET
docker compose up -d --build
```

Open http://localhost:8088. Nginx serves the UI and proxies `/api` to the backend.

> **Camera needs HTTPS.** Phones only allow camera access on `https://` (or `localhost`). For the wedding day, put the app behind a domain with TLS (e.g. Caddy, Nginx + Let's Encrypt, or Cloudflare Tunnel). Invitation links use the address the admin is browsing from, so send invites from the public HTTPS address.

## Run locally for development

```bash
# PostgreSQL
docker run -d --name wedding-db -e POSTGRES_DB=wedding -e POSTGRES_USER=wedding \
  -e POSTGRES_PASSWORD=wedding -p 5432:5432 postgres:16-alpine

# Backend (port 8080)
cd backend && mvn spring-boot:run

# Frontend (port 5173, proxies /api to 8080)
cd frontend && npm install && npm run dev
```

## Configuration (backend env vars)

| Variable | Default | Purpose |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/wedding` | JDBC URL |
| `DB_USERNAME` / `DB_PASSWORD` | `wedding` / `wedding` | DB credentials |
| `JWT_SECRET` | dev value | HMAC key, **at least 32 chars** |
| `JWT_TTL_HOURS` | `24` | Staff login lifetime |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | `admin` / `admin123` | First admin (only on empty DB) |
| `STORAGE_DIR` | `./data/uploads` | Where photos and music are saved |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Only needed if UI and API are on different origins |

## CSV import format

Header row optional. Only `name` is required. Comma or semicolon separated, UTF-8 (Amharic names are fine).

```csv
name,phone,seats,side,table,notes
Ato Abebe Kebede & family,0911223344,4,bride,3,
W/ro Tigist Alemu,0922334455,2,groom,5,VIP
```

## API overview

| Method | Path | Who |
|---|---|---|
| POST | `/api/auth/login` | public |
| GET | `/api/public/event` | public |
| GET | `/api/public/invites/{code}` | public (invitation page) |
| POST | `/api/public/invites/{code}/rsvp` | public |
| GET/POST/PUT/DELETE | `/api/guests…` | admin |
| POST | `/api/guests/import` | admin (multipart `file`) |
| POST | `/api/guests/{id}/regenerate-code`, `/reset-checkin` | admin |
| PUT | `/api/event` | admin |
| GET/POST/PUT/DELETE | `/api/staff…` | admin |
| POST | `/api/checkin/lookup` `{code}` | admin, usher |
| POST | `/api/checkin/approve` `{code, people}` | admin, usher |
| GET | `/api/checkin/recent`, `/api/stats` | admin, usher |

`code` accepts either the bare code or the full invitation URL that the QR contains.
