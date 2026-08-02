import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const externalId = searchParams.get("external_id");

  if (!externalId) {
    return NextResponse.json({ error: "Missing external_id" }, { status: 400 });
  }

  const apiKey = process.env.SPORTS_API_KEY;

  const [teamRes, rosterRes, lastRes, nextRes] = await Promise.all([
    fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/lookupteam.php?id=${externalId}`),
    fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/lookup_all_players.php?id=${externalId}`),
    fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/eventslast.php?id=${externalId}`),
    fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/eventsnext.php?id=${externalId}`),
  ]);

  const teamData = await teamRes.json();
  const rosterData = await rosterRes.json();
  const lastData = await lastRes.json();
  const nextData = await nextRes.json();

  const team = teamData.teams?.[0] || null;
  const roster = (rosterData.player || []).filter((p: any) => p.strStatus === "Active");
  const lastMatches = lastData.results || [];
  const nextMatch = nextData.events?.[0] || null;

  return NextResponse.json({ team, roster, lastMatches, nextMatch });
}