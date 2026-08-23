BEGIN;

CREATE TYPE phone_number_status_enum AS ENUM (
  'pending_kyc',
  'pending_assignment',
  'active',
  'suspended'
);

CREATE TABLE IF NOT EXISTS phone_number_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    business_id UUID NOT NULL UNIQUE,
    CONSTRAINT fk_phone_number_assignments_business
    FOREIGN KEY (business_id)
    REFERENCES businesses(id)
    ON DELETE CASCADE,

    telephony_provider VARCHAR(50) NOT NULL DEFAULT 'exotel',
    phone_number VARCHAR(20),
    provider_number_sid VARCHAR(100),
    status phone_number_status_enum NOT NULL DEFAULT 'pending_kyc',
    voice_agent_provider VARCHAR(50) NOT NULL DEFAULT 'sarvam_ai',
    notes TEXT,
    assigned_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Record this migration so it is not applied again
INSERT INTO schema_migrations (version)
VALUES ('011_create_phone_number_assignments_table.sql')
ON CONFLICT DO NOTHING;

COMMIT;
