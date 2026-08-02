"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [savedTeams, setSavedTeams] = useState<any[]>([]);
  const [matchData, setMatchData] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      } else {
        setUser(data.user);
      }
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
    setLoading(true);
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
    setLoading(false);
  }

  if (!user) return null;

  return (
    <div className="relative min-h-[calc(100vh-64px)]">
      <div className="fixed inset-0 -z-10 bg-[#0B0F14]">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] opacity-[0.08] blur-3xl"
          style={{ background: "radial-gradient(circle, #00D9A3 0%, transparent 70%)" }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 font-[family-name:var(--font-body)]">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold mb-2">
          Your Teams
        </h1>
        <p className="text-[#8A97A6] mb-8">Latest results for everything you follow.</p>

        {loading && <p className="text-[#8A97A6]">Loading your teams...</p>}

        {!loading && savedTeams.length === 0 && (
          <div className="border border-[#1C242E] rounded-xl p-10 text-center">
            <p className="text-[#8A97A6] mb-4">You haven't saved any teams yet.</p>
            <a href="/" className="text-[#00D9A3] hover:underline">Search for a team to get started</a>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {savedTeams.map((s) => {
            const match = matchData[s.teams?.id];
            return (
              <div
                key={s.id}
                className="border border-[#1C242E] bg-[#151B23] rounded-xl p-5 hover:border-[#00D9A3]/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <a href={`/team/${s.teams?.external_id}`} className="font-semibold text-lg hover:text-[#00D9A3] transition-colors">
  {s.teams?.name}
</a>
                  <span className="text-xs text-[#8A97A6] uppercase tracking-wide">{s.teams?.league}</span>
                </div>
                {match ? (
                  match.status === "last_played" ? (
                    <div className="font-[family-name:var(--font-mono)] flex items-center gap-3 mt-3">
                      <span className="text-sm text-[#8A97A6]">vs {match.opponent}</span>
                      <span className="text-2xl font-bold text-[#FFB020] tabular-nums">
                        {match.score_home} - {match.score_away}
                      </span>
                    </div>
                  ) : match.status === "upcoming" ? (
                    <p className="text-sm text-[#8A97A6] mt-3">
                      Next: vs {match.opponent} on {new Date(match.start_time).toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="text-sm text-[#8A97A6] mt-3">No match data available</p>
                  )
                ) : (
                  <p className="text-sm text-[#8A97A6] mt-3">Loading...</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}