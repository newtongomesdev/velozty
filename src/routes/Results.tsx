import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/Toast";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { LeafletMap } from "../components/race/LeafletMap";
import { AwardCard } from "../components/race/AwardCard";
import { useI18n } from "../components/i18n/I18nProvider";
import { 
  fetchRaceById, 
  fetchRaceParticipants, 
  fetchRacePositions, 
  fetchRaceAwards,
} from "../lib/supabase";
import type { Race, RaceParticipant, RacePosition, RaceAward } from "../lib/supabase";
import { 
  calculatePathDistance, 
  formatDistance, 
  formatDuration, 
  formatSpeed 
} from "../lib/geo";
import { ArrowLeft, Trophy } from "lucide-react";

export const Results: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useI18n();
  
  const [race, setRace] = useState<Race | null>(null);
  const [participants, setParticipants] = useState<RaceParticipant[]>([]);
  const [positions, setPositions] = useState<RacePosition[]>([]);
  const [awards, setAwards] = useState<RaceAward[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all necessary post-race data
  useEffect(() => {
    const rId = id;
    if (!rId) return;
    
    async function loadResultsData() {
      if (!rId) return;
      setLoading(true);
      try {
        const [raceData, partData, posData, awardData] = await Promise.all([
          fetchRaceById(rId),
          fetchRaceParticipants(rId),
          fetchRacePositions(rId),
          fetchRaceAwards(rId)
        ]);
        
        setRace(raceData);
        setParticipants(partData);
        setPositions(posData);
        setAwards(awardData);
      } catch (err: any) {
        console.error("Error loading results datasets:", err);
        showToast(t("results.loadError"), "error");
      } finally {
        setLoading(false);
      }
    }

    loadResultsData();
  }, [id]);

  // 1. Group positions by participant to build final paths
  const mapHistoricalPaths = useMemo(() => {
    const paths: { [partId: string]: { lat: number; lng: number }[] } = {};
    positions.forEach(pos => {
      if (!paths[pos.participant_id]) paths[pos.participant_id] = [];
      paths[pos.participant_id].push({ lat: Number(pos.lat), lng: Number(pos.lng) });
    });
    return paths;
  }, [positions]);

  // 2. Calculate approximate distance covered for each competitor
  const computedDistances = useMemo(() => {
    const map: { [partId: string]: number } = {};
    Object.entries(mapHistoricalPaths).forEach(([partId, pts]) => {
      map[partId] = calculatePathDistance(pts);
    });
    return map;
  }, [mapHistoricalPaths]);

  // 3. Format participants list for map display
  const mapParticipants = useMemo(() => {
    if (!participants) return [];
    return participants.map(p => {
      // Find the last recorded coordinate in positions to place a marker or fallback
      const racerPts = mapHistoricalPaths[p.id] || [];
      const lastPt = racerPts[racerPts.length - 1];
      return {
        id: p.id,
        display_name: p.display_name,
        color: p.color,
        lat: lastPt ? lastPt.lat : (race?.finish_lat || 0),
        lng: lastPt ? lastPt.lng : (race?.finish_lng || 0),
        isCurrentUser: p.user_id === (window as any).supabaseClient?.auth?.user?.id || p.user_id?.startsWith("user-current"), // check local user helper
        status: "finished" as const
      };
    });
  }, [participants, mapHistoricalPaths, race]);

  // 4. Sort final leaderboard: finished first (by finish time), then abandoned
  const finalLeaderboard = useMemo(() => {
    return [...participants].sort((a, b) => {
      if (a.abandoned_at && !b.abandoned_at) return 1;
      if (!a.abandoned_at && b.abandoned_at) return -1;
      
      if (a.finished_at && !b.finished_at) return -1;
      if (!a.finished_at && b.finished_at) return 1;
      
      return (a.finish_time_ms || 99999999) - (b.finish_time_ms || 99999999);
    });
  }, [participants]);

  // 5. Highlight current user stats
  const currentUserStats = useMemo(() => {
    // Attempt to locate local user participant details
    // For MVP testing ease, we search by flag
    const profiles = JSON.parse(localStorage.getItem("velozty_mock_current_user") || "null");
    const activeUserId = profiles ? profiles.id : "";
    const me = participants.find(p => p.user_id === activeUserId);
    
    if (!me) return null;
    
    const rankIndex = finalLeaderboard.findIndex(p => p.id === me.id);
    const rank = rankIndex !== -1 ? rankIndex + 1 : 1;
    const distanceMeters = computedDistances[me.id] || 0;

    return {
      name: me.display_name,
      color: me.color,
      rank,
      time: me.finish_time_ms,
      topSpeed: me.top_speed_kmh,
      distance: distanceMeters,
      abandoned: !!me.abandoned_at
    };
  }, [participants, finalLeaderboard, computedDistances]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-darkbg text-white">
        <Trophy className="h-8 w-8 text-volt animate-spin mb-3" />
        <span className="text-xs font-black tracking-widest text-mutedgray uppercase">
          {t("results.loading")}
        </span>
      </div>
    );
  }

  if (!race) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-darkbg text-white p-6 text-center">
        <h2 className="text-lg font-black uppercase text-white">{t("results.missingRace")}</h2>
        <Button onClick={() => navigate("/dashboard")} className="mt-4">
          {t("invite.backToDashboard")}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-darkbg text-white p-4 relative pb-20 md:p-8 flex flex-col gap-6">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full filter blur-[120px] bg-volt/5 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full filter blur-[120px] bg-hyperpink/5 pointer-events-none" />

      {/* HEADER PORTAL */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between z-10 border-b border-white/5 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all focus:outline-none"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <span className="text-[9px] font-black tracking-widest text-hyperpink uppercase">{t("results.finalReport")}</span>
            <h1 className="text-xl font-black uppercase tracking-wide text-white">{race.name}</h1>
          </div>
        </div>

        <Button
          onClick={() => navigate("/dashboard")}
          variant="glass"
          className="text-xs py-2 px-4"
        >
          {t("results.backHome")}
        </Button>
      </header>

      {/* CHASSIS CONTENT FRAME */}
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 z-10 relative">
        
        {/* 1. RETRO ACHIEVEMENTS DISPLAY SECTION */}
        {awards.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-black tracking-widest text-volt uppercase border-l-2 border-volt pl-2">
              {t("results.awards")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {awards.map((award) => {
                const recipient = participants.find(p => p.id === award.participant_id);
                return (
                  <AwardCard
                    key={award.id}
                    award={award}
                    recipientName={recipient ? recipient.display_name : t("common.unknown")}
                    recipientColor={recipient ? recipient.color : "#FFFFFF"}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* 2. ATHLETE HIGHLIGHT MODAL */}
        {currentUserStats && (
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-black tracking-widest text-hyperpink uppercase border-l-2 border-hyperpink pl-2">
              {t("results.performance")}
            </h2>
            <Card 
              glow={currentUserStats.rank === 1 ? "volt" : "pink"} 
              className="p-5 flex flex-col md:flex-row gap-5 items-center justify-between border-white/10 bg-[#101018]/90"
            >
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-black font-black uppercase text-lg"
                  style={{
                    backgroundColor: currentUserStats.color,
                    boxShadow: `0 0 15px ${currentUserStats.color}`
                  }}
                >
                  #{currentUserStats.rank}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-mutedgray uppercase tracking-widest">
                    {t("results.statusFinish")}
                  </span>
                  <span className="text-base font-black text-white uppercase tracking-wide">
                    {currentUserStats.abandoned 
                      ? t("results.abandoned") 
                      : currentUserStats.rank === 1 
                      ? t("results.champion") 
                      : t("results.finishedPosition", { rank: currentUserStats.rank })}
                  </span>
                </div>
              </div>

              {!currentUserStats.abandoned && currentUserStats.time && (
                <div className="grid grid-cols-3 gap-4 text-center w-full md:w-auto border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 flex-1">
                  
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("results.paceTimer")}</span>
                    <span className="text-sm font-black text-white font-mono">{formatDuration(currentUserStats.time)}</span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("results.peakSpeed")}</span>
                    <span className="text-sm font-black text-volt font-mono">{formatSpeed(currentUserStats.topSpeed)}</span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("common.distance")}</span>
                    <span className="text-sm font-black text-hyperpink font-mono">{formatDistance(currentUserStats.distance)}</span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* 3. DOUBLE MAP AND LEADERBOARD COLLAPSIBLE */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* Final leaderboard table */}
          <div className="flex flex-col gap-3 md:col-span-2">
            <h2 className="text-xs font-black tracking-widest text-white uppercase border-l-2 border-white pl-2">
              {t("results.leaderboard")}
            </h2>

            <Card className="p-4 flex flex-col gap-3 max-h-[400px] overflow-y-auto border-white/5 bg-[#101018]/50">
              {finalLeaderboard.map((p, index) => {
                const distanceMeters = computedDistances[p.id] || 0;
                
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 border border-white/5 rounded-2xl bg-black/30"
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank tag */}
                      <span className="text-xs font-black font-mono text-mutedgray">#{index + 1}</span>
                      
                      {/* Athlete mini icon */}
                      <div 
                        className="w-6 h-6 rounded-lg" 
                        style={{ 
                          backgroundColor: p.color,
                          boxShadow: `0 0 8px ${p.color}40` 
                        }} 
                      />

                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white uppercase tracking-wide">
                          {p.display_name}
                        </span>
                        <span className="text-[8px] font-extrabold text-mutedgray uppercase mt-0.5 tracking-wider">
                          {t("results.dist")}: {formatDistance(distanceMeters)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {p.abandoned_at ? (
                        <span className="text-[9px] font-black text-red-400 bg-red-950/20 px-1.5 py-0.5 rounded tracking-wide uppercase">
                          {t("results.gaveUp")}
                        </span>
                      ) : p.finish_time_ms ? (
                        <span className="text-xs font-black text-volt font-mono">
                          {formatDuration(p.finish_time_ms)}
                        </span>
                      ) : (
                        <span className="text-[9px] font-black text-mutedgray uppercase">
                          {t("common.dns")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>

          {/* Interactive Trajectory Path Map */}
          <div className="flex flex-col gap-3 md:col-span-3 min-h-[300px] md:min-h-[400px]">
            <h2 className="text-xs font-black tracking-widest text-volt uppercase border-l-2 border-volt pl-2">
              {t("results.raceTrajectories")}
            </h2>

            <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 h-full min-h-[300px]">
              <LeafletMap
                mode="results"
                startPoint={{ lat: race.start_lat, lng: race.start_lng }}
                finishPoint={{ lat: race.finish_lat, lng: race.finish_lng }}
                participants={mapParticipants}
                historicalPaths={mapHistoricalPaths}
                zoom={14}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Results;
