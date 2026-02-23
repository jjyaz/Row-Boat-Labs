import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GoogleTokens {
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return { access_token: data.access_token, expires_in: data.expires_in };
}

async function getValidToken(
  supabase: any,
  userId: string,
  tokens: GoogleTokens
): Promise<string | null> {
  const now = new Date();
  const expiresAt = tokens.token_expires_at ? new Date(tokens.token_expires_at) : null;

  // If token is still valid (with 5 min buffer), use it
  if (expiresAt && expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return tokens.access_token;
  }

  // Try to refresh
  if (!tokens.refresh_token) return null;
  const refreshed = await refreshAccessToken(tokens.refresh_token);
  if (!refreshed) return null;

  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  await supabase
    .from("integrations")
    .update({ access_token: refreshed.access_token, token_expires_at: newExpiresAt })
    .eq("user_id", userId)
    .eq("provider", "google");

  return refreshed.access_token;
}

async function fetchGmailMessages(accessToken: string, maxResults = 20) {
  // List message IDs
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=is:inbox`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!listRes.ok) {
    const err = await listRes.text();
    throw new Error(`Gmail list failed: ${err}`);
  }
  const listData = await listRes.json();
  const messageIds: string[] = (listData.messages || []).map((m: any) => m.id);

  // Fetch each message (metadata only for speed)
  const messages = await Promise.all(
    messageIds.map(async (id) => {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) return null;
      return res.json();
    })
  );

  return messages.filter(Boolean).map((msg: any) => {
    const headers = msg.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || null;
    return {
      external_id: msg.id,
      title: getHeader("Subject"),
      summary: `From: ${getHeader("From") || "unknown"}`,
      raw_data: {
        snippet: msg.snippet,
        from: getHeader("From"),
        date: getHeader("Date"),
        labels: msg.labelIds,
      },
    };
  });
}

async function fetchCalendarEvents(accessToken: string, maxResults = 50) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    timeMin: thirtyDaysAgo.toISOString(),
    timeMax: thirtyDaysAhead.toISOString(),
    maxResults: maxResults.toString(),
    singleEvents: "true",
    orderBy: "startTime",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Calendar fetch failed: ${err}`);
  }
  const data = await res.json();

  return (data.items || []).map((event: any) => ({
    external_id: event.id,
    title: event.summary || "Untitled event",
    summary: [
      event.start?.dateTime || event.start?.date,
      event.location,
      event.organizer?.displayName || event.organizer?.email,
    ]
      .filter(Boolean)
      .join(" · "),
    raw_data: {
      start: event.start,
      end: event.end,
      location: event.location,
      description: event.description,
      attendees: (event.attendees || []).map((a: any) => ({
        email: a.email,
        displayName: a.displayName,
        responseStatus: a.responseStatus,
      })),
      organizer: event.organizer,
      htmlLink: event.htmlLink,
      status: event.status,
    },
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAnon.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // Get integration with service role (to read tokens)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: integration } = await supabaseAdmin
      .from("integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "google")
      .maybeSingle();

    if (!integration || integration.status !== "connected") {
      return new Response(
        JSON.stringify({ error: "Google not connected. Please connect in Settings first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getValidToken(supabaseAdmin, userId, {
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      token_expires_at: integration.token_expires_at,
    });

    if (!accessToken) {
      // Mark as disconnected if we can't get a valid token
      await supabaseAdmin
        .from("integrations")
        .update({ status: "disconnected" })
        .eq("user_id", userId)
        .eq("provider", "google");

      return new Response(
        JSON.stringify({ error: "Google token expired. Please reconnect in Settings." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse which sources to sync
    const body = await req.json().catch(() => ({}));
    const syncTypes: string[] = body.types || ["email", "calendar_event"];

    // Create a sync run
    const { data: syncRun } = await supabaseAdmin.from("sync_runs").insert({
      user_id: userId,
      provider: "google",
      status: "running",
    }).select().single();

    const errors: any[] = [];
    let totalProcessed = 0;

    // Sync Gmail
    if (syncTypes.includes("email")) {
      try {
        const emails = await fetchGmailMessages(accessToken);
        for (const email of emails) {
          await supabaseAdmin.from("sources").upsert(
            {
              user_id: userId,
              source_type: "email",
              provider: "google",
              external_id: email.external_id,
              title: email.title,
              summary: email.summary,
              raw_data: email.raw_data,
            },
            { onConflict: "user_id,source_type,external_id" }
          );
          totalProcessed++;
        }
      } catch (err: any) {
        errors.push({ type: "email", message: err.message });
      }
    }

    // Sync Calendar
    if (syncTypes.includes("calendar_event")) {
      try {
        const events = await fetchCalendarEvents(accessToken);
        for (const event of events) {
          await supabaseAdmin.from("sources").upsert(
            {
              user_id: userId,
              source_type: "calendar_event",
              provider: "google",
              external_id: event.external_id,
              title: event.title,
              summary: event.summary,
              raw_data: event.raw_data,
            },
            { onConflict: "user_id,source_type,external_id" }
          );
          totalProcessed++;
        }
      } catch (err: any) {
        errors.push({ type: "calendar_event", message: err.message });
      }
    }

    // Update sync run
    const finalStatus = errors.length > 0 ? "completed_with_errors" : "completed";
    if (syncRun) {
      await supabaseAdmin
        .from("sync_runs")
        .update({
          status: finalStatus,
          finished_at: new Date().toISOString(),
          items_processed: totalProcessed,
          errors: errors.length > 0 ? errors : null,
        })
        .eq("id", syncRun.id);
    }

    // Update last_sync_at on integration
    await supabaseAdmin
      .from("integrations")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("provider", "google");

    return new Response(
      JSON.stringify({
        success: true,
        status: finalStatus,
        items_processed: totalProcessed,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
