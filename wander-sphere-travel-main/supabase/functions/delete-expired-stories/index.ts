/**
 * Supabase Edge Function: delete-expired-stories
 * 
 * Automatically deletes expired stories from both Bunny.net storage and Supabase database.
 * 
 * Workflow:
 * 1. Query stories table for rows where expires_at < NOW()
 * 2. For each expired story, delete the file from Bunny.net using storage_path
 * 3. If deletion succeeds (or file doesn't exist), delete the row from Supabase
 * 4. Log results for monitoring
 * 
 * Schedule: Run every hour via pg_cron
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// =============================================
// TYPES
// =============================================

interface ExpiredStory {
  id: string;
  user_id: string;
  storage_path: string;
  media_url: string;
  created_at: string;
  expires_at: string;
}

interface CleanupResult {
  success: boolean;
  totalExpired: number;
  deletedFromBunny: number;
  deletedFromDatabase: number;
  errors: string[];
}

// =============================================
// BUNNY.NET CONFIGURATION
// =============================================

const BUNNY_CONFIG = {
  storageName: Deno.env.get('BUNNY_STORAGE_NAME') || '',
  accessKey: Deno.env.get('BUNNY_ACCESS_KEY') || '',
  hostname: Deno.env.get('BUNNY_HOSTNAME') || '',
};

// Validate Bunny.net configuration
function validateBunnyConfig(): void {
  if (!BUNNY_CONFIG.storageName || !BUNNY_CONFIG.accessKey || !BUNNY_CONFIG.hostname) {
    throw new Error('Missing Bunny.net configuration. Set BUNNY_STORAGE_NAME, BUNNY_ACCESS_KEY, and BUNNY_HOSTNAME.');
  }
}

// =============================================
// BUNNY.NET DELETE FUNCTION
// =============================================

/**
 * Delete a file from Bunny.net storage
 * 
 * @param storagePath - Relative path to file (e.g., "stories/12345_abc.jpg")
 * @returns Promise<boolean> - Whether deletion was successful
 */
async function deleteFromBunny(storagePath: string): Promise<boolean> {
  try {
    // Construct delete URL: https://{hostname}/{storageName}/{storagePath}
    const deleteUrl = `https://${BUNNY_CONFIG.hostname}/${BUNNY_CONFIG.storageName}/${storagePath}`;

    console.log(`Deleting from Bunny.net: ${deleteUrl}`);

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'AccessKey': BUNNY_CONFIG.accessKey,
      },
    });

    // Success if 200 or 404 (file already deleted)
    if (response.status === 200 || response.status === 204) {
      console.log(`✓ Successfully deleted: ${storagePath}`);
      return true;
    } else if (response.status === 404) {
      console.warn(`⚠ File not found (may already be deleted): ${storagePath}`);
      return true; // Consider it successful if file doesn't exist
    } else {
      console.error(`✗ Failed to delete: ${storagePath} (Status: ${response.status})`);
      return false;
    }
  } catch (error) {
    console.error(`✗ Error deleting from Bunny.net: ${storagePath}`, error);
    return false;
  }
}

// =============================================
// MAIN CLEANUP FUNCTION
// =============================================

async function cleanupExpiredStories(): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: true,
    totalExpired: 0,
    deletedFromBunny: 0,
    deletedFromDatabase: 0,
    errors: [],
  };

  try {
    // Validate configuration
    validateBunnyConfig();

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Searching for expired stories...');

    // Step 1: Query expired stories
    const { data: expiredStories, error: queryError } = await supabase
      .from('stories')
      .select('id, user_id, storage_path, media_url, created_at, expires_at')
      .lt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true });

    if (queryError) {
      throw new Error(`Database query failed: ${queryError.message}`);
    }

    if (!expiredStories || expiredStories.length === 0) {
      console.log('✓ No expired stories found');
      return result;
    }

    result.totalExpired = expiredStories.length;
    console.log(`📋 Found ${result.totalExpired} expired stories`);

    // Step 2: Process each expired story
    for (const story of expiredStories as ExpiredStory[]) {
      console.log(`\n📌 Processing story ID: ${story.id}`);
      console.log(`   Expired at: ${story.expires_at}`);
      console.log(`   Storage path: ${story.storage_path}`);

      try {
        // Step 2a: Delete from Bunny.net
        if (story.storage_path) {
          const bunnyDeleted = await deleteFromBunny(story.storage_path);
          
          if (bunnyDeleted) {
            result.deletedFromBunny++;
          } else {
            result.errors.push(`Failed to delete ${story.id} from Bunny.net`);
            // Continue anyway - we still want to delete from database
          }
        } else {
          console.warn(`⚠ Story ${story.id} has no storage_path, skipping Bunny.net deletion`);
        }

        // Step 2b: Delete from Supabase database
        const { error: deleteError } = await supabase
          .from('stories')
          .delete()
          .eq('id', story.id);

        if (deleteError) {
          console.error(`✗ Failed to delete story ${story.id} from database:`, deleteError);
          result.errors.push(`Database deletion failed for ${story.id}: ${deleteError.message}`);
        } else {
          result.deletedFromDatabase++;
          console.log(`✓ Story ${story.id} deleted from database`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`✗ Error processing story ${story.id}:`, errorMessage);
        result.errors.push(`Error processing ${story.id}: ${errorMessage}`);
      }
    }

    // Summary
    console.log('\n📊 Cleanup Summary:');
    console.log(`   Total expired: ${result.totalExpired}`);
    console.log(`   Deleted from Bunny.net: ${result.deletedFromBunny}`);
    console.log(`   Deleted from database: ${result.deletedFromDatabase}`);
    console.log(`   Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.error('\n⚠ Errors encountered:');
      result.errors.forEach(err => console.error(`   - ${err}`));
      result.success = false;
    }

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Cleanup failed:', errorMessage);
    result.success = false;
    result.errors.push(errorMessage);
    return result;
  }
}

// =============================================
// HTTP HANDLER
// =============================================

serve(async (req) => {
  try {
    // Only allow POST requests (for security)
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('🚀 Starting expired stories cleanup...');
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

    // Run cleanup
    const result = await cleanupExpiredStories();

    // Return response
    return new Response(
      JSON.stringify({
        success: result.success,
        message: result.success ? 'Cleanup completed successfully' : 'Cleanup completed with errors',
        data: {
          totalExpired: result.totalExpired,
          deletedFromBunny: result.deletedFromBunny,
          deletedFromDatabase: result.deletedFromDatabase,
          errors: result.errors,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: result.success ? 200 : 207, // 207 = Multi-Status (partial success)
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
