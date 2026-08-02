import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ teams: [] });
  }

  const apiKey = process.env.SPORTS_API_KEY;
  const res = await fetch(
    `https://www.thesportsdb.com/api/v1/json/${apiKey}/searchteams.php?t=${encodeURIComponent(query)}`
  );
  const data = await res.json();

  return NextResponse.json({ teams: data.teams || [] });
}