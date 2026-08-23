BEGIN;

CREATE TYPE subscription_status_enum AS ENUM (
  'trialing',
  'active',
  'past_due',
  'cancelled'
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    business_id UUID NOT NULL UNIQUE,
    CONSTRAINT fk_subscriptions_business
    FOREIGN KEY (business_id)
    REFERENCES businesses(id)
    ON DELETE CASCADE,

    plan_id UUID NOT NULL,
    CONSTRAINT fk_subscriptions_plan
    FOREIGN KEY (plan_id)
    REFERENCES subscription_plans(id),

    status subscription_status_enum NOT NULL DEFAULT 'trialing',
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    payment_provider VARCHAR(50),
    payment_provider_reference VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_subscriptions_plan_id
    ON subscriptions(plan_id);

-- Record this migration so it is not applied again
INSERT INTO schema_migrations (version)
VALUES ('010_create_subscriptions_table.sql')
ON CONFLICT DO NOTHING;

COMMIT;
