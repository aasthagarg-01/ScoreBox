import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("team_id"); // internal Supabase teams.id
  const externalId = searchParams.get("external_id"); // TheSportsDB team id

  if (!teamId || !externalId) {
    return NextResponse.json({ error: "Missing team_id or external_id" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Check cache
  const { data: cached } = await supabase
    .from("games_cache")
    .select("*")
    .eq("team_id", teamId)
    .order("last_updated", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isFresh =
    cached && Date.now() - new Date(cached.last_updated).getTime() < CACHE_TTL_MS;

  if (isFresh) {
    return NextResponse.json({ source: "cache", data: cached });
  }

  // 2. Fetch fresh data from TheSportsDB (last + next event)
  const apiKey = process.env.SPORTS_API_KEY;
  const [lastRes, nextRes] = await Promise.all([
    fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/eventslast.php?id=${externalId}`),
    fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/eventsnext.php?id=${externalId}`),
  ]);
  const lastData = await lastRes.json();
  const nextData = await nextRes.json();

  const lastEvent = lastData.results?.[0] || null;
  const nextEvent = nextData.events?.[0] || null;

  const row = {
    team_id: Number(teamId),
    external_game_id: lastEvent?.idEvent || nextEvent?.idEvent || `no-event-${externalId}`,
    opponent: lastEvent
      ? lastEvent.strHomeTeam === lastEvent.strAwayTeam
        ? null
        : lastEvent.strAwayTeam
      : nextEvent?.strAwayTeam || null,
    score_home: lastEvent?.intHomeScore ? Number(lastEvent.intHomeScore) : null,
    score_away: lastEvent?.intAwayScore ? Number(lastEvent.intAwayScore) : null,
    status: lastEvent ? "last_played" : nextEvent ? "upcoming" : "no_data",
    start_time: nextEvent?.strTimestamp || lastEvent?.strTimestamp || null,
    last_updated: new Date().toISOString(),
  };

  // 3. Upsert into cache
  const { data: upserted, error } = await supabase
    .from("games_cache")
    .upsert(row, { onConflict: "external_game_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ source: "live", data: upserted });
}