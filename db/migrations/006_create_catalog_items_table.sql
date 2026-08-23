BEGIN;

CREATE TABLE IF NOT EXISTS catalog_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    business_id UUID NOT NULL,
    CONSTRAINT fk_catalog_items_business
    FOREIGN KEY (business_id)
    REFERENCES businesses(id)
    ON DELETE CASCADE,

    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    image_url VARCHAR(500),
    category VARCHAR(100),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_catalog_items_business_id
    ON catalog_items(business_id);

-- Record this migration so it is not applied again
INSERT INTO schema_migrations (version)
VALUES ('006_create_catalog_items_table.sql')
ON CONFLICT DO NOTHING;

COMMIT;
