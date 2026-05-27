import React, { useEffect, useState } from "react";
import { Navigation, Play, Pause, LogOut, Award, Cpu } from "lucide-react";
import { formatDistance, formatSpeed, formatDuration } from "../../lib/geo";
import { useI18n } from "../i18n/I18nProvider";

interface RaceHUDProps {
  currentSpeed: number;
  topSpeed: number;
  distanceToFinish: number | null;
  elapsedTimeMs: number;
  rank: number;
  totalParticipants: number;
  gpsStatus: "searching" | "accurate" | "poor" | "off";
  isPaused: boolean;
  isHost: boolean;
  onPause: () => void;
  onResume: () => void;
  onAbandon: () => void;
  onFinalize: () => void;
}

export const RaceHUD: React.FC<RaceHUDProps> = ({
  currentSpeed,
  topSpeed,
  distanceToFinish,
  elapsedTimeMs,
  rank,
  totalParticipants,
  gpsStatus,
  isPaused,
  isHost,
  onPause,
  onResume,
  onAbandon,
  onFinalize,
}) => {
  const [stopwatch, setStopwatch] = useState(0);
  const { t } = useI18n();

  // Sync internal stopwatch tick
  useEffect(() => {
    setStopwatch(elapsedTimeMs);
  }, [elapsedTimeMs]);

  useEffect(() => {
    if (isPaused || gpsStatus === "off") return;

    const interval = setInterval(() => {
      setStopwatch((prev) => prev + 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, gpsStatus]);

  // GPS Status Badge colors
  const gpsBadgeStyles = {
    accurate: "bg-volt/15 border-volt text-volt shadow-[0_0_8px_rgba(198,255,0,0.2)]",
    searching: "bg-yellow-500/15 border-yellow-500 text-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.2)]",
    poor: "bg-red-500/15 border-red-500 text-red-400",
    off: "bg-white/5 border-white/20 text-white/50",
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-[1000] p-4 flex flex-col gap-4 pointer-events-none md:max-w-md md:mx-auto md:bottom-4">
      
      {/* 1. TOP OVERLAY TELEMETRY BANNERS */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-[1000]">
        
        {/* GPS Badge */}
        <div className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${gpsBadgeStyles[gpsStatus]}`}>
          <Navigation className={`h-3 w-3 ${gpsStatus === "searching" ? "animate-pulse" : ""}`} />
          {gpsStatus === "accurate" && t("hud.gpsOk")}
          {gpsStatus === "searching" && t("hud.weakSignal")}
          {gpsStatus === "poor" && t("hud.noSignal")}
          {gpsStatus === "off" && t("hud.gpsOff")}
        </div>

        {/* Live Leaderboard position */}
        <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-darkbg/80 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
          <Award className="h-3.5 w-3.5 text-volt" />
          {t("hud.ranking")}: <span className="text-volt">{rank}</span> / {totalParticipants}
        </div>
      </div>

      {/* 2. THE CHASSIS TELEMETRY OVERLAY CARD */}
      <div className="pointer-events-auto w-full bg-neoncard/90 border border-white/10 rounded-3xl p-5 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-col gap-4">
        
        {/* Main speed section */}
        <div className="flex flex-col items-center justify-center py-2 relative">
          
          <span className="text-[10px] font-black tracking-widest text-mutedgray uppercase">{t("hud.currentSpeed")}</span>
          
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-6xl font-black tracking-tighter text-volt drop-shadow-[0_0_15px_rgba(198,255,0,0.4)] font-mono animate-pulse">
              {currentSpeed.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-white tracking-widest uppercase">km/h</span>
          </div>

          {isPaused && (
            <div className="absolute inset-0 bg-darkbg/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <span className="text-sm font-black text-hyperpink tracking-widest uppercase animate-pulse">{t("hud.gpsPaused")}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-b border-white/5 py-4 text-center">
          
          {/* Top speed */}
          <div className="flex flex-col gap-1 border-r border-white/5">
            <span className="text-[9px] font-extrabold tracking-wider text-mutedgray uppercase">{t("hud.topSpeed")}</span>
            <span className="text-sm font-black text-white font-mono">{formatSpeed(topSpeed)}</span>
          </div>

          {/* Stopwatch */}
          <div className="flex flex-col gap-1 border-r border-white/5">
            <span className="text-[9px] font-extrabold tracking-wider text-mutedgray uppercase">{t("hud.time")}</span>
            <span className="text-sm font-black text-volt font-mono">{formatDuration(stopwatch)}</span>
          </div>

          {/* Distance */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-extrabold tracking-wider text-mutedgray uppercase">{t("hud.remaining")}</span>
            <span className="text-sm font-black text-hyperpink font-mono">
              {distanceToFinish !== null ? formatDistance(distanceToFinish) : "---"}
            </span>
          </div>
        </div>

        {/* 3. INTERACTIVE CONTROL DOCK */}
        <div className="flex gap-2">
          
          {/* GPS Pause / Resume */}
          {isPaused ? (
            <button
              onClick={onResume}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-volt text-black font-black text-xs uppercase tracking-wider shadow-[0_0_10px_rgba(198,255,0,0.3)] transition-all active:scale-95 hover:bg-white"
            >
              <Play className="h-4 w-4 fill-current" />
              {t("hud.resumeGps")}
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-wider transition-all active:scale-95 hover:bg-white/10"
            >
              <Pause className="h-4 w-4 fill-current" />
              {t("hud.pauseGps")}
            </button>
          )}

          {/* Abandon Race */}
          <button
            onClick={onAbandon}
            className="px-5 flex items-center justify-center py-3 rounded-2xl bg-red-600/10 border border-red-500/30 text-red-400 font-black text-xs uppercase tracking-wider transition-all active:scale-95 hover:bg-red-600/20"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* 4. HOST CONTROLS BUBBLE */}
        {isHost && (
          <button
            onClick={onFinalize}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-hyperpink/10 border border-hyperpink/30 text-hyperpink font-extrabold text-[10px] uppercase tracking-widest transition-all hover:bg-hyperpink/20"
          >
            <Cpu className="h-3.5 w-3.5 animate-spin" />
            {t("hud.finishForAll")}
          </button>
        )}
      </div>
    </div>
  );
};
