import React from "react";
import { CheckCircle2, Navigation, AlertCircle, Hourglass } from "lucide-react";
import type { RaceParticipant } from "../../lib/supabase";
import { formatDuration, formatSpeed } from "../../lib/geo";
import { useI18n } from "../i18n/I18nProvider";

interface ParticipantListProps {
  participants: RaceParticipant[];
  hostUserId?: string;
  currentUserUserId?: string;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  hostUserId,
  currentUserUserId,
}) => {
  const { t } = useI18n();
  
  // Sort participants logically: finished first (by finish time), then active, then lobby, then abandoned
  const sortedParticipants = [...participants].sort((a, b) => {
    // Abandoned goes to the bottom
    if (a.abandoned_at && !b.abandoned_at) return 1;
    if (!a.abandoned_at && b.abandoned_at) return -1;
    
    // Finished goes to the top
    if (a.finished_at && !b.finished_at) return -1;
    if (!a.finished_at && b.finished_at) return 1;
    
    // If both finished, sort by finish time
    if (a.finished_at && b.finished_at) {
      return (a.finish_time_ms || 9999999) - (b.finish_time_ms || 9999999);
    }
    
    // Active comes before lobby
    if (a.started_at && !b.started_at) return -1;
    if (!a.started_at && b.started_at) return 1;
    
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
  });

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {sortedParticipants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-white/5 border border-white/5 rounded-2xl p-4">
          <Hourglass className="h-8 w-8 text-mutedgray animate-pulse mb-2" />
          <span className="text-xs font-bold text-mutedgray uppercase tracking-widest">
            {t("participants.waitingConnections")}
          </span>
        </div>
      ) : (
        sortedParticipants.map((p) => {
          const isHost = p.user_id === hostUserId;
          const isCurrentUser = p.user_id === currentUserUserId;
          
          let statusBadge = null;
          let rowBg = "bg-white/5 border-white/5";
          
          if (p.abandoned_at) {
            statusBadge = (
              <span className="flex items-center gap-1 text-[9px] font-bold text-red-400 uppercase tracking-wider bg-red-500/10 px-2 py-1 rounded">
                <AlertCircle className="h-3 w-3" />
                {t("participants.gaveUp")}
              </span>
            );
            rowBg = "bg-red-950/10 border-red-500/10 opacity-60";
          } else if (p.finished_at) {
            statusBadge = (
              <span className="flex items-center gap-1 text-[9px] font-bold text-volt uppercase tracking-wider bg-volt/10 px-2 py-1 rounded">
                <CheckCircle2 className="h-3 w-3" />
                {t("participants.finished")}
              </span>
            );
            rowBg = "bg-volt/5 border-volt/20";
          } else if (p.started_at) {
            statusBadge = (
              <span className="flex items-center gap-1 text-[9px] font-bold text-hyperpink uppercase tracking-wider bg-hyperpink/10 px-2 py-1 rounded animate-pulse">
                <Navigation className="h-3 w-3 fill-current animate-spin" />
                {t("participants.onTrack")}
              </span>
            );
            rowBg = "bg-hyperpink/5 border-hyperpink/10";
          } else {
            statusBadge = (
              <span className="flex items-center gap-1 text-[9px] font-bold text-mutedgray uppercase tracking-wider bg-white/5 px-2 py-1 rounded">
                <Hourglass className="h-3 w-3 animate-pulse" />
                Lobby
              </span>
            );
          }

          return (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3.5 border rounded-2xl transition-all duration-300 ${rowBg}`}
            >
              <div className="flex items-center gap-3">
                {/* Neon player badge */}
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center border text-black font-black uppercase text-sm select-none"
                  style={{
                    backgroundColor: p.color,
                    borderColor: isCurrentUser ? "#FFFFFF" : "transparent",
                    boxShadow: `0 0 10px ${p.color}40`,
                  }}
                >
                  {p.display_name.slice(0, 2)}
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white uppercase tracking-wide">
                    {p.display_name} {isCurrentUser && <span className="text-volt text-[10px] lowercase font-normal">({t("participants.you")})</span>}
                  </span>
                  
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isHost && (
                      <span className="text-[8px] font-black text-black bg-volt px-1.5 py-0.5 rounded tracking-widest uppercase">
                        {t("common.host")}
                      </span>
                    )}
                    {p.finished_at && p.finish_time_ms && (
                      <span className="text-[10px] font-bold text-mutedgray font-mono">
                        {t("participants.stats", { time: formatDuration(p.finish_time_ms), speed: formatSpeed(p.top_speed_kmh) })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                {statusBadge}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
