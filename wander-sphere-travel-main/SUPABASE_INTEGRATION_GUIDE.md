# Supabase Backend Integration Guide

This guide explains the complete Supabase integration solution that has been implemented for the Wander Sphere Travel application.

## Overview

The integration fixes the connection between the frontend and Supabase backend by:
1. Setting up Row Level Security (RLS) policies
2. Creating an auth trigger to automatically sync users
3. Creating a proper service layer with correct foreign key handling
4. Ensuring authentication is properly checked before database operations

## Part 1: Backend Setup (SQL)

**File:** `backend/scripts/supabase-backend-setup.sql`

Run this SQL script in your Supabase SQL Editor. It will:

1. **Enable RLS** on all tables (users, trips, journeys, stories, notification_settings, etc.)
2. **Create Auth Trigger** - Automatically creates a user in `public.users` when someone signs up via Supabase Auth
3. **Set up RLS Policies** - Ensures users can only access their own data, with public read access where appropriate

### Key Features:
- Users are automatically created in `public.users` when they sign up
- Notification settings are automatically initialized for new users
- RLS policies ensure data security:
  - Users can view public profiles but only edit their own
  - Users can only manage their own trips, journeys, and stories
  - Public content (where `is_public = true`) is readable by everyone

## Part 2: TypeScript Types

**File:** `src/types/database.ts`

Complete TypeScript type definitions matching your database schema exactly, including:
- `DatabaseUser` - Matches the `users` table
- `DatabaseTrip` - Matches the `trips` table
- `DatabaseJourney` - Matches the `journeys` table
- `DatabaseStory` - Matches the `stories` table
- JSONB types for location, weather, budget, etc.
- Insert/Update types for creating and modifying records

## Part 3: Supabase Service Layer

**File:** `src/services/supabaseService.ts`

A dedicated service layer that handles all Supabase operations with proper authentication:

### Key Features:
- **Authentication Check** - All operations verify the user is authenticated
- **Automatic User ID** - `user_id` is automatically set from the current authenticated user
- **Foreign Key Validation** - When creating journeys/stories with `trip_id`, it validates the trip exists and belongs to the user
- **Error Handling** - Proper error messages for RLS violations and missing data

### Services Provided:
- `userService` - Get and update user profiles
- `tripService` - CRUD operations for trips
- `journeyService` - CRUD operations for journeys (with trip_id support)
- `storyService` - CRUD operations for stories (with trip_id support)

## Part 4: Updated Service Files

The existing service files have been updated to use Supabase directly:

### `src/services/tripService.ts`
- Now uses `supabaseService.tripService` directly
- Automatically sets `user_id` from authenticated user
- Transforms database types to the existing interface for backward compatibility

### `src/services/journeyService.ts`
- Now uses `supabaseService.journeyService` directly
- Supports `trip_id` parameter when creating journeys
- Validates trip ownership before allowing journey creation

### `src/services/storyService.ts`
- Now uses `supabaseService.storyService` directly
- Supports `trip_id` parameter when creating stories
- Validates trip ownership before allowing story creation

## Usage Examples

### Creating a Trip

```typescript
import { tripService } from '@/services/tripService';

const newTrip = await tripService.createTrip({
  title: 'Summer Vacation',
  description: 'A trip to the beach',
  destination: {
    country: 'USA',
    city: 'Miami',
    coordinates: { latitude: 25.7617, longitude: -80.1918 }
  },
  dates: {
    startDate: '2024-06-01',
    endDate: '2024-06-07'
  },
  budget: {
    total: 2000,
    currency: 'USD'
  },
  maxParticipants: 4,
  category: 'beach',
  visibility: 'public',
  tags: ['beach', 'summer', 'relaxation']
});
```

### Creating a Journey for a Trip

```typescript
import { journeyService } from '@/services/journeyService';

const newJourney = await journeyService.createJourney({
  title: 'First Day in Miami',
  description: 'Arrived and explored the beach',
  content: 'We arrived early and spent the day at the beach...',
  isPublic: true,
  images: ['https://example.com/beach.jpg']
}, tripId); // Pass the trip_id here
```

### Creating a Story for a Trip

```typescript
import { storyService } from '@/services/storyService';

// First upload the media file to get a URL
const mediaUrl = 'https://example.com/story-image.jpg';

const newStory = await storyService.createStory({
  media: file, // File object
  mediaType: 'image'
}, mediaUrl, tripId); // Pass mediaUrl and trip_id
```

## Important Notes

1. **Authentication Required**: All operations require the user to be authenticated. If not authenticated, operations will throw an error: "Not authenticated. Please log in to continue."

2. **Foreign Key Relationships**: 
   - When creating a journey or story with a `trip_id`, the system validates:
     - The trip exists
     - The trip belongs to the current user
   - If validation fails, an error is thrown

3. **RLS Policies**: The RLS policies ensure:
   - Users can only see/edit their own data
   - Public content (`is_public = true`) is readable by everyone
   - Private content is only accessible by the owner

4. **Backward Compatibility**: The service interfaces remain the same, so existing code should continue to work without changes.

## Next Steps

1. **Run the SQL Script**: Execute `backend/scripts/supabase-backend-setup.sql` in your Supabase SQL Editor
2. **Test Authentication**: Verify that user signup automatically creates a record in `public.users`
3. **Test CRUD Operations**: Try creating trips, journeys, and stories to verify the foreign key relationships work correctly
4. **Check RLS**: Verify that users can only access their own data and public content

## Troubleshooting

### RLS Violation Errors
If you see RLS violation errors:
1. Make sure you've run the SQL setup script
2. Verify the user is authenticated (check `supabase.auth.getUser()`)
3. Check that the RLS policies are enabled on the table

### Foreign Key Errors
If you see foreign key errors:
1. Verify the `trip_id` exists and belongs to the current user
2. Check that the `user_id` is being set correctly (it should be automatic)

### Authentication Errors
If operations fail with "Not authenticated":
1. Check that the user is logged in
2. Verify the Supabase session is valid
3. Check that the auth token hasn't expired

## Files Created/Modified

### New Files:
- `backend/scripts/supabase-backend-setup.sql` - SQL setup script
- `src/types/database.ts` - Database type definitions
- `src/services/supabaseService.ts` - Core Supabase service layer

### Modified Files:
- `src/services/tripService.ts` - Updated to use Supabase directly
- `src/services/journeyService.ts` - Updated to use Supabase directly
- `src/services/storyService.ts` - Updated to use Supabase directly

