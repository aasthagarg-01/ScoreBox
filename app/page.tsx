"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

const SPORTS = ["All Sports", "Soccer", "Basketball", "Cricket", "American Football", "Ice Hockey"];

export default function Home() {
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState("All Sports");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [message, setMessage] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search-team?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSuggestions(data.teams || []);
      setShowSuggestions(true);
    }, 350);
  }, [query]);

  function filteredBySport(teams: any[]) {
    if (sport === "All Sports") return teams;
    return teams.filter((t) => t.strSport === sport);
  }

  async function handleSearch(customQuery?: string) {
    const q = customQuery ?? query;
    setMessage("");
    setShowSuggestions(false);
    const res = await fetch(`/api/search-team?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(filteredBySport(data.teams || []));
  }

  async function handleSave(team: any) {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

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

    const { error: saveError } = await supabase
      .from("saved_teams")
      .insert({ user_id: user.id, team_id: teamId });

    setMessage(saveError ? saveError.message : `${team.strTeam} saved to your dashboard`);
  }

  return (
    <div className="relative">
      {/* Background: gradient + subtle sport silhouettes */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F14] via-[#0F1620] to-[#0B0F14]" />
        <svg className="absolute -top-10 -right-20 w-[500px] h-[500px] opacity-[0.06]" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="80" stroke="#00D9A3" strokeWidth="1" />
          <path d="M20 100h160M100 20v160" stroke="#00D9A3" strokeWidth="1" />
        </svg>
        <svg className="absolute bottom-0 -left-24 w-[400px] h-[400px] opacity-[0.05]" viewBox="0 0 200 200" fill="none">
          <rect x="20" y="20" width="160" height="160" rx="8" stroke="#FFB020" strokeWidth="1" />
          <circle cx="100" cy="100" r="30" stroke="#FFB020" strokeWidth="1" />
        </svg>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center font-[family-name:var(--font-body)]">
        <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold mb-3">
          Score<span className="text-[#00D9A3]">Box</span>
        </h1>
        <p className="text-[#8A97A6] mb-10">
          Follow football, cricket, basketball, and more - one clean scoreboard for your teams.
        </p>

        {/* Sport filter + search */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center relative">
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="bg-[#151B23] border border-[#1C242E] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00D9A3]"
          >
            {SPORTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="relative flex-1 max-w-md">
            <input
              placeholder="Search a team..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.length >= 2 && setShowSuggestions(true)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full bg-[#151B23] border border-[#1C242E] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#00D9A3]"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-[#151B23] border border-[#1C242E] rounded-lg overflow-hidden text-left z-10">
                {filteredBySport(suggestions).slice(0, 6).map((team) => (
                  <button
                    key={team.idTeam}
                    onClick={() => {
                      setQuery(team.strTeam);
                      handleSearch(team.strTeam);
                    }}
                    className="w-full px-4 py-2.5 text-sm hover:bg-[#1C242E] flex justify-between items-center"
                  >
                    <span>{team.strTeam}</span>
                    <span className="text-xs text-[#8A97A6]">{team.strLeague}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => handleSearch()}
            className="px-6 py-3 rounded-lg bg-[#00D9A3] text-[#0B0F14] font-medium text-sm hover:bg-[#00c493] transition-colors"
          >
            Search
          </button>
        </div>

        {showLoginPrompt && (
          <div className="mt-6 border border-[#FFB020]/30 bg-[#FFB020]/10 rounded-lg px-4 py-3 text-sm text-[#FFB020]">
            You need to log in to save teams.{" "}
            <a href="/login" className="underline font-medium">Log in / Sign up</a>
          </div>
        )}
        {message && <p className="mt-6 text-sm text-[#00D9A3]">{message}</p>}

        {/* Results */}
        <div className="mt-10 grid gap-3 text-left">
          {results.map((team) => (
            <div
              key={team.idTeam}
              className="border border-[#1C242E] bg-[#151B23] rounded-xl px-5 py-4 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{team.strTeam}</p>
                <p className="text-xs text-[#8A97A6]">{team.strLeague} · {team.strSport}</p>
              </div>
              <button
                onClick={() => handleSave(team)}
                className="px-4 py-2 rounded-md border border-[#1C242E] text-sm hover:border-[#00D9A3] transition-colors"
              >
                Save
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}