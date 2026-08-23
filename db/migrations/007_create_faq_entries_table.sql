BEGIN;

CREATE TABLE IF NOT EXISTS faq_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    business_id UUID NOT NULL,
    CONSTRAINT fk_faq_entries_business
    FOREIGN KEY (business_id)
    REFERENCES businesses(id)
    ON DELETE CASCADE,

    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_faq_entries_business_id
    ON faq_entries(business_id);

-- Record this migration so it is not applied again
INSERT INTO schema_migrations (version)
VALUES ('007_create_faq_entries_table.sql')
ON CONFLICT DO NOTHING;

COMMIT;
