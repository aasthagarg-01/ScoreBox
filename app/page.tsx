"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [savedTeams, setSavedTeams] = useState<any[]>([]);
  const [matchData, setMatchData] = useState<Record<number, any>>({});
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  useEffect(() => {
    if (user) fetchSavedTeams();
  }, [user]);

  async function fetchMatchData(teamId: number, externalId: string) {
    const res = await fetch(`/api/team-matches?team_id=${teamId}&external_id=${externalId}`);
    const json = await res.json();
    setMatchData((prev) => ({ ...prev, [teamId]: json.data }));
  }

  async function fetchSavedTeams() {
    const { data, error } = await supabase
      .from("saved_teams")
      .select("id, teams(id, name, league, badge_url, external_id)")
      .eq("user_id", user.id);

    if (!error && data) {
      setSavedTeams(data);
      data.forEach((s: any) => {
        if (s.teams) fetchMatchData(s.teams.id, s.teams.external_id);
      });
    }
  }

  async function handleSearch() {
    setMessage("");
    const res = await fetch(`/api/search-team?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.teams || []);
  }

  async function handleSave(team: any) {
    if (!user) {
      setMessage("Please log in to save teams.");
      return;
    }

    // 1. Upsert team into teams table
    const { data: existingTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("external_id", team.idTeam)
      .single();

    let teamId = existingTeam?.id;

    if (!teamId) {
      const { data: newTeam, error: insertError } = await supabase
        .from("teams")
        .insert({
          external_id: team.idTeam,
          name: team.strTeam,
          league: team.strLeague,
          badge_url: team.strTeamBadge,
        })
        .select("id")
        .single();

      if (insertError) {
        setMessage(insertError.message);
        return;
      }
      teamId = newTeam.id;
    }

    // 2. Insert into saved_teams
    const { error: saveError } = await supabase
      .from("saved_teams")
      .insert({ user_id: user.id, team_id: teamId });

    setMessage(saveError ? saveError.message : `${team.strTeam} saved!`);
    fetchSavedTeams();
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 500 }}>
      <h1>Search Teams</h1>
      {!user && <p><a href="/login">Log in</a> to save teams.</p>}
      <input
        placeholder="Search a team..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: 8, width: "70%" }}
      />
      <button onClick={handleSearch} style={{ padding: "8px 16px", marginLeft: 10 }}>
        Search
      </button>

      {results.map((team) => (
        <div key={team.idTeam} style={{ marginTop: 20, borderBottom: "1px solid #333", paddingBottom: 10 }}>
          <p><strong>{team.strTeam}</strong> — {team.strLeague}</p>
          <button onClick={() => handleSave(team)} style={{ padding: "6px 12px" }}>
            Save Team
          </button>
        </div>
      ))}

      {message && <p style={{ marginTop: 15, color: "crimson" }}>{message}</p>}

      {user && savedTeams.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2>Your Saved Teams</h2>
          {savedTeams.map((s) => {
            const match = matchData[s.teams?.id];
            return (
              <div key={s.id} style={{ marginBottom: 15 }}>
                <p><strong>{s.teams?.name}</strong> — {s.teams?.league}</p>
                {match ? (
                  <p style={{ fontSize: 14, color: "#666" }}>
                    {match.status === "last_played"
                      ? `Last match vs ${match.opponent}: ${match.score_home} - ${match.score_away}`
                      : match.status === "upcoming"
                      ? `Next match vs ${match.opponent} on ${new Date(match.start_time).toLocaleDateString()}`
                      : "No match data"}
                  </p>
                ) : (
                  <p style={{ fontSize: 14, color: "#999" }}>Loading match info...</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}