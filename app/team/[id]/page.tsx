"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function TeamDetail() {
  const params = useParams();
  const externalId = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/team-detail?external_id=${externalId}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      });
  }, [externalId]);

  if (loading) {
    return <div className="max-w-4xl mx-auto px-6 py-12 text-[#8A97A6]">Loading team...</div>;
  }

  if (!data?.team) {
    return <div className="max-w-4xl mx-auto px-6 py-12 text-[#8A97A6]">Team not found.</div>;
  }

  const { team, roster, lastMatches, nextMatch } = data;

  function isWin(match: any) {
    const isHome = match.strHomeTeam === team.strTeam;
    const homeScore = Number(match.intHomeScore);
    const awayScore = Number(match.intAwayScore);
    if (isNaN(homeScore) || isNaN(awayScore)) return false;
    return isHome ? homeScore > awayScore : awayScore > homeScore;
  }

  const wins = lastMatches.filter(isWin).slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 font-[family-name:var(--font-body)]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {team.strTeamBadge && (
          <img src={team.strTeamBadge} alt={team.strTeam} className="w-16 h-16 object-contain" />
        )}
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">{team.strTeam}</h1>
          <p className="text-[#8A97A6] text-sm">{team.strLeague} · {team.strSport}</p>
        </div>
      </div>

      {/* History */}
      <div className="border border-[#1C242E] bg-[#151B23] rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-3">Club History</h2>
        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div><span className="text-[#8A97A6]">Founded: </span>{team.intFormedYear || "N/A"}</div>
          <div><span className="text-[#8A97A6]">Stadium: </span>{team.strStadium || "N/A"}</div>
        </div>
        {team.strDescriptionEN && (
          <p className="text-sm text-[#8A97A6] leading-relaxed">
            {team.strDescriptionEN}
          </p>
        )}
      </div>

      {/* Upcoming */}
      {nextMatch && (
        <div className="border border-[#00D9A3]/30 bg-[#00D9A3]/5 rounded-xl p-5 mb-6">
          <h2 className="font-semibold mb-2">Next Match</h2>
          <p className="text-sm">
            vs {nextMatch.strHomeTeam === team.strTeam ? nextMatch.strAwayTeam : nextMatch.strHomeTeam}
            {" · "}{new Date(nextMatch.strTimestamp).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Last 5 matches */}
      <div className="border border-[#1C242E] bg-[#151B23] rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-3">Last {lastMatches.length} Matches</h2>
        <div className="space-y-2">
          {lastMatches.map((m: any) => {
            const win = isWin(m);
            return (
              <div key={m.idEvent} className="flex justify-between items-center text-sm py-1.5 border-b border-[#1C242E] last:border-0">
                <span className="text-[#8A97A6]">
                  {m.strHomeTeam} vs {m.strAwayTeam}
                </span>
                <span className={`font-[family-name:var(--font-mono)] font-bold tabular-nums ${win ? "text-[#00D9A3]" : "text-[#FFB020]"}`}>
                  {m.intHomeScore} - {m.intAwayScore}
                </span>
              </div>
            );
          })}
        </div>
        {wins.length > 0 && (
          <p className="text-xs text-[#8A97A6] mt-3">
            {wins.length} of last {lastMatches.length} matches won
          </p>
        )}
      </div>

      {/* Roster */}
      {roster.length > 0 && (
        <div className="border border-[#1C242E] bg-[#151B23] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
  <h2 className="font-semibold">Squad</h2>
  <span className="text-xs text-[#8A97A6]">Sample roster — free tier</span>
</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {roster.map((p: any) => (
              <div
                key={p.idPlayer}
                className="flex items-center gap-3 bg-[#0B0F14] border border-[#1C242E] rounded-lg p-3"
              >
                {p.strCutout || p.strThumb ? (
                  <img
                    src={p.strCutout || p.strThumb}
                    alt={p.strPlayer}
                    className="w-10 h-10 rounded-full object-cover bg-[#1C242E]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1C242E] flex items-center justify-center text-xs text-[#8A97A6]">
                    {p.strPlayer?.[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.strPlayer}</p>
                  <p className="text-xs text-[#8A97A6]">{p.strPosition}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}