import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/Toast";
import { Card, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useI18n } from "../components/i18n/I18nProvider";
import { 
  fetchPublicRaces, 
  fetchRaceParticipants, 
  joinRace
} from "../lib/supabase";
import type { Race, RaceParticipant } from "../lib/supabase";
import { haversineDistance } from "../lib/geo";
import { 
  ArrowLeft, 
  Search, 
  MapPin, 
  Compass, 
  Navigation, 
  Users, 
  RefreshCw, 
  TrendingUp,
  AlertTriangle,
  Eye,
  Trophy,
  CalendarClock
} from "lucide-react";

interface RaceWithDistance extends Race {
  distanceKm: number | null;
  participantsCount: number;
}

export const PublicRaces: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  
  // Data states
  const [races, setRaces] = useState<RaceWithDistance[]>([]);
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [modalityFilter, setModalityFilter] = useState<"all" | "running" | "bike" | "other">("all");
  const [maxDistance, setMaxDistance] = useState<number>(50); // in km. 101 means "Qualquer distância"
  
  // GPS State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "fetching" | "available" | "denied">("idle");

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("denied");
      return;
    }

    setGpsStatus("fetching");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus("available");
      },
      (err) => {
        console.warn("Geolocation permission error in lobby:", err);
        setGpsStatus("denied");
      },
      { enableHighAccuracy: false, timeout: 6000 }
    );
  };

  // Fetch user location once on mount
  useEffect(() => {
    getUserLocation();
  }, []);

  const loadData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      const publicRaces = await fetchPublicRaces();
      
      // Fetch details and calculate distances
      const racesWithMeta = await Promise.all(
        publicRaces.map(async (race) => {
          let distanceKm: number | null = null;
          
          if (userCoords) {
            const meters = haversineDistance(
              userCoords.lat,
              userCoords.lng,
              race.start_lat,
              race.start_lng
            );
            distanceKm = meters / 1000;
          } else if (navigator.geolocation && gpsStatus === "available") {
            // If coords just resolved or wait resolving
            // We'll let the userCoords update handle this re-calc
          }

          let participants: RaceParticipant[] = [];
          try {
            participants = await fetchRaceParticipants(race.id);
          } catch (e) {
            console.error("Could not fetch participants for race " + race.id, e);
          }

          return {
            ...race,
            distanceKm,
            participantsCount: participants.length
          };
        })
      );

      // Sort: closest distance first if GPS active, otherwise newest first
      const sorted = racesWithMeta.sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setRaces(sorted);
    } catch (err: any) {
      console.error(err);
      showToast(t("publicRaces.syncError"), "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Trigger load when coordinates or status changes
  useEffect(() => {
    loadData();
  }, [userCoords]);

  const handleJoinRace = async (race: RaceWithDistance) => {
    setJoiningId(race.id);
    try {
      showToast(t("publicRaces.connecting", { race: race.name }), "info");
      await joinRace(race.invite_code);
      showToast(t("publicRaces.joined"), "success");
      navigate(`/app/races/${race.id}`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || t("publicRaces.joinError"), "error");
    } finally {
      setJoiningId(null);
    }
  };

  // Filtered Races computation
  const filteredRaces = races.filter((race) => {
    // 1. Modality Filter
    if (modalityFilter !== "all" && race.modality !== modalityFilter) {
      return false;
    }

    // 2. Proximity Filter (only if GPS coordinate is available and maxDistance is set under 100)
    if (userCoords && maxDistance <= 100) {
      if (race.distanceKm === null || race.distanceKm > maxDistance) {
        return false;
      }
    }

    // 3. Search query (text lookup on name, city, state, country, neighborhood)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = race.name.toLowerCase().includes(q);
      const matchCity = race.city?.toLowerCase().includes(q) || false;
      const matchState = race.state?.toLowerCase().includes(q) || false;
      const matchCountry = race.country?.toLowerCase().includes(q) || false;
      const matchNeighborhood = race.neighborhood?.toLowerCase().includes(q) || false;
      const matchCode = race.invite_code.toLowerCase().includes(q);
      
      if (!matchName && !matchCity && !matchState && !matchCountry && !matchNeighborhood && !matchCode) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-[100dvh] bg-darkbg text-white p-4 relative flex flex-col gap-4 md:p-8">
      
      {/* BACKGROUND TECH GRID MESH OVERLAY */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />

      {/* HEADER */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/app/dashboard")}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all focus:outline-none"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <span className="text-[9px] font-black tracking-widest text-volt uppercase">{t("publicRaces.discovery")}</span>
            <h1 className="text-xl font-black uppercase tracking-wide">{t("publicRaces.title")}</h1>
          </div>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={loading || refreshing}
          className="p-3 rounded-2xl bg-white/5 border border-white/10 text-mutedgray hover:text-white transition-all focus:outline-none disabled:opacity-50"
          title={t("publicRaces.sync")}
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin text-volt" : ""}`} />
        </button>
      </header>

      <main className="max-w-4xl mx-auto w-full flex flex-col gap-4 z-10 flex-1">
        
        {/* FILTERS & DOCK PANEL */}
        <Card glow="volt" className="flex flex-col gap-4">
          
          {/* Row 1: Search and GPS Recalculator */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mutedgray" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("publicRaces.searchPlaceholder")}
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-volt focus:ring-1 focus:ring-volt tracking-wide placeholder-white/20 transition-all"
              />
            </div>
            
            <button
              type="button"
              onClick={getUserLocation}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                gpsStatus === "available"
                  ? "bg-volt/10 border-volt/20 text-volt hover:bg-volt/20"
                  : gpsStatus === "fetching"
                  ? "bg-white/5 border-white/10 text-mutedgray animate-pulse"
                  : "bg-white/3 border-white/5 text-mutedgray hover:text-white"
              }`}
            >
              <Navigation className={`h-3.5 w-3.5 ${gpsStatus === "fetching" ? "animate-spin" : ""}`} />
              {gpsStatus === "available" 
                ? t("publicRaces.gpsActive") 
                : gpsStatus === "fetching" 
                ? t("publicRaces.gpsFetching") 
                : t("publicRaces.gpsActivate")}
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate("/app/hall-of-fame")}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border bg-hyperpink/10 border-hyperpink/20 text-hyperpink hover:bg-hyperpink/20 text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Trophy className="h-4 w-4" />
            {t("hallOfFame.title")}
          </button>

          {/* Row 2: Modalities selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("publicRaces.filterModality")}</label>
            <div className="grid grid-cols-4 gap-1.5 md:flex md:gap-2">
              {[
                { id: "all", label: t("publicRaces.all") },
                { id: "running", label: t("publicRaces.running") },
                { id: "bike", label: t("publicRaces.bike") },
                { id: "other", label: t("publicRaces.other") }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModalityFilter(m.id as any)}
                  className={`py-2 px-3 rounded-xl border text-[9px] md:text-[10px] font-black uppercase tracking-wider transition-all duration-300 md:min-w-[100px] ${
                    modalityFilter === m.id
                      ? "bg-volt text-black border-transparent shadow-[0_0_8px_rgba(198,255,0,0.15)]"
                      : "bg-white/3 border-white/5 text-mutedgray hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Proximity Slider */}
          <div className="flex flex-col gap-1.5 border-t border-white/5 pt-3">
            <div className="flex justify-between items-center">
              <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider flex items-center gap-1">
                <Compass className="h-3 w-3 text-volt" /> 
                {t("publicRaces.proximity")}
              </label>
              <span className="text-xs font-black text-volt drop-shadow-[0_0_5px_rgba(198,255,0,0.3)] font-mono">
                {maxDistance > 100 ? t("publicRaces.anyDistance") : t("publicRaces.upToKm", { distance: maxDistance })}
              </span>
            </div>
            
            <input
              type="range"
              min={5}
              max={105}
              step={5}
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              disabled={!userCoords}
              className="w-full h-1.5 bg-black/50 border border-white/10 rounded-lg appearance-none cursor-pointer accent-volt focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
            />
            
            {!userCoords && (
              <span className="text-[9px] font-bold text-hyperpink flex items-center gap-1.5 mt-1 leading-relaxed uppercase">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                {t("publicRaces.gpsMissing")}
              </span>
            )}
          </div>
        </Card>

        {/* FEED / DISCOVERY PANEL GRID */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-volt" />
            <p className="text-xs font-black uppercase text-mutedgray tracking-widest animate-pulse">
              {t("publicRaces.loading")}
            </p>
          </div>
        ) : filteredRaces.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 bg-white/3 border border-white/5 rounded-2xl gap-3 text-center">
            <Compass className="h-10 w-10 text-mutedgray/40 animate-pulse" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">{t("publicRaces.emptyTitle")}</h3>
              <p className="text-[10px] font-bold text-mutedgray uppercase tracking-wide mt-1 max-w-sm leading-relaxed">
                {t("publicRaces.emptyBody")}
              </p>
            </div>
            <Button
              variant="volt"
              onClick={() => navigate("/app/races/new")}
              className="mt-3 text-[10px] py-2.5 px-5"
            >
              {t("publicRaces.createPublicRace")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredRaces.map((race) => {
              const isActive = race.status === "active";
              
              return (
                <Card 
                  key={race.id} 
                  glow={isActive ? "volt" : "pink"}
                  className="flex flex-col justify-between gap-4 relative overflow-hidden group hover:scale-[1.01] hover:bg-white/8 transition-all duration-300"
                >
                  {/* Decorative background visual tags */}
                  <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-white/2 opacity-20 filter blur-xl group-hover:bg-volt/10 transition-colors pointer-events-none" />

                  {/* Top section: Badges, Status and Name */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${isActive ? "bg-volt animate-ping" : "bg-hyperpink animate-pulse"}`} />
                        <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? "text-volt" : "text-hyperpink"}`}>
                          {isActive ? t("publicRaces.active") : t("publicRaces.openLobby")}
                        </span>
                      </div>
                      
                      {/* Distance Badge */}
                      {race.distanceKm !== null ? (
                        <span className="text-[9px] font-black text-volt bg-volt/10 border border-volt/20 px-2 py-0.5 rounded-full font-mono">
                          📍 {race.distanceKm < 1 ? `${Math.round(race.distanceKm * 1000)}m` : `${race.distanceKm.toFixed(1)} km`}
                        </span>
                      ) : (
                        <span className="text-[9px] font-black text-mutedgray bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                          {t("publicRaces.distanceUnavailable")}
                        </span>
                      )}
                    </div>

                    <CardTitle className="text-sm font-black tracking-wide leading-tight group-hover:text-volt transition-colors">
                      {race.name}
                    </CardTitle>
                  </div>

                  {/* Route details & location info */}
                  <div className="flex flex-col gap-1.5 border-t border-b border-white/5 py-3 text-[11px] font-semibold text-mutedgray">
                    
                    {/* Location administrative */}
                    {(race.city || race.state || race.neighborhood) && (
                      <div className="flex items-center gap-2 text-white/90">
                        <MapPin className="h-3.5 w-3.5 text-volt shrink-0" />
                      <span className="truncate">
                          {race.neighborhood ? `${race.neighborhood} - ` : ""}
                          {race.city || t("publicRaces.unmappedRegion")}{race.state ? `, ${race.state}` : ""}{race.country ? ` • ${race.country}` : ""}
                        </span>
                      </div>
                    )}

                    {(race.start_address || race.address) && (
                      <div className="flex items-center gap-2 text-white/70">
                        <MapPin className="h-3.5 w-3.5 text-volt shrink-0" />
                        <span className="truncate">{t("createRace.start")}: {race.start_address || race.address}</span>
                      </div>
                    )}

                    {race.finish_address && (
                      <div className="flex items-center gap-2 text-white/70">
                        <MapPin className="h-3.5 w-3.5 text-hyperpink shrink-0" />
                        <span className="truncate">{t("createRace.finish")}: {race.finish_address}</span>
                      </div>
                    )}

                    {race.scheduled_at && (
                      <div className="flex items-center gap-2 text-white/70">
                        <CalendarClock className="h-3.5 w-3.5 text-volt shrink-0" />
                        <span>{new Date(race.scheduled_at).toLocaleString()}</span>
                      </div>
                    )}

                    {race.location_notes && (
                      <p className="text-[10px] text-mutedgray leading-relaxed line-clamp-2">
                        {race.location_notes}
                      </p>
                    )}

                    {/* Mode info & modality details */}
                    <div className="grid grid-cols-2 gap-2 mt-1 text-[10px] uppercase font-black tracking-wide">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">
                          {race.modality === "running" ? "🏃" : race.modality === "bike" ? "🚴" : "🏁"}
                        </span>
                        <span>{race.modality === "running" ? t("publicRaces.race") : race.modality === "bike" ? t("publicRaces.pedal") : t("publicRaces.other")}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-white/70">
                        <TrendingUp className="h-3.5 w-3.5 text-hyperpink shrink-0" />
                        <span>{race.mode === "live" ? t("publicRaces.liveRealtime") : t("invite.timeTrial")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions / CTA */}
                  <div className="flex justify-between items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5 text-xs text-white font-bold">
                      <Users className="h-4.5 w-4.5 text-volt" />
                      <span>{race.participantsCount === 1 ? t("publicRaces.athlete", { count: race.participantsCount }) : t("publicRaces.athletes", { count: race.participantsCount })}</span>
                    </div>

                    <div className="flex gap-2">
                      {(race.allow_spectators ?? true) && (
                        <Button
                          variant="glass"
                          onClick={() => navigate(`/app/watch/${race.id}`)}
                          className="text-[9px] font-black py-2 px-3 rounded-xl tracking-widest shrink-0"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          {t("publicRaces.spectate")}
                        </Button>
                      )}
                      <Button
                        variant={isActive ? "volt" : "pink"}
                        onClick={() => handleJoinRace(race)}
                        isLoading={joiningId === race.id}
                        className="text-[9px] font-black py-2 px-4 rounded-xl tracking-widest shrink-0"
                      >
                        {t("publicRaces.join")}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicRaces;
