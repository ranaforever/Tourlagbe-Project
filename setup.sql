
-- Optimized SQL Setup for Tour লাগবে (Tour Lagbe)
-- This script ensures that Admin Panel edits (like renaming a tour) 
-- automatically update all existing bookings.

-- 1. Master Data Tables
CREATE TABLE IF NOT EXISTS tl_tours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  fee NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tl_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tl_customer_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT UNIQUE NOT NULL,
  fee NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Transactional Table with Cascading Relations
CREATE TABLE IF NOT EXISTS tl_bookings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  address TEXT,
  gender TEXT,
  religion TEXT,
  -- Link to tour name. ON UPDATE CASCADE ensures renames in Admin Panel flow through.
  tour_name TEXT REFERENCES tl_tours(name) ON UPDATE CASCADE ON DELETE SET NULL,
  tour_fees NUMERIC DEFAULT 0,
  customer_type TEXT,
  customer_type_fees NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  advance_amount NUMERIC DEFAULT 0,
  due_amount NUMERIC DEFAULT 0,
  payment_status TEXT,
  bus_no TEXT,
  seat_no TEXT NOT NULL,
  booked_by TEXT,
  booker_code TEXT,
  booking_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tl_expenses (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by TEXT,
  agent_code TEXT,
  -- Link to tour name for reporting
  tour_name TEXT REFERENCES tl_tours(name) ON UPDATE CASCADE ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tl_locks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bus_no TEXT NOT NULL,
  seat_no TEXT NOT NULL,
  agent_code TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(bus_no, seat_no)
);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_mobile ON tl_bookings(mobile);
CREATE INDEX IF NOT EXISTS idx_bookings_tour ON tl_bookings(tour_name);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON tl_expenses(date);

-- 4. Realtime Configuration (Idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
DECLARE
    tbl_name TEXT;
    tbl_list TEXT[] := ARRAY['tl_bookings', 'tl_locks', 'tl_agents', 'tl_tours', 'tl_customer_types', 'tl_expenses'];
BEGIN
    FOREACH tbl_name IN ARRAY tbl_list
    LOOP
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = tbl_name AND schemaname = 'public') THEN
            IF NOT EXISTS (
                SELECT 1 FROM pg_publication_tables 
                WHERE pubname = 'supabase_realtime' 
                AND tablename = tbl_name
            ) THEN
                EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl_name);
            END IF;
        END IF;
    END LOOP;
END $$;
