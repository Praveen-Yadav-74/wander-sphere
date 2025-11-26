-- =============================================
-- CREATE MISSING BOOKING TABLES
-- Run this in Supabase SQL Editor
-- =============================================
-- This fixes the PGRST205 errors by creating the tables
-- that the backend code is trying to query
-- =============================================

-- 1. Create the missing Booking Partners table
CREATE TABLE IF NOT EXISTS public.booking_partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  commission_rate DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  categories TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create the missing Booking Features table
CREATE TABLE IF NOT EXISTS public.booking_features (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon_name TEXT,
  icon TEXT, -- Alternative field name used in code
  category TEXT, -- 'booking' | 'planning' | 'support'
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  order INTEGER DEFAULT 0, -- Alternative field name used in code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Enable RLS (Security) but allow PUBLIC READ access
ALTER TABLE IF EXISTS public.booking_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.booking_features ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view partners" ON public.booking_partners;
DROP POLICY IF EXISTS "Public can view features" ON public.booking_features;

-- Create policies for public read access
CREATE POLICY "Public can view partners" 
  ON public.booking_partners 
  FOR SELECT 
  USING (true);

CREATE POLICY "Public can view features" 
  ON public.booking_features 
  FOR SELECT 
  USING (true);

-- 4. Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_booking_partners_updated_at ON public.booking_partners;
CREATE TRIGGER update_booking_partners_updated_at
  BEFORE UPDATE ON public.booking_partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_booking_features_updated_at ON public.booking_features;
CREATE TRIGGER update_booking_features_updated_at
  BEFORE UPDATE ON public.booking_features
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Insert some dummy data so the frontend has something to show
INSERT INTO public.booking_partners (name, description, logo_url, website_url, commission_rate, is_active, categories)
VALUES 
  ('Expedia', 'Complete travel booking platform', '/placeholder.svg', 'https://expedia.com', 4.5, true, ARRAY['hotels', 'flights', 'car-rental']),
  ('Booking.com', 'Find and book accommodations worldwide', '/placeholder.svg', 'https://booking.com', 5.0, true, ARRAY['hotels', 'apartments', 'resorts']),
  ('Airbnb', 'Unique stays and experiences', '/placeholder.svg', 'https://airbnb.com', 3.0, true, ARRAY['apartments', 'houses', 'unique-stays'])
ON CONFLICT DO NOTHING;

INSERT INTO public.booking_features (title, description, icon_name, icon, category, is_active, display_order, "order")
VALUES 
  ('Easy Booking', 'Book in 3 clicks', 'check-circle', 'check-circle', 'booking', true, 1, 1),
  ('Best Prices', 'Guaranteed low rates', 'dollar-sign', 'dollar-sign', 'booking', true, 2, 2),
  ('24/7 Support', 'Round-the-clock assistance', 'headphones', 'headphones', 'support', true, 3, 3),
  ('Secure Payments', 'Your payment information is always protected', 'shield', 'shield', 'booking', true, 4, 4)
ON CONFLICT DO NOTHING;

-- =============================================
-- SETUP COMPLETE
-- =============================================
-- Tables created with public read access
-- Sample data inserted
-- Ready for frontend to query without authentication

