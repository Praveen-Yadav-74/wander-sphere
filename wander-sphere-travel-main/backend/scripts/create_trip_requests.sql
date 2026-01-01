-- Create trip_requests table
CREATE TABLE IF NOT EXISTS public.trip_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, user_id)
);

-- Enable RLS
ALTER TABLE public.trip_requests ENABLE ROW LEVEL SECURITY;

-- Policies

-- Users can view their own requests
DROP POLICY IF EXISTS "Users can view own requests" ON public.trip_requests;
CREATE POLICY "Users can view own requests" ON public.trip_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Trip organizers can view requests for their trips
DROP POLICY IF EXISTS "Organizers can view requests for their trips" ON public.trip_requests;
CREATE POLICY "Organizers can view requests for their trips" ON public.trip_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.trips 
            WHERE trips.id = trip_requests.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

-- Users can create requests
DROP POLICY IF EXISTS "Users can create requests" ON public.trip_requests;
CREATE POLICY "Users can create requests" ON public.trip_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Organizers can update requests (approve/reject)
DROP POLICY IF EXISTS "Organizers can update requests" ON public.trip_requests;
CREATE POLICY "Organizers can update requests" ON public.trip_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.trips 
            WHERE trips.id = trip_requests.trip_id 
            AND trips.user_id = auth.uid()
        )
    );
    
-- Grant access to authenticated users
GRANT ALL ON public.trip_requests TO authenticated;
GRANT ALL ON public.trip_requests TO service_role;
