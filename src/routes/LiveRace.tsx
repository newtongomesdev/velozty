import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../components/auth/AuthGuard";
import { useToast } from "../components/ui/Toast";
import { Button } from "../components/ui/Button";
import { Card, CardTitle } from "../components/ui/Card";
import { LeafletMap } from "../components/race/LeafletMap";
import { RaceHUD } from "../components/race/RaceHUD";
import { ParticipantList } from "../components/race/ParticipantList";
import { CopyInviteButton } from "../components/race/CopyInviteButton";
import { useI18n } from "../components/i18n/I18nProvider";
import { useRaceRealtime } from "../hooks/useRaceRealtime";
import { useGeolocation } from "../hooks/useGeolocation";
import { releaseScreenWakeLock, requestScreenWakeLock, showRaceNotification } from "../lib/devicePermissions";
import { 
  startRace, 
  postRacePosition, 
  finishParticipant, 
  abandonRace, 
  finalizeRace,
} from "../lib/supabase";
import { Users, ShieldCheck, Flag, ChevronRight } from "lucide-react";

export const LiveRace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { t } = useI18n();
  
  // Real-time Database Socket listener
  const { race, participants, positions, loading, error } = useRaceRealtime(id);

  // Time Trial Local Session Trigger
  const [timeTrialStarted, setTimeTrialStarted] = useState(false);
  const [showFinishOverlay, setShowFinishOverlay] = useState(false);
  const [finalSessionStats, setFinalSessionStats] = useState<{ time: number; speed: number } | null>(null);

  // Find local user's participant record in the race
  const currentParticipant = useMemo(() => {
    if (!user || !participants) return null;
    return participants.find(p => p.user_id === user.id) || null;
  }, [user, participants]);

  const isHost = race?.host_user_id === user?.id;

  // Auto redirect to Results page if race is already finished
  useEffect(() => {
    if (race?.status === "finished") {
      showToast(t("liveRace.finishedToast"), "info");
      navigate(`/races/${id}/results`);
    }
  }, [race?.status, id, navigate]);

  // -------------------------------------------------------------
  // LEADERBOARD RANKING LOGIC (Meters to Arrival)
  // -------------------------------------------------------------
  
  // 1. Group latest coordinates recorded for each participant
  const latestPositions = useMemo(() => {
    const map: { [partId: string]: typeof positions[0] } = {};
    // Iterate ascending, so newer positions overwrite older ones
    positions.forEach(pos => {
      map[pos.participant_id] = pos;
    });
    return map;
  }, [positions]);

  // 2. Sort leaderboard based on distance/finish metrics
  const liveLeaderboard = useMemo(() => {
    if (!participants) return [];

    return [...participants].sort((a, b) => {
      // Rule A: Abandoned goes to the bottom
      if (a.abandoned_at && !b.abandoned_at) return 1;
      if (!a.abandoned_at && b.abandoned_at) return -1;

      // Rule B: Finished goes to the top
      if (a.finished_at && !b.finished_at) return -1;
      if (!a.finished_at && b.finished_at) return 1;

      // Rule C: If both finished, sort by finish time
      if (a.finished_at && b.finished_at) {
        return (a.finish_time_ms || 999999) - (b.finish_time_ms || 999999);
      }

      // Rule D: If both active, sort by distance remaining to finish (smaller distance = higher rank)
      const posA = latestPositions[a.id];
      const posB = latestPositions[b.id];
      const distA = posA ? Number(posA.distance_to_finish_m) : 9999999;
      const distB = posB ? Number(posB.distance_to_finish_m) : 9999999;

      return distA - distB;
    });
  }, [participants, latestPositions]);

  // Find local user's current rank
  const localRank = useMemo(() => {
    if (!currentParticipant) return 1;
    const index = liveLeaderboard.findIndex(p => p.id === currentParticipant.id);
    return index !== -1 ? index + 1 : 1;
  }, [liveLeaderboard, currentParticipant]);

  // -------------------------------------------------------------
  // ACTIVE GPS TRACKING CORE
  // -------------------------------------------------------------
  
  // Determine if Geolocation Watch should be powered ON
  const gpsActive = race?.status === "active" && 
                    currentParticipant && 
                    !currentParticipant.finished_at && 
                    !currentParticipant.abandoned_at &&
                    (race.mode === "live" || timeTrialStarted);

  // Position trigger callback: fires roughly every 2 seconds from the sensor watch
  const handlePositionUpdate = async (pos: any, distToFinish: number) => {
    if (!id || !currentParticipant) return;
    
    try {
      await postRacePosition({
        race_id: id,
        participant_id: currentParticipant.id,
        lat: pos.lat,
        lng: pos.lng,
        speed_kmh: pos.speed,
        distance_to_finish_m: distToFinish
      });
    } catch (err) {
      console.warn("Failed to transmit coordinate telemetry packet:", err);
    }
  };

  // Completion trigger callback: fires when distance to finish <= radius
  const handleFinishReached = async (elapsedTimeMs: number, topSpeedKmh: number) => {
    if (!id || !currentParticipant) return;
    
    try {
      await finishParticipant(id, currentParticipant.id, elapsedTimeMs, topSpeedKmh);
      setFinalSessionStats({ time: elapsedTimeMs, speed: topSpeedKmh });
      setShowFinishOverlay(true);
      showToast(t("liveRace.finishedSuccess"), "success");
    } catch (err: any) {
      showToast(t("liveRace.finishedError"), "error");
    }
  };

  const {
    currentPosition,
    topSpeed,
    distanceToFinish,
    gpsStatus,
    isPaused,
    pause: pauseGps,
    resume: resumeGps,
    stop: stopGps
  } = useGeolocation({
    finishLat: race?.finish_lat || 0,
    finishLng: race?.finish_lng || 0,
    finishRadiusM: race?.finish_radius_m || 30,
    enabled: !!gpsActive,
    onPositionReceived: handlePositionUpdate,
    onFinishReached: handleFinishReached
  });

  // Calculate elapsed session timer
  const [elapsedTimeMs, setElapsedTimeMs] = useState(0);
  useEffect(() => {
    if (race?.started_at && race.status === "active") {
      const start = new Date(race.started_at).getTime();
      setElapsedTimeMs(Date.now() - start);
    }
  }, [race?.started_at, race?.status]);

  // -------------------------------------------------------------
  // ACTION DISPATCHERS
  // -------------------------------------------------------------
  const handleStartRace = async () => {
    if (!id) return;
    try {
      await startRace(id);
      await showRaceNotification("Velozty", `${race?.name || "Corrida"} começou.`);
      showToast(t("liveRace.started"), "success");
    } catch (err: any) {
      showToast(err.message || t("liveRace.startError"), "error");
    }
  };

  const handleStartAttempt = () => {
    setTimeTrialStarted(true);
    showRaceNotification("Velozty", `${race?.name || "Corrida"} começou.`);
    showToast(t("liveRace.attemptStarted"), "success");
  };

  useEffect(() => {
    if (!gpsActive) {
      releaseScreenWakeLock().catch(() => undefined);
      return;
    }

    requestScreenWakeLock().catch(() => undefined);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestScreenWakeLock().catch(() => undefined);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseScreenWakeLock().catch(() => undefined);
    };
  }, [gpsActive]);

  const handleAbandon = async () => {
    if (!id || !currentParticipant) return;
    const confirm = window.confirm(t("liveRace.confirmAbandon"));
    if (!confirm) return;

    try {
      stopGps();
      await abandonRace(id, currentParticipant.id);
      showToast(t("liveRace.abandoned"), "warning");
      navigate("/dashboard");
    } catch (err: any) {
      showToast(t("liveRace.abandonError"), "error");
    }
  };

  const handleForceFinalize = async () => {
    if (!id) return;
    const confirm = window.confirm(t("liveRace.confirmFinalize"));
    if (!confirm) return;

    try {
      await finalizeRace(id);
      showToast(t("liveRace.finalized"), "info");
      navigate(`/races/${id}/results`);
    } catch (err: any) {
      showToast(t("liveRace.finalizeError"), "error");
    }
  };

  // Convert participants to map coordinate format
  const mapParticipants = useMemo(() => {
    if (!participants) return [];
    
    return participants.map(p => {
      const latestPos = latestPositions[p.id];
      return {
        id: p.id,
        display_name: p.display_name,
        color: p.color,
        // Fallback to start coordinates if no positions are posted yet
        lat: latestPos ? Number(latestPos.lat) : (race?.start_lat || 0),
        lng: latestPos ? Number(latestPos.lng) : (race?.start_lng || 0),
        isCurrentUser: p.user_id === user?.id,
        status: p.abandoned_at 
          ? ("abandoned" as const) 
          : p.finished_at 
          ? ("finished" as const) 
          : p.started_at 
          ? ("active" as const) 
          : ("lobby" as const)
      };
    });
  }, [participants, latestPositions, race, user]);

  // Compile individual trails for each participant to draw on map
  const mapHistoricalPaths = useMemo(() => {
    const paths: { [partId: string]: { lat: number; lng: number }[] } = {};
    positions.forEach(pos => {
      if (!paths[pos.participant_id]) paths[pos.participant_id] = [];
      paths[pos.participant_id].push({ lat: Number(pos.lat), lng: Number(pos.lng) });
    });
    return paths;
  }, [positions]);

  // Render loading screens
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-darkbg text-white">
        <div className="animate-spin h-8 w-8 text-volt border-t-2 border-volt rounded-full mb-3" />
        <span className="text-xs font-black tracking-widest text-mutedgray uppercase">
          {t("liveRace.loading")}
        </span>
      </div>
    );
  }

  if (error || !race) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-darkbg text-white p-6 text-center">
        <ShieldCheck className="h-12 w-12 text-red-500 mb-3" />
        <h2 className="text-lg font-black uppercase tracking-wider text-white">{t("liveRace.inaccessible")}</h2>
        <p className="text-xs text-mutedgray max-w-xs mt-1.5 leading-relaxed uppercase">
          {error || t("liveRace.inaccessibleBody")}
        </p>
        <Button onClick={() => navigate("/dashboard")} className="mt-4" variant="glass">
          {t("invite.backToDashboard")}
        </Button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDERS
  // -------------------------------------------------------------

  // A. TIME TRIAL READY TO RUN SCREEN
  const isTimeTrialMode = race.mode === "time_trial";
  const showTimeTrialStartScreen = isTimeTrialMode && !timeTrialStarted && (!currentParticipant?.finished_at && !currentParticipant?.abandoned_at);

  if (showTimeTrialStartScreen) {
    return (
      <div className="min-h-[100dvh] bg-darkbg text-white p-4 relative flex flex-col justify-between">
        <header className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/80"
          >
            ← {t("common.back")}
          </button>
          <div>
            <span className="text-[9px] font-black tracking-widest text-mutedgray uppercase">{t("liveRace.timeTrialGp")}</span>
            <h1 className="text-base font-black uppercase text-white">{race.name}</h1>
          </div>
        </header>

        <div className="max-w-md mx-auto w-full my-auto flex flex-col gap-6">
          <Card glow="pink" className="text-center p-7 flex flex-col gap-5">
            <div className="mx-auto bg-hyperpink/10 border border-hyperpink/30 p-4 rounded-3xl shadow-[0_0_15px_rgba(255,43,214,0.25)]">
              <Flag className="h-8 w-8 text-hyperpink fill-current" />
            </div>
            
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider">{t("liveRace.timeTrialTitle")}</h2>
              <p className="text-xs text-mutedgray mt-2 leading-relaxed">
                {t("liveRace.timeTrialBody")}
              </p>
            </div>

            <Button
              onClick={handleStartAttempt}
              variant="pink"
              fullWidth
              className="py-4 text-xs font-black tracking-widest"
            >
              {t("liveRace.startAttempt")}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // B. WAITING LOBBY COMPONENT
  const showLobby = race.status === "lobby";
  if (showLobby) {
    return (
      <div className="min-h-[100dvh] bg-darkbg text-white p-4 relative flex flex-col gap-4 md:p-8">
        
        <header className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <span className="text-[9px] font-black tracking-widest text-volt uppercase">{t("liveRace.startingGrid")}</span>
            <h1 className="text-xl font-black uppercase tracking-wide text-white">{race.name}</h1>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xs font-black text-mutedgray hover:text-white uppercase tracking-wider underline focus:outline-none"
          >
            {t("liveRace.leaveLobby")}
          </button>
        </header>

        <div className="max-w-4xl mx-auto w-full flex flex-col gap-4 md:grid md:grid-cols-5 flex-1">
          
          {/* Left panel: connected participants list */}
          <div className="flex flex-col gap-4 md:col-span-2 justify-between">
            <Card glow="volt" className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[350px] md:max-h-[500px]">
              <CardTitle className="text-xs flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-volt" />
                {t("liveRace.racersConnected")} ({participants.length})
              </CardTitle>
              
              <ParticipantList 
                participants={participants} 
                hostUserId={race.host_user_id} 
                currentUserUserId={user?.id} 
              />
            </Card>

            <CopyInviteButton inviteCode={race.invite_code} />

            {/* Launch controls */}
            {isHost ? (
              <Button
                onClick={handleStartRace}
                variant="volt"
                fullWidth
                disabled={participants.length < 1}
                className="py-4 text-xs font-black shadow-[0_0_20px_rgba(198,255,0,0.4)] animate-pulse"
              >
                {t("liveRace.startRace")}
              </Button>
            ) : (
              <div className="p-4 bg-white/3 border border-white/5 rounded-2xl text-center">
                <span className="text-[10px] font-black text-mutedgray tracking-widest uppercase animate-pulse">
                  {t("liveRace.waitingHost")}
                </span>
              </div>
            )}
          </div>

          {/* Right panel: static percurso preview map */}
          <div className="flex-1 md:col-span-3 rounded-2xl overflow-hidden border border-white/10 min-h-[250px] md:min-h-[450px]">
            <LeafletMap
              mode="lobby"
              startPoint={{ lat: race.start_lat, lng: race.start_lng }}
              finishPoint={{ lat: race.finish_lat, lng: race.finish_lng }}
              participants={mapParticipants}
              zoom={15}
            />
          </div>
        </div>
      </div>
    );
  }

  // C. THE RACING ARENA (Active GPS Telemetry Dashboard + Full Screen Map)
  return (
    <div className="w-[100vw] h-[100dvh] relative overflow-hidden bg-[#050508]">
      
      {/* Absolute Header with telemetry titles */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] text-center select-none pointer-events-none">
        <h2 className="text-[10px] font-black tracking-widest text-volt drop-shadow-[0_0_5px_rgba(198,255,0,0.4)] uppercase">
          {t("app.telemetry")}
        </h2>
        <span className="text-[9px] font-bold text-white uppercase tracking-wider">
          {race.name}
        </span>
      </div>

      {/* Interactive HUD overlaid over map */}
      <RaceHUD
        currentSpeed={currentPosition ? currentPosition.speed : 0}
        topSpeed={topSpeed}
        distanceToFinish={distanceToFinish}
        elapsedTimeMs={elapsedTimeMs}
        rank={localRank}
        totalParticipants={participants.filter(p => !p.abandoned_at).length}
        gpsStatus={gpsStatus}
        isPaused={isPaused}
        isHost={isHost}
        onPause={pauseGps}
        onResume={resumeGps}
        onAbandon={handleAbandon}
        onFinalize={handleForceFinalize}
      />

      {/* Giant Full Screen Leaflet Arena */}
      <div className="w-full h-full">
        <LeafletMap
          mode="live"
          startPoint={{ lat: race.start_lat, lng: race.start_lng }}
          finishPoint={{ lat: race.finish_lat, lng: race.finish_lng }}
          participants={mapParticipants}
          historicalPaths={mapHistoricalPaths}
          zoom={16}
        />
      </div>

      {/* D. ARRIVAL GLOW OVERLAY MODAL */}
      {showFinishOverlay && finalSessionStats && (
        <div className="fixed inset-0 bg-[#050508]/90 z-[9999] backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          
          {/* Confetti neon rings */}
          <div className="absolute top-1/4 w-72 h-72 rounded-full filter blur-[100px] bg-volt/15 pointer-events-none" />
          <div className="absolute bottom-1/4 w-72 h-72 rounded-full filter blur-[100px] bg-hyperpink/15 pointer-events-none" />

          <Card glow="pink" className="w-full max-w-sm p-8 flex flex-col gap-6 items-center shadow-[0_0_40px_rgba(255,43,214,0.3)] border-hyperpink/40 animate-scale-up">
            
            <div className="bg-volt/10 border-2 border-volt p-4 rounded-3xl animate-bounce shadow-[0_0_15px_#C6FF00]">
              <Flag className="h-10 w-10 text-volt fill-current" />
            </div>

            <div>
              <h2 className="text-2xl font-black italic uppercase text-white tracking-tight leading-none">
                {t("liveRace.youFinished")}
              </h2>
              <span className="text-[10px] font-black text-volt uppercase tracking-[0.2em] mt-1.5 inline-block">
                {t("liveRace.finishComplete")}
              </span>
            </div>

            <div className="w-full grid grid-cols-2 gap-3 border-t border-b border-white/5 py-5 text-center">
              
              <div className="flex flex-col gap-1 border-r border-white/5">
                <span className="text-[9px] font-black text-mutedgray uppercase tracking-widest">{t("liveRace.finalTime")}</span>
                <span className="text-lg font-black text-white font-mono leading-none mt-1">
                  {Math.floor(finalSessionStats.time / 60000)}m {((finalSessionStats.time % 60000) / 1000).toFixed(1)}s
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-mutedgray uppercase tracking-widest">{t("liveRace.maxSpeed")}</span>
                <span className="text-lg font-black text-volt font-mono leading-none mt-1">
                  {finalSessionStats.speed.toFixed(1)} km/h
                </span>
              </div>
            </div>

            <Button
              onClick={() => navigate(`/races/${id}/results`)}
              variant="pink"
              fullWidth
              className="py-4 text-xs font-black tracking-widest shadow-[0_0_15px_rgba(255,43,214,0.4)]"
            >
              Ver Leaderboard Final
              <ChevronRight className="h-4.5 w-4.5 ml-1" />
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};
export default LiveRace;
