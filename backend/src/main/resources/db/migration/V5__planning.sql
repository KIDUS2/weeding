-- Private planning tools for the couple (admin only).
CREATE TABLE planning_task (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    category    VARCHAR(30)  NOT NULL DEFAULT 'OTHER',
    due_date    DATE,
    done        BOOLEAN      NOT NULL DEFAULT FALSE,
    done_at     TIMESTAMP,
    assignee    VARCHAR(80),
    notes       VARCHAR(1000),
    created_at  TIMESTAMP    NOT NULL DEFAULT now()
);
CREATE INDEX idx_planning_task_due ON planning_task (done, due_date);

CREATE TABLE budget_item (
    id            BIGSERIAL PRIMARY KEY,
    category      VARCHAR(30)    NOT NULL DEFAULT 'OTHER',
    name          VARCHAR(200)   NOT NULL,
    vendor_name   VARCHAR(160),
    vendor_phone  VARCHAR(40),
    estimated     NUMERIC(14, 2) NOT NULL DEFAULT 0,
    actual        NUMERIC(14, 2),
    paid          NUMERIC(14, 2) NOT NULL DEFAULT 0,
    due_date      DATE,
    notes         VARCHAR(1000),
    created_at    TIMESTAMP      NOT NULL DEFAULT now(),
    CONSTRAINT chk_budget_non_negative CHECK (estimated >= 0 AND paid >= 0 AND (actual IS NULL OR actual >= 0))
);

CREATE TABLE planning_settings (
    id            BIGINT PRIMARY KEY,
    total_budget  NUMERIC(14, 2)
);
INSERT INTO planning_settings (id, total_budget) VALUES (1, NULL);
