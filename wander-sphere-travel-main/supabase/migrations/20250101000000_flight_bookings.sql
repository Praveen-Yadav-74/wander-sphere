-- Flight Bookings table
CREATE TABLE IF NOT EXISTS public.flight_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      TEXT NOT NULL UNIQUE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pnr             TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','queue','cancelled','failed')),
  origin          TEXT,
  destination     TEXT,
  departure_date  DATE,
  passengers      JSONB,
  fare_amount     NUMERIC(12,2),
  currency        TEXT DEFAULT 'INR',
  raw_response    JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Flight Queue table (failed ticketing fallback)
CREATE TABLE IF NOT EXISTS public.flight_queue (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  TEXT NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason      TEXT,
  resolved    BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_flight_bookings_user_id  ON public.flight_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_flight_bookings_status   ON public.flight_bookings(status);
CREATE INDEX IF NOT EXISTS idx_flight_queue_resolved    ON public.flight_queue(resolved);

-- RLS
ALTER TABLE public.flight_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_queue    ENABLE ROW LEVEL SECURITY;

-- Users can only see their own bookings
CREATE POLICY "Users can view own bookings"
  ON public.flight_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
  ON public.flight_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (used by backend)
CREATE POLICY "Service role full access on bookings"
  ON public.flight_bookings FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on queue"
  ON public.flight_queue FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_flight_bookings_updated_at
  BEFORE UPDATE ON public.flight_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
