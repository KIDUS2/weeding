CREATE TABLE media (
    id            BIGSERIAL PRIMARY KEY,
    kind          VARCHAR(10)  NOT NULL,   -- PHOTO, MUSIC
    stored_name   VARCHAR(80)  NOT NULL UNIQUE,
    original_name VARCHAR(255),
    content_type  VARCHAR(60)  NOT NULL,
    size_bytes    BIGINT       NOT NULL,
    caption       VARCHAR(300),
    sort_order    INTEGER      NOT NULL DEFAULT 0,
    is_cover      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_kind_order ON media (kind, sort_order, id);
-- At most one cover photo
CREATE UNIQUE INDEX uq_media_cover ON media (is_cover) WHERE is_cover;
