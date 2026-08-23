BEGIN;

CREATE TYPE user_role_enum AS ENUM (
  'admin',
  'business_owner'
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'business_owner',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Record this migration so it is not applied again
INSERT INTO schema_migrations (version)
VALUES ('002_create_users_table.sql')
ON CONFLICT DO NOTHING;

COMMIT;
