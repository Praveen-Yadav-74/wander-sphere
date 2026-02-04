import { serve } from "serve";
import { createClient } from "supabase";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Init Clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; 
    
    // HARDCODED CREDENTIALS (Temporary Fix)
    const bunnyAccessKey = "a9ce5ca7-27cd-4358-8b8075ed96eb-a794-4d87";
    const bunnyStorageZone = "nomad-app-media";
    const bunnyHostname = "sg.storage.bunnycdn.com";

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Fetch Expired Stories (Older than 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: expiredStories, error: fetchError } = await supabase
      .from('stories')
      .select('id, media_url')
      .lt('created_at', twentyFourHoursAgo);

    if (fetchError) throw fetchError;

    if (!expiredStories || expiredStories.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expired stories found." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Found ${expiredStories.length} expired stories.`);

    // 3. Iterate and Delete
    const results = [];

    for (const story of expiredStories) {
      const url = story.media_url;
      let filePath = "";
      try {
        const urlObj = new URL(url);
        // Extract path relative to storage zone
        filePath = urlObj.pathname;
        if (filePath.startsWith('/')) filePath = filePath.substring(1);
      } catch (_e) {
        // If it's just a path string
        filePath = url;
      }

      // Delete from Bunny using the specific hostname
      const bunnyUrl = `https://${bunnyHostname}/${bunnyStorageZone}/${filePath}`;
      
      console.log(`Deleting from Bunny: ${bunnyUrl}`);
      
      const bunnyResponse = await fetch(bunnyUrl, {
        method: 'DELETE',
        headers: {
          'AccessKey': bunnyAccessKey
        }
      });

      if (bunnyResponse.ok || bunnyResponse.status === 404) {
          const { error: deleteError } = await supabase
            .from('stories')
            .delete()
            .eq('id', story.id);
            
          if (deleteError) {
              results.push({ id: story.id, status: 'db_delete_failed', error: deleteError });
          } else {
              results.push({ id: story.id, status: 'deleted' });
          }
      } else {
          console.error(`Failed to delete from Bunny: ${bunnyResponse.status}`);
          results.push({ id: story.id, status: 'bunny_delete_failed', code: bunnyResponse.status });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
