BEGIN;

CREATE TYPE appointment_status_enum AS ENUM (
  'requested',
  'confirmed',
  'cancelled',
  'completed',
  'no_show'
);

CREATE TYPE appointment_source_enum AS ENUM (
  'phone_ai_agent',
  'manual',
  'web'
);

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    business_id UUID NOT NULL,
    CONSTRAINT fk_appointments_business
    FOREIGN KEY (business_id)
    REFERENCES businesses(id)
    ON DELETE CASCADE,

    location_id UUID,
    CONSTRAINT fk_appointments_location
    FOREIGN KEY (location_id)
    REFERENCES business_locations(id)
    ON DELETE SET NULL,

    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    status appointment_status_enum NOT NULL DEFAULT 'requested',
    source appointment_source_enum NOT NULL DEFAULT 'phone_ai_agent',
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_appointments_business_id
    ON appointments(business_id);

CREATE INDEX idx_appointments_location_id
    ON appointments(location_id);

-- Record this migration so it is not applied again
INSERT INTO schema_migrations (version)
VALUES ('009_create_appointments_table.sql')
ON CONFLICT DO NOTHING;

COMMIT;
