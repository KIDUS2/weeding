CREATE TABLE app_user (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(60)  NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    display_name  VARCHAR(120) NOT NULL,
    role          VARCHAR(20)  NOT NULL,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE TABLE wedding_event (
    id            BIGINT PRIMARY KEY,
    bride_name    VARCHAR(120) NOT NULL,
    groom_name    VARCHAR(120) NOT NULL,
    event_date    TIMESTAMP,
    venue_name    VARCHAR(200),
    venue_address VARCHAR(300),
    map_url       VARCHAR(500),
    dress_code    VARCHAR(200),
    message       TEXT,
    updated_at    TIMESTAMP    NOT NULL DEFAULT now()
);

INSERT INTO wedding_event (id, bride_name, groom_name, venue_name, message)
VALUES (1, 'Bride', 'Groom', 'Wedding Hall',
        'Together with our families, we joyfully invite you to celebrate our wedding.');

CREATE TABLE guest (
    id                  BIGSERIAL PRIMARY KEY,
    full_name           VARCHAR(160) NOT NULL,
    phone               VARCHAR(40),
    side                VARCHAR(10)  NOT NULL DEFAULT 'BOTH',
    table_name          VARCHAR(60),
    seats               INTEGER      NOT NULL DEFAULT 1,
    invite_code         VARCHAR(20)  NOT NULL UNIQUE,
    rsvp_status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    rsvp_count          INTEGER      NOT NULL DEFAULT 0,
    rsvp_note           VARCHAR(500),
    rsvp_at             TIMESTAMP,
    checked_in_count    INTEGER      NOT NULL DEFAULT 0,
    first_checked_in_at TIMESTAMP,
    last_checked_in_at  TIMESTAMP,
    notes               VARCHAR(500),
    created_at          TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT chk_guest_seats CHECK (seats BETWEEN 1 AND 50),
    CONSTRAINT chk_guest_checkin CHECK (checked_in_count BETWEEN 0 AND seats)
);

CREATE INDEX idx_guest_name ON guest (lower(full_name));

CREATE TABLE checkin_log (
    id          BIGSERIAL PRIMARY KEY,
    guest_id    BIGINT       NOT NULL REFERENCES guest (id) ON DELETE CASCADE,
    guest_name  VARCHAR(160) NOT NULL,
    people      INTEGER      NOT NULL,
    action      VARCHAR(20)  NOT NULL,
    scanned_by  VARCHAR(60)  NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkin_log_created ON checkin_log (created_at DESC);
