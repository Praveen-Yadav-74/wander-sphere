// run-migration.mjs – Applies flight_bookings migration to Supabase
// Run: node run-migration.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gserzaenfrmrqoffzcxr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZXJ6YWVuZnJtcnFvZmZ6Y3hyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjExNzc5OSwiZXhwIjoyMDcxNjkzNzk5fQ.odO_-TqCDpliDv-TplUokm08gfoZARABo62vCTDRWCw';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Split into individual statements so we can run them via rpc
const statements = [
  // 1. flight_bookings table
  `CREATE TABLE IF NOT EXISTS public.flight_bookings (
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
  )`,

  // 2. flight_queue table
  `CREATE TABLE IF NOT EXISTS public.flight_queue (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id  TEXT NOT NULL,
    user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason      TEXT,
    resolved    BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  )`,

  // 3. Indexes
  `CREATE INDEX IF NOT EXISTS idx_flight_bookings_user_id ON public.flight_bookings(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_flight_bookings_status  ON public.flight_bookings(status)`,
  `CREATE INDEX IF NOT EXISTS idx_flight_queue_resolved   ON public.flight_queue(resolved)`,

  // 4. RLS
  `ALTER TABLE public.flight_bookings ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.flight_queue    ENABLE ROW LEVEL SECURITY`,

  // 5. Policies
  `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename='flight_bookings' AND policyname='Users can view own bookings'
    ) THEN
      CREATE POLICY "Users can view own bookings"
        ON public.flight_bookings FOR SELECT USING (auth.uid() = user_id);
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename='flight_bookings' AND policyname='Users can insert own bookings'
    ) THEN
      CREATE POLICY "Users can insert own bookings"
        ON public.flight_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename='flight_bookings' AND policyname='Service role full access on bookings'
    ) THEN
      CREATE POLICY "Service role full access on bookings"
        ON public.flight_bookings FOR ALL USING (auth.role() = 'service_role');
    END IF;
  END $$`,

  `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename='flight_queue' AND policyname='Service role full access on queue'
    ) THEN
      CREATE POLICY "Service role full access on queue"
        ON public.flight_queue FOR ALL USING (auth.role() = 'service_role');
    END IF;
  END $$`,

  // 6. updated_at trigger function
  `CREATE OR REPLACE FUNCTION public.set_updated_at()
   RETURNS TRIGGER LANGUAGE plpgsql AS $$
   BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$`,

  // 7. Trigger
  `DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname='trg_flight_bookings_updated_at'
    ) THEN
      CREATE TRIGGER trg_flight_bookings_updated_at
        BEFORE UPDATE ON public.flight_bookings
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
  END $$`,
];

async function runMigration() {
  console.log('🚀 Running flight_bookings migration...\n');
  let ok = 0;
  let failed = 0;

  for (const sql of statements) {
    const preview = sql.trim().split('\n')[0].substring(0, 60);
    const { error } = await supabase.rpc('exec_sql', { sql }).catch(() => ({ error: { message: 'rpc not available' } }));

    if (error) {
      // Fallback: try via raw fetch to the pg endpoint
      const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ query: sql }),
      });

      if (!res.ok) {
        console.error(`  ❌ FAILED: ${preview}...`);
        console.error(`     ${error?.message ?? await res.text()}`);
        failed++;
      } else {
        console.log(`  ✅ OK: ${preview}...`);
        ok++;
      }
    } else {
      console.log(`  ✅ OK: ${preview}...`);
      ok++;
    }
  }

  console.log(`\n✨ Migration complete: ${ok} succeeded, ${failed} failed`);
  if (failed > 0) {
    console.log('\n⚠️  Some statements failed. Please run the SQL manually in the Supabase dashboard:');
    console.log('   https://supabase.com/dashboard/project/gserzaenfrmrqoffzcxr/sql/new');
  }
}

runMigration().catch(console.error);
