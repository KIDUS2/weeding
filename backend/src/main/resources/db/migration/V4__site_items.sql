-- Content for the wedding website sections: schedule (EVENT), our story (STORY), questions (FAQ)
CREATE TABLE site_item (
    id            BIGSERIAL PRIMARY KEY,
    kind          VARCHAR(10)  NOT NULL,
    title         VARCHAR(200) NOT NULL,
    title_am      VARCHAR(200),
    body          TEXT,
    body_am       TEXT,
    label         VARCHAR(60),             -- STORY: "2019", "March 2023"
    starts_at     TIMESTAMP,               -- EVENT
    ends_at       TIMESTAMP,               -- EVENT (optional)
    venue_name    VARCHAR(200),            -- EVENT
    venue_address VARCHAR(300),            -- EVENT
    map_url       VARCHAR(500),            -- EVENT
    sort_order    INTEGER      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT chk_site_item_event_time CHECK (kind <> 'EVENT' OR starts_at IS NOT NULL),
    CONSTRAINT chk_site_item_event_order CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at)
);

CREATE INDEX idx_site_item_kind ON site_item (kind, sort_order, id);
