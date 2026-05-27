import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, Eye, MapPin, ShieldOff, Trophy, Users } from "lucide-react";
import { Card, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { LeafletMap } from "../components/race/LeafletMap";
import { ParticipantList } from "../components/race/ParticipantList";
import { useI18n } from "../components/i18n/I18nProvider";
import { useRaceRealtime } from "../hooks/useRaceRealtime";

const WatchRace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { race, participants, positions, loading, error } = useRaceRealtime(id);

  const latestPositions = useMemo(() => {
    const map: { [partId: string]: typeof positions[0] } = {};
    positions.forEach((pos) => {
      map[pos.participant_id] = pos;
    });
    return map;
  }, [positions]);

  const mapParticipants = useMemo(() => {
    return participants.map((p) => {
      const latestPos = latestPositions[p.id];
      return {
        id: p.id,
        display_name: p.display_name,
        color: p.color,
        lat: latestPos ? Number(latestPos.lat) : race?.start_lat || 0,
        lng: latestPos ? Number(latestPos.lng) : race?.start_lng || 0,
        isCurrentUser: false,
        status: p.abandoned_at ? "abandoned" as const : p.finished_at ? "finished" as const : p.started_at ? "active" as const : "lobby" as const,
      };
    });
  }, [participants, latestPositions, race]);

  const mapHistoricalPaths = useMemo(() => {
    const paths: { [partId: string]: { lat: number; lng: number }[] } = {};
    positions.forEach((pos) => {
      if (!paths[pos.participant_id]) paths[pos.participant_id] = [];
      paths[pos.participant_id].push({ lat: Number(pos.lat), lng: Number(pos.lng) });
    });
    return paths;
  }, [positions]);

  const leader = useMemo(() => {
    return [...participants].sort((a, b) => {
      if (a.finished_at && b.finished_at) return (a.finish_time_ms || 9999999) - (b.finish_time_ms || 9999999);
      if (a.finished_at && !b.finished_at) return -1;
      if (!a.finished_at && b.finished_at) return 1;
      return (latestPositions[a.id]?.distance_to_finish_m || 9999999) - (latestPositions[b.id]?.distance_to_finish_m || 9999999);
    })[0];
  }, [participants, latestPositions]);

  if (loading) {
    return <div className="min-h-[100dvh] bg-darkbg text-white flex items-center justify-center text-xs font-black uppercase tracking-widest text-mutedgray">{t("liveRace.loading")}</div>;
  }

  if (error || !race || race.allow_spectators === false) {
    return (
      <div className="min-h-[100dvh] bg-darkbg text-white flex flex-col items-center justify-center p-6 text-center">
        <ShieldOff className="h-12 w-12 text-hyperpink mb-3" />
        <h1 className="text-xl font-black uppercase">{t("watch.blockedTitle")}</h1>
        <p className="text-xs text-mutedgray max-w-sm mt-2 uppercase tracking-wide">{error || t("watch.blockedBody")}</p>
        <Button variant="glass" className="mt-5" onClick={() => navigate("/app/races/public")}>{t("common.back")}</Button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-darkbg text-white p-4 md:p-8 flex flex-col gap-4">
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/app/races/public")} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <span className="text-[9px] font-black tracking-widest text-volt uppercase flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {t("watch.spectatorMode")}</span>
            <h1 className="text-xl font-black uppercase tracking-wide">{race.name}</h1>
          </div>
        </div>
        <span className="text-[10px] font-black uppercase text-mutedgray">{race.city}{race.state ? `, ${race.state}` : ""}{race.country ? ` • ${race.country}` : ""}</span>
      </header>

      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
        <div className="lg:col-span-2 min-h-[420px] rounded-2xl overflow-hidden border border-white/10">
          <LeafletMap mode={race.status === "finished" ? "results" : "live"} startPoint={{ lat: race.start_lat, lng: race.start_lng }} finishPoint={{ lat: race.finish_lat, lng: race.finish_lng }} participants={mapParticipants} historicalPaths={mapHistoricalPaths} zoom={16} />
        </div>
        <div className="flex flex-col gap-4">
          <Card glow="volt" className="flex flex-col gap-2">
            <CardTitle className="text-xs flex items-center gap-2"><Trophy className="h-4 w-4 text-volt" /> {t("watch.currentLeader")}</CardTitle>
            <div className="text-2xl font-black uppercase text-white">{leader?.display_name || "-"}</div>
            <p className="text-[10px] text-mutedgray uppercase">{t("watch.readOnly")}</p>
          </Card>
          <Card glow="volt" className="flex flex-col gap-2">
            <CardTitle className="text-xs flex items-center gap-2"><MapPin className="h-4 w-4 text-volt" /> {t("watch.location")}</CardTitle>
            <p className="text-xs font-bold text-white leading-relaxed">{t("createRace.start")}: {race.start_address || race.address || [race.city, race.state, race.country].filter(Boolean).join(", ")}</p>
            {race.finish_address && (
              <p className="text-xs font-bold text-white leading-relaxed">{t("createRace.finish")}: {race.finish_address}</p>
            )}
            {race.scheduled_at && (
              <p className="text-[10px] text-mutedgray uppercase flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-hyperpink" /> {new Date(race.scheduled_at).toLocaleString()}</p>
            )}
            {race.location_notes && (
              <p className="text-[10px] text-mutedgray leading-relaxed border-t border-white/5 pt-2">{race.location_notes}</p>
            )}
          </Card>
          <Card glow="pink" className="flex flex-col gap-3">
            <CardTitle className="text-xs flex items-center gap-2"><Users className="h-4 w-4 text-hyperpink" /> {t("liveRace.racersConnected")} ({participants.length})</CardTitle>
            <ParticipantList participants={participants} hostUserId={race.host_user_id} />
          </Card>
        </div>
      </main>
    </div>
  );
};

export default WatchRace;
