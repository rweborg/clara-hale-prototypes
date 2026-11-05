-- The Case Desk — Phase 1 schema.
-- Progress hangs off a case session (one host participant for solo play)
-- so a later co-op release can add guests without a new save model.
-- Desk state is append-only events plus one upserted resume checkpoint,
-- not a single opaque blob as the only record.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz
);

CREATE TABLE magic_link_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  device_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX magic_link_tokens_email_idx ON magic_link_tokens (email);

CREATE TABLE auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_sessions_user_idx ON auth_sessions (user_id);

CREATE TABLE cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  blurb text,
  difficulty text,
  genres text[] NOT NULL DEFAULT '{}',
  status text NOT NULL CHECK (status IN ('draft', 'live', 'retired')),
  access text NOT NULL DEFAULT 'paid' CHECK (access IN ('free', 'paid')),
  cover_url text,
  content_version text NOT NULL DEFAULT '1',
  price_cents integer CHECK (price_cents IS NULL OR price_cents >= 0),
  -- Filled when a real Etsy listing exists. The mock SKU is a stand-in.
  etsy_sku text,
  etsy_listing_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users (id),
  case_id uuid NOT NULL REFERENCES cases (id),
  -- etsy (real, later), etsy_mock, gift, comp
  channel text NOT NULL CHECK (channel IN ('etsy', 'etsy_mock', 'gift', 'comp')),
  amount_cents integer CHECK (amount_cents IS NULL OR amount_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  etsy_order_id text,
  -- Masked hint only (CD-····-····-AB12). The full code is never stored.
  redeemed_code text,
  sku text,
  mock boolean NOT NULL DEFAULT false,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX purchases_user_idx ON purchases (user_id);
CREATE INDEX purchases_case_idx ON purchases (case_id);
CREATE INDEX purchases_etsy_order_idx ON purchases (etsy_order_id);

CREATE TABLE entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES cases (id),
  source text NOT NULL CHECK (source IN ('etsy', 'etsy_mock', 'gift', 'comp')),
  external_order_id text,
  purchase_id uuid REFERENCES purchases (id),
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, case_id)
);
CREATE INDEX entitlements_user_idx ON entitlements (user_id);
CREATE INDEX entitlements_case_idx ON entitlements (case_id);

CREATE TABLE redeem_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash text NOT NULL UNIQUE,
  -- Last four characters, so an operator can tell codes apart without the secret.
  code_hint text NOT NULL,
  case_id uuid NOT NULL REFERENCES cases (id),
  sku text,
  channel text NOT NULL DEFAULT 'etsy_mock' CHECK (channel IN ('etsy', 'etsy_mock', 'gift', 'comp')),
  -- True until a real Etsy fulfillment path inserts codes. No Etsy API calls in Phase 1.
  mock boolean NOT NULL DEFAULT true,
  purchase_id uuid REFERENCES purchases (id),
  redeemed_by uuid REFERENCES users (id),
  redeemed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX redeem_codes_case_idx ON redeem_codes (case_id);

CREATE TABLE case_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases (id),
  host_user_id uuid NOT NULL REFERENCES users (id),
  status text NOT NULL CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX case_sessions_host_idx ON case_sessions (host_user_id);
CREATE INDEX case_sessions_case_idx ON case_sessions (case_id);
-- Solo play keeps a single active session per player per case.
CREATE UNIQUE INDEX case_sessions_one_active_idx
  ON case_sessions (host_user_id, case_id)
  WHERE status = 'active';

CREATE TABLE session_participants (
  session_id uuid NOT NULL REFERENCES case_sessions (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users (id),
  role text NOT NULL CHECK (role IN ('host', 'guest')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, user_id)
);
CREATE INDEX session_participants_user_idx ON session_participants (user_id);

CREATE TABLE desk_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES case_sessions (id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES users (id),
  kind text NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_event_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, client_event_id)
);
CREATE INDEX desk_events_session_idx ON desk_events (session_id, created_at);

CREATE TABLE progress_checkpoints (
  session_id uuid NOT NULL REFERENCES case_sessions (id) ON DELETE CASCADE,
  checkpoint text NOT NULL,
  summary_json jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, checkpoint)
);

CREATE TABLE ratings (
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES cases (id),
  stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  body text CHECK (body IS NULL OR char_length(body) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, case_id)
);
CREATE INDEX ratings_case_idx ON ratings (case_id);

-- Thin ops rollup. The admin page reads this; charts wait for Phase 2.
CREATE VIEW ops_case_counts AS
SELECT
  c.id,
  c.slug,
  c.title,
  c.status,
  c.access,
  (SELECT count(*) FROM entitlements e WHERE e.case_id = c.id) AS owners,
  (SELECT count(*) FROM purchases p WHERE p.case_id = c.id AND NOT p.mock) AS purchases,
  (SELECT count(*) FROM purchases p WHERE p.case_id = c.id AND p.mock) AS mock_purchases,
  (SELECT round(avg(r.stars)::numeric, 2) FROM ratings r WHERE r.case_id = c.id) AS avg_stars,
  (SELECT count(*) FROM ratings r WHERE r.case_id = c.id) AS rating_count
FROM cases c;

-- Clara Hale ships free: the live game at nextsteps.fun is already public.
-- A redeem code can still attach an entitlement (the mock Etsy path).
-- Paid cases added later use access = 'paid' and require an entitlement.
INSERT INTO cases (
  slug, title, blurb, difficulty, genres, status, access,
  cover_url, content_version, price_cents, etsy_sku
) VALUES (
  'clara-hale',
  'The Vanishing of Clara Hale',
  'A woman is missing from a small Montana town. Listen, look, and work out what happened.',
  'standard',
  ARRAY['mystery', 'investigation'],
  'live',
  'free',
  'assets/covers/clara-hale.jpg',
  '1.4.0',
  0,
  'MOCK-CLARA-HALE'
);
