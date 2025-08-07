import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StreamableResponse {
  shortcode: string;
  status: number;
  url: string;
  title: string;
  thumbnail_url: string;
  duration?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl, title, groupId, description, expiresInDays } = await req.json();
    
    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: 'Video URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Streamable credentials from secrets
    const streamableUsername = Deno.env.get('STREAMABLE_USERNAME');
    const streamablePassword = Deno.env.get('STREAMABLE_PASSWORD');
    
    if (!streamableUsername || !streamablePassword) {
      return new Response(
        JSON.stringify({ error: 'Streamable credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upload to Streamable
    const streamableResponse = await fetch('https://api.streamable.com/import', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${streamableUsername}:${streamablePassword}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: videoUrl,
        title: title || 'Untitled Video',
      }),
    });

    if (!streamableResponse.ok) {
      const errorData = await streamableResponse.text();
      console.error('Streamable API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to upload to Streamable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const streamableData: StreamableResponse = await streamableResponse.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate expiration date
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Get user ID from auth
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Save video to database
    const { data: video, error } = await supabase
      .from('videos')
      .insert({
        name: title || 'Untitled Video',
        description: description || '',
        video_id: streamableData.shortcode,
        video_link: streamableData.url,
        streamable_url: streamableData.url,
        streamable_shortcode: streamableData.shortcode,
        thumbnail_url: streamableData.thumbnail_url,
        duration: streamableData.duration,
        group_id: groupId,
        uploaded_by: userId,
        expires_at: expiresAt,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save video to database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        video,
        streamable: streamableData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});