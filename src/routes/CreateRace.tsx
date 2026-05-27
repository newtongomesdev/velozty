import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/Toast";
import { Button } from "../components/ui/Button";
import { Card, CardTitle } from "../components/ui/Card";
import { LeafletMap } from "../components/race/LeafletMap";
import { useI18n } from "../components/i18n/I18nProvider";
import { createRace } from "../lib/supabase";
import { z } from "zod";
import { ArrowLeft, MapPin, Milestone, RotateCcw, HelpCircle, Navigation, Eye, EyeOff, CalendarClock, MapPinned, StickyNote } from "lucide-react";

// Form validation schema using Zod
const buildRaceFormSchema = (t: (key: string, vars?: Record<string, string | number>) => string) => z.object({
  name: z.string().min(3, t("createRace.nameMin")),
  modality: z.enum(["running", "bike", "other"]),
  mode: z.enum(["live", "time_trial"]),
  finishRadiusM: z.number().min(10).max(100),
  startLat: z.number().refine(v => v !== 0, t("createRace.chooseStart")),
  startLng: z.number().refine(v => v !== 0, t("createRace.chooseStart")),
  finishLat: z.number().refine(v => v !== 0, t("createRace.chooseFinish")),
  finishLng: z.number().refine(v => v !== 0, t("createRace.chooseFinish")),
  isPublic: z.boolean(),
  allowSpectators: z.boolean(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  neighborhood: z.string().nullable(),
  startAddress: z.string().nullable(),
  finishAddress: z.string().nullable(),
  locationNotes: z.string().nullable(),
  scheduledAt: z.string().min(1, t("createRace.scheduleRequired")),
});

export const CreateRace: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useI18n();
  
  const [name, setName] = useState("");
  const [modality, setModality] = useState<"running" | "bike" | "other">("running");
  const [mode, setMode] = useState<"live" | "time_trial">("live");
  const [finishRadiusM, setFinishRadiusM] = useState(30);
  const [isPublic, setIsPublic] = useState(false);
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [startAddress, setStartAddress] = useState("");
  const [finishAddress, setFinishAddress] = useState("");
  const [locationNotes, setLocationNotes] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [routeCoords, setRouteCoords] = useState<{ lat: number; lng: number }[]>([]);
  const [waypoints, setWaypoints] = useState<{ lat: number; lng: number }[]>([]);
  
  // Coordinates state
  const [startPoint, setStartPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [finishPoint, setFinishPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: -23.55052, lng: -46.633308 });
  const [loading, setLoading] = useState(false);

  // Auto-center map on user's current GPS position on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMapCenter(coords);
        },
        (err) => {
          console.warn("Could not get initial user location for map centering:", err);
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  const fetchGeocoding = async (lat: number, lng: number, pointType: "start" | "finish") => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const addr = data.address;
          const detCity = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || "";
          const detState = addr.state || "";
          const detBairro = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || "";
          const detAddress = data.display_name || [addr.road, addr.house_number, detBairro, detCity, detState, addr.country].filter(Boolean).join(", ");
          setCity(detCity);
          setStateVal(detState);
          setNeighborhood(detBairro);
          if (pointType === "start") {
            setStartAddress(detAddress);
          } else {
            setFinishAddress(detAddress);
          }
        }
      }
    } catch (err) {
      console.warn("OSM Geocoding Nominatim offline:", err);
    }
  };

  const fetchOSRMRoute = async (
    start: { lat: number; lng: number },
    finish: { lat: number; lng: number },
    wps: { lat: number; lng: number }[] = []
  ) => {
    try {
      const coordsQuery = [
        `${start.lng},${start.lat}`,
        ...wps.map(w => `${w.lng},${w.lat}`),
        `${finish.lng},${finish.lat}`
      ].join(";");

      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsQuery}?overview=full&geometries=geojson`);
      if (res.ok) {
        const data = await res.json();
        if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates) {
          const coords = data.routes[0].geometry.coordinates.map((c: [number, number]) => ({
            lat: c[1],
            lng: c[0]
          }));
          setRouteCoords(coords);
        }
      }
    } catch (err) {
      console.warn("OSM OSRM Routing offline, falling back to straight path line:", err);
      setRouteCoords([start, ...wps, finish]);
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (!startPoint) {
      setStartPoint({ lat, lng });
      showToast(t("createRace.startSetLocating"), "info");
      await fetchGeocoding(lat, lng, "start");
      showToast(t("createRace.startSetNext"), "info");
    } else if (!finishPoint) {
      setFinishPoint({ lat, lng });
      showToast(t("createRace.finishSetRoute"), "info");
      await fetchGeocoding(lat, lng, "finish");
      await fetchOSRMRoute(startPoint, { lat, lng }, []);
      showToast(t("createRace.routeSuccess"), "success");
    } else {
      // Add a intermediate waypoint to customize the route street by street
      const newWaypoints = [...waypoints, { lat, lng }];
      setWaypoints(newWaypoints);
      showToast(t("createRace.waypointAdded", { count: newWaypoints.length }), "info");
      await fetchOSRMRoute(startPoint, finishPoint, newWaypoints);
      showToast(t("createRace.routeUpdated"), "success");
    }
  };

  const handleMarkerDragEnd = async (type: "start" | "finish", lat: number, lng: number) => {
    if (type === "start") {
      setStartPoint({ lat, lng });
      showToast(t("createRace.startUpdated"), "info");
      await fetchGeocoding(lat, lng, "start");
      if (finishPoint) {
        await fetchOSRMRoute({ lat, lng }, finishPoint, waypoints);
      }
    } else if (type === "finish") {
      setFinishPoint({ lat, lng });
      showToast(t("createRace.finishUpdated"), "info");
      await fetchGeocoding(lat, lng, "finish");
      if (startPoint) {
        await fetchOSRMRoute(startPoint, { lat, lng }, waypoints);
      }
    }
  };

  const handleWaypointDragEnd = async (index: number, lat: number, lng: number) => {
    const updated = [...waypoints];
    updated[index] = { lat, lng };
    setWaypoints(updated);
    showToast(t("createRace.waypointMoved", { count: index + 1 }), "info");
    if (startPoint && finishPoint) {
      await fetchOSRMRoute(startPoint, finishPoint, updated);
    }
  };

  const handleRemoveWaypoint = async (idx: number) => {
    const updated = waypoints.filter((_, i) => i !== idx);
    setWaypoints(updated);
    showToast(t("createRace.waypointRemoved"), "info");
    if (startPoint && finishPoint) {
      await fetchOSRMRoute(startPoint, finishPoint, updated);
    }
  };

  const handleResetPoints = () => {
    setStartPoint(null);
    setFinishPoint(null);
    setWaypoints([]);
    setCity("");
    setStateVal("");
    setNeighborhood("");
    setStartAddress("");
    setFinishAddress("");
    setLocationNotes("");
    setRouteCoords([]);
    showToast(t("createRace.resetPoints"), "info");
  };

  const handleLocateUser = () => {
    if (navigator.geolocation) {
      showToast(t("createRace.locating"), "info");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMapCenter(coords);
          showToast(t("createRace.focused"), "success");
        },
        (err) => {
          console.warn("Could not get user position:", err);
          showToast(t("createRace.gpsError"), "error");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      showToast(t("createRace.geoUnsupported"), "error");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = {
      name,
      modality,
      mode,
      finishRadiusM,
      startLat: startPoint?.lat || 0,
      startLng: startPoint?.lng || 0,
      finishLat: finishPoint?.lat || 0,
      finishLng: finishPoint?.lng || 0,
      isPublic,
      allowSpectators,
      city: city || null,
      state: stateVal || null,
      neighborhood: neighborhood || null,
      startAddress: startAddress || null,
      finishAddress: finishAddress || null,
      locationNotes: locationNotes || null,
      scheduledAt
    };

    // Zod parsing safety
    const result = buildRaceFormSchema(t).safeParse(formData);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message || t("createRace.invalidData");
      showToast(firstError, "error");
      setLoading(false);
      return;
    }

    try {
      const newRace = await createRace({
        name: formData.name,
        modality: formData.modality,
        mode: formData.mode,
        start_lat: formData.startLat,
        start_lng: formData.startLng,
        finish_lat: formData.finishLat,
        finish_lng: formData.finishLng,
        finish_radius_m: formData.finishRadiusM,
        is_public: formData.isPublic,
        allow_spectators: formData.allowSpectators,
        city: formData.city,
        state: formData.state,
        neighborhood: formData.neighborhood,
        start_address: formData.startAddress,
        finish_address: formData.finishAddress,
        address: formData.startAddress,
        location_notes: formData.locationNotes,
        scheduled_at: new Date(formData.scheduledAt).toISOString(),
        route_coords: routeCoords
      });

      showToast(t("createRace.raceCreated"), "success");
      navigate(`/app/races/${newRace.id}`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || t("createRace.createError"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-darkbg text-white p-4 relative flex flex-col gap-4 md:p-8">
      
      {/* 1. BACK BUTTON HEADER */}
      <header className="max-w-4xl mx-auto w-full flex items-center gap-3">
        <button
          onClick={() => navigate("/app/dashboard")}
          className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all focus:outline-none"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[9px] font-black tracking-widest text-mutedgray uppercase">{t("createRace.routeMapper")}</span>
          <h1 className="text-xl font-black uppercase tracking-wide">{t("createRace.configureRace")}</h1>
        </div>
      </header>

      {/* 2. CHASSIS DOUBLE LAYOUT */}
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-4 md:grid md:grid-cols-5 flex-1">
        
        {/* Left Side Inputs Form */}
        <form onSubmit={handleCreate} className="flex flex-col gap-4 md:col-span-2 h-full justify-between">
          
          <Card glow="volt" className="flex-1 flex flex-col gap-4">
            <CardTitle className="text-sm">{t("createRace.telemetrySetup")}</CardTitle>

            {/* Race Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("createRace.raceName")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("createRace.raceNamePlaceholder")}
                required
                className="px-3.5 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-volt focus:ring-1 focus:ring-volt tracking-wide placeholder-white/15 transition-all"
              />
            </div>

            {/* Modality Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("createRace.sportMode")}</label>
              <div className="grid grid-cols-3 gap-2">
                {(["running", "bike", "other"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModality(m)}
                    className={`py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                      modality === m
                        ? "bg-volt text-black border-transparent shadow-[0_0_8px_rgba(198,255,0,0.2)]"
                        : "bg-white/3 border-white/5 text-mutedgray hover:text-white"
                    }`}
                  >
                    {m === "running" ? t("createRace.running") : m === "bike" ? t("createRace.bike") : t("createRace.other")}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("createRace.competitionMode")}</label>
              <div className="grid grid-cols-2 gap-2">
                {(["live", "time_trial"] as const).map((md) => (
                  <button
                    key={md}
                    type="button"
                    onClick={() => setMode(md)}
                    className={`py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                      mode === md
                        ? "bg-hyperpink text-white border-transparent shadow-[0_0_8px_rgba(255,43,214,0.2)]"
                        : "bg-white/3 border-white/5 text-mutedgray hover:text-white"
                    }`}
                  >
                    {md === "live" ? t("createRace.live") : t("createRace.timeTrial")}
                  </button>
                ))}
              </div>
            </div>

            {/* Trigger Radius Slider */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5 text-volt" />
                {t("createRace.schedule")}
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
                className="px-3.5 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-volt focus:ring-1 focus:ring-volt tracking-wide transition-all"
              />
            </div>

            {/* Trigger Radius Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("createRace.finishRadius")}</label>
                <span className="text-xs font-black text-hyperpink drop-shadow-[0_0_5px_rgba(255,43,214,0.3)] font-mono">{t("createRace.meters", { count: finishRadiusM })}</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={finishRadiusM}
                onChange={(e) => setFinishRadiusM(Number(e.target.value))}
                className="w-full h-1.5 bg-black/50 border border-white/10 rounded-lg appearance-none cursor-pointer accent-hyperpink focus:outline-none"
              />
              <span className="text-[9px] font-bold text-mutedgray leading-relaxed">
                {t("createRace.finishRadiusHelp")}
              </span>
            </div>
            
            {/* Visibilidade da Corrida (Pública/Privada) */}
            <div className="flex flex-col gap-1.5 border-t border-white/5 pt-4">
              <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("createRace.visibility")}</label>
              <div className="grid grid-cols-2 gap-2">
                {([false, true] as const).map((pub) => (
                  <button
                    key={pub ? "public" : "private"}
                    type="button"
                    onClick={() => setIsPublic(pub)}
                    className={`py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                      isPublic === pub
                        ? "bg-volt text-black border-transparent shadow-[0_0_8px_rgba(198,255,0,0.2)]"
                        : "bg-white/3 border-white/5 text-mutedgray hover:text-white"
                    }`}
                  >
                    {pub ? t("createRace.public") : t("createRace.private")}
                  </button>
                ))}
              </div>
            </div>

            {/* Permissão de Espectadores */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("createRace.spectators")}</label>
              <div className="grid grid-cols-2 gap-2">
                {([true, false] as const).map((enabled) => (
                  <button
                    key={enabled ? "spectators-on" : "spectators-off"}
                    type="button"
                    onClick={() => setAllowSpectators(enabled)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                      allowSpectators === enabled
                        ? "bg-hyperpink text-white border-transparent shadow-[0_0_8px_rgba(255,43,214,0.2)]"
                        : "bg-white/3 border-white/5 text-mutedgray hover:text-white"
                    }`}
                  >
                    {enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {enabled ? t("createRace.spectatorsAllowed") : t("createRace.spectatorsBlocked")}
                  </button>
                ))}
              </div>
              <span className="text-[9px] font-bold text-mutedgray leading-relaxed">
                {t("createRace.spectatorsHelp")}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider flex items-center gap-1.5">
                <MapPinned className="h-3.5 w-3.5 text-volt" />
                {t("createRace.startAddress")}
              </label>
              <input
                type="text"
                value={startAddress}
                onChange={(e) => setStartAddress(e.target.value)}
                placeholder={t("createRace.startAddressPlaceholder")}
                className="px-3.5 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-volt focus:ring-1 focus:ring-volt tracking-wide placeholder-white/15 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider flex items-center gap-1.5">
                <MapPinned className="h-3.5 w-3.5 text-hyperpink" />
                {t("createRace.finishAddress")}
              </label>
              <input
                type="text"
                value={finishAddress}
                onChange={(e) => setFinishAddress(e.target.value)}
                placeholder={t("createRace.finishAddressPlaceholder")}
                className="px-3.5 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-hyperpink focus:ring-1 focus:ring-hyperpink tracking-wide placeholder-white/15 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider flex items-center gap-1.5">
                <StickyNote className="h-3.5 w-3.5 text-hyperpink" />
                {t("createRace.locationNotes")}
              </label>
              <textarea
                value={locationNotes}
                onChange={(e) => setLocationNotes(e.target.value)}
                rows={3}
                placeholder={t("createRace.locationNotesPlaceholder")}
                className="px-3.5 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-hyperpink focus:ring-1 focus:ring-hyperpink tracking-wide placeholder-white/15 transition-all resize-none"
              />
            </div>

            {/* Cidade / Estado / Bairro (visible only when public or prefilled to help the user know discovery location) */}
            {isPublic && (
              <div className="flex flex-col gap-3 mt-1 animate-fadeIn">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("createRace.cityAuto")}</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ex: City"
                      className="px-3.5 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-volt focus:ring-1 focus:ring-volt tracking-wide placeholder-white/15 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">Estado (UF)</label>
                    <input
                      type="text"
                      value={stateVal}
                      onChange={(e) => setStateVal(e.target.value)}
                      placeholder="UF"
                      maxLength={2}
                      className="px-3.5 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-volt focus:ring-1 focus:ring-volt tracking-wide placeholder-white/15 transition-all uppercase"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("createRace.neighborhoodAuto")}</label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Ex: Downtown"
                    className="px-3.5 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-volt focus:ring-1 focus:ring-volt tracking-wide placeholder-white/15 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Coordinate Status Check */}
            <div className="mt-2 border-t border-white/5 pt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                <MapPin className={`h-4.5 w-4.5 ${startPoint ? "text-volt animate-pulse" : "text-mutedgray"}`} />
                {t("createRace.start")}: <span className={startPoint ? "text-white" : "text-mutedgray/50"}>{startPoint ? t("createRace.defined") : t("createRace.undefined")}</span>
              </div>

              {/* Waypoint list */}
              {waypoints.length > 0 && (
                <div className="flex flex-col gap-1.5 pl-6.5 my-1">
                  <span className="text-[8px] font-black text-mutedgray uppercase tracking-wider">{t("createRace.waypoints")}</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {waypoints.map((_, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-cyan-300"
                      >
                        {t("createRace.point", { count: idx + 1 })}
                        <button
                          type="button"
                          onClick={() => handleRemoveWaypoint(idx)}
                          className="hover:text-hyperpink font-black px-1 cursor-pointer transition-colors"
                          title={t("createRace.removePoint")}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                <Milestone className={`h-4.5 w-4.5 ${finishPoint ? "text-hyperpink animate-pulse" : "text-mutedgray"}`} />
                {t("createRace.finish")}: <span className={finishPoint ? "text-white" : "text-mutedgray/50"}>{finishPoint ? t("createRace.defined") : t("createRace.undefined")}</span>
              </div>
            </div>
          </Card>

          <Button
            type="submit"
            variant="volt"
            fullWidth
            isLoading={loading}
            className="py-4 mt-2"
          >
            {t("createRace.launchRace")}
          </Button>
        </form>

        {/* Right Side Map Viewer (desktop grid span 3) */}
        <div className="md:col-span-3 h-[380px] md:h-[520px] w-full relative flex flex-col">
          
          {/* Absolute Map controls */}
          <div className="absolute top-3 left-3 z-[1000] flex gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={handleResetPoints}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-darkbg/95 border border-white/10 text-white text-[9px] font-black uppercase tracking-wider shadow-lg backdrop-blur-md transition-all hover:bg-white/5 active:scale-95 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3 text-hyperpink" />
              {t("createRace.resetButton")}
            </button>
            <button
              type="button"
              onClick={handleLocateUser}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-darkbg/95 border border-white/10 text-white text-[9px] font-black uppercase tracking-wider shadow-lg backdrop-blur-md transition-all hover:bg-volt/10 hover:text-volt hover:border-volt/30 active:scale-95 cursor-pointer"
            >
              <Navigation className="h-3 w-3 text-volt fill-volt/10 animate-pulse" />
              {t("createRace.myPosition")}
            </button>
          </div>

          <div className="absolute top-3 right-3 z-[1000] pointer-events-auto">
            <div className="group relative">
              <button
                type="button"
                className="p-2 rounded-xl bg-darkbg/95 border border-white/10 text-mutedgray hover:text-white transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
              <div className="absolute top-10 right-0 w-48 p-3 rounded-xl bg-[#050508]/95 border border-white/15 text-[10px] font-bold leading-normal text-mutedgray shadow-2xl opacity-0 scale-95 origin-top-right group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none uppercase tracking-wide">
                {t("createRace.mapHelp")}
              </div>
            </div>
          </div>

          <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 relative">
            <LeafletMap
              mode="create"
              startPoint={startPoint}
              finishPoint={finishPoint}
              waypoints={waypoints}
              routeCoords={routeCoords}
              onMapClick={handleMapClick}
              onMarkerDragEnd={handleMarkerDragEnd}
              onWaypointDragEnd={handleWaypointDragEnd}
              center={mapCenter}
              zoom={15}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default CreateRace;
