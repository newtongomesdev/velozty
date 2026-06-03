import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Radio, Trophy } from "lucide-react";
import { useRaceRealtime } from "../hooks/useRaceRealtime";
import { formatDistance, formatDuration, formatSpeed } from "../lib/geo";
import { useI18n } from "../components/i18n/I18nProvider";

const RaceOverlay: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const { race, participants, positions, loading, error } = useRaceRealtime(id);

  const latestPositions = useMemo(() => {
    const map: { [participantId: string]: typeof positions[0] } = {};
    positions.forEach((position) => {
      map[position.participant_id] = position;
    });
    return map;
  }, [positions]);

  const leaderboard = useMemo(() => {
    return [...participants].sort((a, b) => {
      if (a.finished_at && b.finished_at) return (a.finish_time_ms || 9999999) - (b.finish_time_ms || 9999999);
      if (a.finished_at && !b.finished_at) return -1;
      if (!a.finished_at && b.finished_at) return 1;
      if (a.abandoned_at && !b.abandoned_at) return 1;
      if (!a.abandoned_at && b.abandoned_at) return -1;
      return (latestPositions[a.id]?.distance_to_finish_m || 9999999) - (latestPositions[b.id]?.distance_to_finish_m || 9999999);
    });
  }, [latestPositions, participants]);

  if (loading) {
    return <div className="min-h-[100dvh] bg-transparent p-6 text-white">{t("broadcast.loading")}</div>;
  }

  if (error || !race || race.allow_spectators === false) {
    return <div className="min-h-[100dvh] bg-transparent p-6 text-white">{t("broadcast.unavailable")}</div>;
  }

  return (
    <div className="min-h-[100dvh] bg-transparent p-6 text-white">
      <div className="w-[420px] max-w-full rounded-3xl border border-white/20 bg-[#050508]/85 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-volt">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              {t("broadcast.live")}
            </div>
            <h1 className="mt-1 text-lg font-black uppercase leading-tight">{race.name}</h1>
          </div>
          <span className="rounded-full border border-volt/30 bg-volt/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-volt">
            {t("broadcast.pilots", { count: participants.length })}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {leaderboard.slice(0, 5).map((participant, index) => {
            const latestPosition = latestPositions[participant.id];
            return (
              <div key={participant.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-xs font-black">#{index + 1}</span>
                  <div>
                    <div className="text-xs font-black uppercase">{participant.display_name}</div>
                    <div className="text-[10px] font-bold uppercase text-white/60">
                      {participant.finished_at && participant.finish_time_ms
                        ? formatDuration(participant.finish_time_ms)
                        : latestPosition
                          ? `${formatDistance(Number(latestPosition.distance_to_finish_m))} ${t("broadcast.remaining")}`
                          : t("broadcast.startLine")}
                    </div>
                  </div>
                </div>
                <div className="text-right text-[10px] font-black uppercase text-volt">
                  <Trophy className="ml-auto h-3.5 w-3.5" />
                  {formatSpeed(participant.top_speed_kmh || latestPosition?.speed_kmh || 0)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RaceOverlay;

