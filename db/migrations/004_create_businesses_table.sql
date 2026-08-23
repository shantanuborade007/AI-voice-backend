BEGIN;

CREATE TYPE business_category_enum AS ENUM (
  'restaurant_cafe',
  'retail_shop',
  'clinic_doctor',
  'salon_spa',
  'professional_services',
  'other'
);

CREATE TYPE business_status_enum AS ENUM (
  'draft',
  'pending_review',
  'active',
  'suspended'
);

CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_id UUID NOT NULL,
    CONSTRAINT fk_businesses_owner
    FOREIGN KEY (owner_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    name VARCHAR(150) NOT NULL,
    category business_category_enum NOT NULL DEFAULT 'other',
    description TEXT,
    status business_status_enum NOT NULL DEFAULT 'draft',
    website_url VARCHAR(255),
    social_links JSONB,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_businesses_owner_id
    ON businesses(owner_id);

-- Record this migration so it is not applied again
INSERT INTO schema_migrations (version)
VALUES ('004_create_businesses_table.sql')
ON CONFLICT DO NOTHING;

COMMIT;
