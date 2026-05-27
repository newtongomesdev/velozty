import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/auth/AuthGuard";
import { useToast } from "../components/ui/Toast";
import { Button } from "../components/ui/Button";
import { Card, CardTitle } from "../components/ui/Card";
import { useI18n } from "../components/i18n/I18nProvider";
import { useTheme } from "../App";
import { getNotificationCapability, getWakeLockStatus, requestPwaNotifications, requestScreenWakeLock, type NotificationCapability, type WakeLockStatus } from "../lib/devicePermissions";
import { 
  deleteMyAccount,
  exportMyData,
  fetchRacesForDashboard, 
  joinRace,
  updateUserProfile
} from "../lib/supabase";
import type { Race } from "../lib/supabase";
import { 
  Plus, 
  LogOut, 
  Activity, 
  Compass, 
  Navigation, 
  TrendingUp, 
  Cpu,
  Settings,
  User,
  MessageCircle,
  Sliders,
  X,
  Sun,
  Moon,
  Camera,
  Lock,
  Unlock,
  Link,
  Languages,
  ShieldCheck,
  Download,
  Trash2
} from "lucide-react";
import dayjs from "dayjs";

const LGPD_CONSENT_KEY = "velozty_lgpd_consent";
const LGPD_EXPORT_PREFIXES = ["velozty_", "velocity_"];
const ADMIN_EMAIL = "egeohub101@gmail.com";

export const Dashboard: React.FC = () => {
  const { user, logoutUser } = useAuth();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const navigate = useNavigate();
  
  const [createdRaces, setCreatedRaces] = useState<Race[]>([]);
  const [joinedRaces, setJoinedRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Code-joining input state
  const [inviteCode, setInviteCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  // Settings & Profile state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newCountry, setNewCountry] = useState("Brasil");
  const [newStateVal, setNewStateVal] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newBirthdate, setNewBirthdate] = useState("1995-01-01");
  const [newGender, setNewGender] = useState("Outro");
  const [newBio, setNewBio] = useState("");
  const [newWebsite, setNewWebsite] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(true);
  const [newAvatarUrl, setNewAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [lgpdConsent, setLgpdConsent] = useState(() => localStorage.getItem(LGPD_CONSENT_KEY) === "accepted");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [gpsAccuracy, setGpsAccuracy] = useState(() => {
    return localStorage.getItem("velocity_gps_accuracy") || "high";
  });
  const [gpsSmoothing, setGpsSmoothing] = useState(() => {
    return localStorage.getItem("velocity_gps_smoothing") || "0.35";
  });
  const [gpsAutoPauseSpeed, setGpsAutoPauseSpeed] = useState(() => {
    return parseFloat(localStorage.getItem("velocity_gps_autopause_speed") || "1.2");
  });

  // Pre-fill profile values when user session loads
  useEffect(() => {
    if (user) {
      setNewDisplayName(user.display_name || "");
      setNewCountry(user.country || "Brasil");
      setNewStateVal(user.state || "");
      setNewCity(user.city || "");
      setNewBirthdate(user.birthdate || "1995-01-01");
      setNewGender(user.gender || "Outro");
      setNewBio(user.bio || "");
      setNewWebsite(user.website || "");
      setNewIsPublic(user.is_public !== false);
      setNewAvatarUrl(user.avatar_url || "");
      setAvatarPreview(user.avatar_url || "");
    }
  }, [user]);

  // Handle avatar file selection → convert to base64 data URL
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast(t("dashboard.photoTooLarge"), "warning");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setAvatarPreview(result);
      setNewAvatarUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim()) return;
    setUpdatingProfile(true);
    try {
      await updateUserProfile({
        display_name: newDisplayName,
        country: newCountry,
        state: newStateVal,
        city: newCity,
        birthdate: newBirthdate,
        gender: newGender,
        bio: newBio,
        website: newWebsite,
        avatar_url: newAvatarUrl,
        is_public: newIsPublic,
      });
      showToast(t("dashboard.profileUpdated"), "success");
      setShowProfileModal(false);
    } catch (err: any) {
      showToast(err.message || t("dashboard.profileUpdateError"), "error");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("velocity_gps_accuracy", gpsAccuracy);
    localStorage.setItem("velocity_gps_smoothing", gpsSmoothing);
    localStorage.setItem("velocity_gps_autopause_speed", gpsAutoPauseSpeed.toString());
    localStorage.setItem(LGPD_CONSENT_KEY, lgpdConsent ? "accepted" : "revoked");
    showToast(t("dashboard.settingsSaved"), "success");
    setShowSettingsModal(false);
  };

  const handleToggleLgpdConsent = () => {
    const nextValue = !lgpdConsent;
    setLgpdConsent(nextValue);
    localStorage.setItem(LGPD_CONSENT_KEY, nextValue ? "accepted" : "revoked");
    showToast(nextValue ? t("dashboard.lgpdConsentSaved") : t("dashboard.lgpdConsentRevoked"), "info");
  };

  const getPortableData = () => {
    const localData = Object.keys(localStorage)
      .filter(key => LGPD_EXPORT_PREFIXES.some(prefix => key.startsWith(prefix)))
      .reduce<Record<string, unknown>>((acc, key) => {
        const value = localStorage.getItem(key);
        try {
          acc[key] = value ? JSON.parse(value) : value;
        } catch {
          acc[key] = value;
        }
        return acc;
      }, {});

    return {
      exported_at: new Date().toISOString(),
      app: "Velozty",
      user_id: user?.id,
      user_email: user?.email,
      local_data: localData,
    };
  };

  const handleExportLgpdData = () => {
    exportMyData()
      .then((serverData) => {
        const payload = JSON.stringify({
          ...serverData,
          local_data: getPortableData().local_data,
        }, null, 2);
        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `velozty-lgpd-${user?.id || "dados"}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showToast(t("dashboard.lgpdExported"), "success");
      })
      .catch((err: any) => {
        console.error(err);
        showToast(err.message || t("dashboard.lgpdExportError"), "error");
      });
  };

  const handleDeleteLgpdData = async () => {
    if (!window.confirm(t("dashboard.lgpdDeleteConfirm"))) return;
    try {
      await deleteMyAccount();
      Object.keys(localStorage)
        .filter(key => LGPD_EXPORT_PREFIXES.some(prefix => key.startsWith(prefix)))
        .forEach(key => localStorage.removeItem(key));
      showToast(t("dashboard.lgpdDeleted"), "info");
      navigate("/login");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || t("dashboard.lgpdDeleteError"), "error");
    }
  };

  // Permission Diagnostics & Center State
  const [gpsPermission, setGpsPermission] = useState<"granted" | "prompt" | "denied" | "checking">("checking");
  const [notifPermission, setNotifPermission] = useState<NotificationCapability | "checking">("checking");
  const [wakeLockStatus, setWakeLockStatus] = useState<WakeLockStatus>("not_supported");

  const checkPermissions = async () => {
    // 1. Check GPS Permission
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const res = await navigator.permissions.query({ name: "geolocation" as any });
        setGpsPermission(res.state as any);
        res.onchange = () => {
          setGpsPermission(res.state as any);
        };
      } catch (err) {
        setGpsPermission("prompt");
      }
    } else {
      setGpsPermission("prompt");
    }

    // 2. Check Notifications Permission
    setNotifPermission(getNotificationCapability());

    // 3. Check Wake Lock Support/State
    setWakeLockStatus(getWakeLockStatus());
  };

  useEffect(() => {
    if (showSettingsModal) {
      checkPermissions();
    }
  }, [showSettingsModal]);

  const handleRequestGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setGpsPermission("granted");
          showToast(t("dashboard.gpsAllowed"), "success");
        },
        () => {
          setGpsPermission("denied");
          showToast(t("dashboard.gpsBlocked"), "error");
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const handleRequestNotif = async () => {
    try {
      const res = await requestPwaNotifications();
      setNotifPermission(res);
      if (res === "granted") {
        showToast(t("dashboard.notificationsOn"), "success");
      } else if (res === "not_supported") {
        showToast(t("dashboard.notificationsUnavailable"), "warning");
      } else {
        showToast(t("dashboard.notificationsDenied"), "warning");
      }
    } catch (err) {
      showToast(t("dashboard.notificationsError"), "error");
    }
  };

  const handleRequestWakeLock = async () => {
    try {
      const status = await requestScreenWakeLock();
      setWakeLockStatus(status);
      if (status === "active") {
        showToast(t("dashboard.wakeLockOn"), "success");
      } else {
        showToast(t("dashboard.wakeLockUnavailable"), "warning");
      }
    } catch (err) {
      setWakeLockStatus(getWakeLockStatus());
      showToast(t("dashboard.wakeLockError"), "error");
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await fetchRacesForDashboard();
      setCreatedRaces(data.created);
      setJoinedRaces(data.joined);
    } catch (err: any) {
      console.error(err);
      showToast(t("dashboard.syncError"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      showToast(t("dashboard.logoutDone"), "info");
      navigate("/login");
    } catch (err: any) {
      showToast(t("dashboard.logoutError"), "error");
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      showToast(t("dashboard.inviteRequired"), "warning");
      return;
    }

    setJoinLoading(true);
    try {
      const participant = await joinRace(inviteCode);
      showToast(t("dashboard.joinSuccess"), "success");
      navigate(`/races/${participant.race_id}`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || t("dashboard.joinError"), "error");
    } finally {
      setJoinLoading(false);
      setInviteCode("");
    }
  };

  const getStatusBadge = (status: Race["status"]) => {
    const configs = {
      lobby: { text: t("dashboard.lobbyStatus"), style: "bg-white/5 border-white/10 text-white" },
      active: { text: t("dashboard.activeStatus"), style: "bg-volt/10 border-volt/20 text-volt shadow-[0_0_8px_rgba(198,255,0,0.15)] animate-pulse" },
      finished: { text: t("dashboard.finishedStatus"), style: "bg-hyperpink/10 border-hyperpink/20 text-hyperpink" },
      cancelled: { text: t("dashboard.cancelledStatus"), style: "bg-red-500/10 border-red-500/20 text-red-400" }
    };
    const c = configs[status] || configs.lobby;
    return (
      <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider ${c.style}`}>
        {c.text}
      </span>
    );
  };

  const getModalityText = (mod: Race["modality"]) => {
    switch (mod) {
      case "running": return t("dashboard.running");
      case "bike": return t("dashboard.bike");
      default: return t("dashboard.other");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-darkbg text-white p-4 relative pb-20 md:p-8">
      
      {/* Dynamic ambient backgrounds */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full filter blur-[120px] bg-volt/5 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full filter blur-[120px] bg-hyperpink/5 pointer-events-none" />

      <div className="max-w-4xl mx-auto flex flex-col gap-6 z-10 relative">
        
        {/* 1. ATHLETE BRAND HEADER */}
        <header className="flex justify-between items-center bg-neoncard/50 border border-white/5 p-4 rounded-3xl backdrop-blur-md">
          <div 
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 active:scale-98 transition-all"
            title="Visualizar Perfil"
          >
            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-volt flex items-center justify-center text-black font-black uppercase shadow-[0_0_12px_#C6FF00]">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.display_name.slice(0, 2)}</span>
                )}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-black tracking-widest text-mutedgray uppercase">{t("dashboard.title")}</span>
              <div className="flex items-center gap-2">
                <span className="text-base font-black uppercase tracking-wide text-white hover:text-volt transition-colors">{user?.display_name}</span>
                {(user?.is_admin || user?.email === ADMIN_EMAIL) && (
                  <span className="rounded-lg border border-volt/30 bg-volt/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] text-volt">
                    {t("dashboard.adminBadge")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/social")}
              className="p-2.5 rounded-2xl bg-hyperpink/10 border border-hyperpink/20 text-hyperpink hover:text-white hover:bg-hyperpink hover:border-hyperpink transition-all focus:outline-none cursor-pointer shadow-[0_0_14px_rgba(255,43,214,0.16)]"
              title={t("dashboard.social")}
            >
              <MessageCircle className="h-4.5 w-4.5" />
            </button>

            <button
              onClick={() => setShowProfileModal(true)}
              className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-hyperpink hover:bg-hyperpink/10 hover:border-hyperpink/20 transition-all focus:outline-none cursor-pointer"
              title={t("dashboard.profileTitle")}
            >
              <User className="h-4.5 w-4.5" />
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-volt hover:bg-volt/10 hover:border-volt/20 transition-all focus:outline-none cursor-pointer"
              title={t("dashboard.settingsTitle")}
            >
              <Settings className="h-4.5 w-4.5" />
            </button>

          </div>
        </header>

        {/* 2. STAT DIALS */}
        <div className="grid grid-cols-3 gap-2 text-center md:gap-4">
          <Card className="p-3.5 flex flex-col items-center justify-center border-white/5 bg-white/3">
            <Activity className="h-4.5 w-4.5 text-volt mb-1" />
            <span className="text-[8px] font-black tracking-widest text-mutedgray uppercase">{t("dashboard.total")}</span>
            <span className="text-xl font-black mt-0.5">{createdRaces.length + joinedRaces.length}</span>
          </Card>
          
          <Card className="p-3.5 flex flex-col items-center justify-center border-white/5 bg-white/3">
            <Compass className="h-4.5 w-4.5 text-hyperpink mb-1" />
            <span className="text-[8px] font-black tracking-widest text-mutedgray uppercase">{t("dashboard.hosted")}</span>
            <span className="text-xl font-black mt-0.5">{createdRaces.length}</span>
          </Card>

          <Card className="p-3.5 flex flex-col items-center justify-center border-white/5 bg-white/3">
            <TrendingUp className="h-4.5 w-4.5 text-white mb-1" />
            <span className="text-[8px] font-black tracking-widest text-mutedgray uppercase">{t("dashboard.rate")}</span>
            <span className="text-xl font-black mt-0.5 font-mono">100%</span>
          </Card>
        </div>

        {/* 3. DOCK ACTION PANEL */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Create Race Card */}
          <Card glow="volt" className="flex flex-col justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2 text-volt">
                <Navigation className="h-5 w-5 fill-current" />
                {t("dashboard.createRoute")}
              </CardTitle>
              <p className="text-xs text-mutedgray mt-1.5 leading-relaxed">
                {t("dashboard.createRouteBody")}
              </p>
            </div>
            <Button
              onClick={() => navigate("/races/new")}
              variant="volt"
              fullWidth
              className="mt-2"
            >
              <Plus className="h-5 w-5 mr-1" />
              {t("dashboard.createRace")}
            </Button>
          </Card>

          {/* Discover Public Races Card */}
          <Card glow="pink" className="flex flex-col justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2 text-hyperpink">
                <Compass className="h-5 w-5 text-hyperpink" />
                {t("dashboard.explorePublic")}
              </CardTitle>
              <p className="text-xs text-mutedgray mt-1.5 leading-relaxed">
                {t("dashboard.explorePublicBody")}
              </p>
            </div>
            <Button
              onClick={() => navigate("/races/public")}
              variant="pink"
              fullWidth
              className="mt-2"
            >
              {t("dashboard.discoveryLobby")}
            </Button>
          </Card>

          {/* Join by Code Card */}
          <Card glow="volt" className="flex flex-col justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2 text-volt">
                <Cpu className="h-5 w-5" />
                {t("dashboard.entryCode")}
              </CardTitle>
              <p className="text-xs text-mutedgray mt-1.5 leading-relaxed">
                {t("dashboard.entryCodeBody")}
              </p>
            </div>

            <form onSubmit={handleJoinByCode} className="flex gap-2 w-full mt-2">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="EX: PAULIS"
                maxLength={8}
                required
                className="flex-1 px-3 py-2.5 bg-black/45 border border-white/10 rounded-xl text-sm font-black text-center text-white focus:outline-none focus:border-volt tracking-widest uppercase placeholder-white/10 font-mono"
              />
              <Button
                type="submit"
                variant="volt"
                isLoading={joinLoading}
                className="px-5 py-2.5 font-extrabold uppercase text-xs"
              >
                {t("dashboard.enter")}
              </Button>
            </form>
          </Card>

          <Card glow="pink" className="flex flex-col justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2 text-hyperpink">
                <MessageCircle className="h-5 w-5 text-hyperpink" />
                {t("dashboard.social")}
              </CardTitle>
              <p className="text-xs text-mutedgray mt-1.5 leading-relaxed">
                {t("dashboard.socialBody")}
              </p>
            </div>
            <Button
              onClick={() => navigate("/social")}
              variant="pink"
              fullWidth
              className="mt-2"
            >
              {t("dashboard.openSocial")}
            </Button>
          </Card>
        </div>

        {/* 4. HISTORICAL STREAM LISTS */}
        <section className="flex flex-col gap-6">
          
          {/* A. Races created by user */}
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-black tracking-widest text-volt uppercase border-l-2 border-volt pl-2">
              {t("dashboard.hostedRoutes")}
            </h2>

            {loading ? (
              <div className="text-center py-6 text-xs font-extrabold text-mutedgray uppercase animate-pulse">{t("dashboard.syncingHost")}</div>
            ) : createdRaces.length === 0 ? (
              <div className="text-center py-8 text-xs font-bold text-mutedgray uppercase bg-white/3 border border-white/5 rounded-2xl">
                {t("dashboard.noHosted")}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {createdRaces.map((race) => (
                  <Card
                    key={race.id}
                    hoverable
                    onClick={() => navigate(`/races/${race.id}`)}
                    className="p-4 flex items-center justify-between border-white/5 hover:border-volt/30"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-white uppercase tracking-wide">
                          {race.name}
                        </span>
                        {getStatusBadge(race.status)}
                      </div>
                      <span className="text-[10px] font-black text-mutedgray uppercase tracking-wider">
                        {getModalityText(race.modality)} • {race.mode === "live" ? t("dashboard.live") : t("invite.timeTrial")}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[9px] font-bold text-mutedgray font-mono">
                        {dayjs(race.created_at).format("DD/MM/YYYY")}
                      </span>
                      <button className="text-xs font-black text-volt uppercase tracking-wider underline hover:text-white transition-colors focus:outline-none">
                        {t("dashboard.open")}
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* B. Races joined by user */}
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-black tracking-widest text-hyperpink uppercase border-l-2 border-hyperpink pl-2">
              {t("dashboard.joinedRaces")}
            </h2>

            {loading ? (
              <div className="text-center py-6 text-xs font-extrabold text-mutedgray uppercase animate-pulse">{t("dashboard.syncingGuest")}</div>
            ) : joinedRaces.length === 0 ? (
              <div className="text-center py-8 text-xs font-bold text-mutedgray uppercase bg-white/3 border border-white/5 rounded-2xl">
                {t("dashboard.noJoined")}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {joinedRaces.map((race) => (
                  <Card
                    key={race.id}
                    hoverable
                    onClick={() => navigate(`/races/${race.id}`)}
                    className="p-4 flex items-center justify-between border-white/5 hover:border-hyperpink/30"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-white uppercase tracking-wide">
                          {race.name}
                        </span>
                        {getStatusBadge(race.status)}
                      </div>
                      <span className="text-[10px] font-black text-mutedgray uppercase tracking-wider">
                        {getModalityText(race.modality)} • {race.mode === "live" ? t("dashboard.live") : t("invite.timeTrial")}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[9px] font-bold text-mutedgray font-mono">
                        {dayjs(race.created_at).format("DD/MM/YYYY")}
                      </span>
                      <button className="text-xs font-black text-hyperpink uppercase tracking-wider underline hover:text-white transition-colors focus:outline-none">
                        {t("dashboard.open")}
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 5. PREMIUM USER PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/65 backdrop-blur-md p-4 animate-fade-in">
          <Card glow="pink" className="w-full max-w-md bg-[#101018]/95 border border-white/10 relative p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto scrollbar-hide">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-hyperpink" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">{t("dashboard.profileTitle")}</h2>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-mutedgray hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">

              {/* ── AVATAR UPLOAD ── */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="relative w-20 h-20 rounded-2xl overflow-hidden cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                  title={t("dashboard.clickPhoto")}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-volt/10 border-2 border-dashed border-volt/30 flex items-center justify-center text-2xl font-black text-volt">
                      {user?.display_name?.slice(0, 2).toUpperCase() || "?"}
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <p className="text-[9px] text-mutedgray uppercase tracking-wider font-bold">
                  {t("dashboard.clickPhoto")}
                </p>
              </div>

              {/* ── VISIBILIDADE DO PERFIL ── */}
              <button
                type="button"
                onClick={() => setNewIsPublic(v => !v)}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                  newIsPublic
                    ? "bg-volt/10 border-volt/30 shadow-[0_0_10px_rgba(198,255,0,0.1)]"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  {newIsPublic ? (
                    <Unlock className="h-4 w-4 text-volt" />
                  ) : (
                    <Lock className="h-4 w-4 text-mutedgray" />
                  )}
                  <div className="text-left">
                    <span className={`text-xs font-black uppercase tracking-wider ${newIsPublic ? "text-volt" : "text-mutedgray"}`}>
                      {newIsPublic ? t("dashboard.publicProfile") : t("dashboard.privateProfile")}
                    </span>
                    <p className="text-[9px] text-mutedgray mt-0.5">
                      {newIsPublic ? t("dashboard.publicProfileBody") : t("dashboard.privateProfileBody")}
                    </p>
                  </div>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${
                  newIsPublic ? "bg-volt" : "bg-white/10"
                }`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${
                    newIsPublic ? "left-5" : "left-0.5"
                  }`} />
                </div>
              </button>

              {/* ── IDENTIDADE ── */}
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-hyperpink">
                <Sliders className="h-4 w-4" />
                {t("dashboard.profileIdentity")}
              </div>

              {/* Locked Username & Email */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("dashboard.username")}</label>
                  <input
                    type="text"
                    value={`@${user?.username || user?.display_name.toLowerCase().replace(/\s+/g, '') || "cyberracer"}`}
                    disabled
                    className="px-3.5 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs font-black text-mutedgray font-mono cursor-not-allowed select-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">Email</label>
                  <input
                    type="text"
                    value={user?.email || "atleta@velozty.com"}
                    disabled
                    className="px-3.5 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs font-black text-mutedgray font-mono cursor-not-allowed select-none overflow-hidden text-ellipsis whitespace-nowrap"
                  />
                </div>
              </div>

              {/* Nome Completo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("dashboard.fullName")}</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  required
                  maxLength={30}
                  placeholder={t("dashboard.fullName")}
                  className="px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-volt placeholder-white/15"
                />
              </div>

              {/* Bio */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("dashboard.bio")}</label>
                <textarea
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  maxLength={160}
                  rows={3}
                  placeholder={t("dashboard.bioPlaceholder")}
                  className="px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-volt placeholder-white/15 resize-none leading-relaxed"
                />
                <span className="text-[9px] text-mutedgray text-right">{newBio.length}/160</span>
              </div>

              {/* Website */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("dashboard.website")}</label>
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mutedgray" />
                  <input
                    type="url"
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                    placeholder="https://your-site.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-volt placeholder-white/15"
                  />
                </div>
              </div>

              {/* Birthdate & Gender */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("dashboard.birthdate")}</label>
                  <input
                    type="date"
                    value={newBirthdate}
                    onChange={(e) => setNewBirthdate(e.target.value)}
                    required
                    className="px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-volt cursor-pointer font-sans"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("dashboard.gender")}</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    required
                    className="px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-volt cursor-pointer appearance-none font-sans"
                    style={{ backgroundPosition: "right 10px center", backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"white\" stroke-width=\"2\"><path d=\"m6 9 6 6 6-6\"/></svg>')", backgroundRepeat: "no-repeat" }}
                  >
                    <option value="Masculino" className="bg-[#101018] text-white">{t("dashboard.male")}</option>
                    <option value="Feminino" className="bg-[#101018] text-white">{t("dashboard.female")}</option>
                    <option value="Outro" className="bg-[#101018] text-white">{t("dashboard.otherHidden")}</option>
                  </select>
                </div>
              </div>

              {/* Location Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("dashboard.country")}</label>
                  <input
                    type="text"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    placeholder="Ex: Brasil"
                    className="px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white focus:outline-none focus:border-volt placeholder-white/15"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("dashboard.state")}</label>
                  <input
                    type="text"
                    value={newStateVal}
                    onChange={(e) => setNewStateVal(e.target.value)}
                    maxLength={2}
                    placeholder="UF"
                    className="px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white focus:outline-none focus:border-volt placeholder-white/15 uppercase text-center"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("dashboard.city")}</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Cidade"
                    className="px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-[10px] font-bold text-white focus:outline-none focus:border-volt placeholder-white/15"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-black uppercase tracking-wider hover:bg-white/5 transition-all cursor-pointer"
                >
                  {t("dashboard.close")}
                </button>
                <Button
                  type="submit"
                  variant="pink"
                  className="px-5 py-2.5 text-xs font-black uppercase shadow-[0_0_10px_rgba(255,43,214,0.15)]"
                  isLoading={updatingProfile}
                >
                  {t("dashboard.saveProfile")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* 6. GORGEOUS PREMIUM TELEMETRY SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/65 backdrop-blur-md p-4 animate-fade-in">
          <Card glow="volt" className="w-full max-w-md bg-[#101018]/95 border border-white/10 relative p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto scrollbar-hide">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-volt animate-spin-slow" style={{ animationDuration: "12s" }} />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">{t("dashboard.settingsTitle")}</h2>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-mutedgray hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* GPS TELEMETRY PREFERENCES SECTION */}
            <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">

              {/* 0. THEME TOGGLE */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-volt">
                  {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  {t("dashboard.appAppearance")}
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                    theme === "light"
                      ? "bg-amber-400/10 border-amber-400/30"
                      : "bg-volt/10 border-volt/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      theme === "light" ? "bg-amber-400/20" : "bg-volt/20"
                    }`}>
                      {theme === "dark" ? (
                        <Moon className="h-4 w-4 text-volt" />
                      ) : (
                        <Sun className="h-4 w-4 text-amber-400" />
                      )}
                    </div>
                    <div className="text-left">
                      <span className={`text-xs font-black uppercase tracking-wider ${
                        theme === "light" ? "text-amber-400" : "text-volt"
                      }`}>
                        {theme === "dark" ? t("dashboard.darkMode") : t("dashboard.lightMode")}
                      </span>
                      <p className="text-[9px] text-mutedgray mt-0.5">
                        {theme === "dark" ? t("dashboard.switchToLight") : t("dashboard.switchToDark")}
                      </p>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${
                    theme === "light" ? "bg-amber-400" : "bg-white/10"
                  }`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${
                      theme === "light" ? "left-5" : "left-0.5"
                    }`} />
                  </div>
                </button>
              </div>

              <div className="border-t border-white/5" />

              {/* 1. LANGUAGE SELECTOR */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-volt">
                  <Languages className="h-4 w-4" />
                  {t("dashboard.language")}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "pt", label: "Português" },
                    { id: "en", label: "English" },
                    { id: "es", label: "Español" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setLocale(opt.id as "pt" | "en" | "es")}
                      className={`py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                        locale === opt.id
                          ? "bg-volt text-black border-transparent shadow-[0_0_8px_rgba(198,255,0,0.2)]"
                          : "bg-white/3 border-white/5 text-mutedgray hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-mutedgray">
                  {t("dashboard.languageBody")}
                </p>
              </div>

              <div className="border-t border-white/5" />

              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-volt">
                <Sliders className="h-4.5 w-4.5" />
                {t("dashboard.sensors")}
              </div>

              {/* 1. GPS Accuracy limit */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("dashboard.driftFilter")}</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "high", label: t("dashboard.highPrecision") },
                    { id: "standard", label: t("dashboard.standardPrecision") }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setGpsAccuracy(opt.id)}
                      className={`py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                        gpsAccuracy === opt.id
                          ? "bg-volt text-black border-transparent shadow-[0_0_8px_rgba(198,255,0,0.2)]"
                          : "bg-white/3 border-white/5 text-mutedgray hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Smoothing Level alpha */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("dashboard.smoothing")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "0.20", label: t("dashboard.strong") },
                    { id: "0.35", label: t("dashboard.medium") },
                    { id: "off", label: t("dashboard.disabled") }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setGpsSmoothing(opt.id)}
                      className={`py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                        gpsSmoothing === opt.id
                          ? "bg-volt text-black border-transparent shadow-[0_0_8px_rgba(198,255,0,0.2)]"
                          : "bg-white/3 border-white/5 text-mutedgray hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Auto Pause Speed Threshold */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-mutedgray uppercase tracking-wider">{t("dashboard.autoPause")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 0.5, label: t("dashboard.slow") },
                    { val: 1.2, label: t("dashboard.normal") },
                    { val: 2.5, label: t("dashboard.fast") }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setGpsAutoPauseSpeed(opt.val)}
                      className={`py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                        gpsAutoPauseSpeed === opt.val
                          ? "bg-white text-black border-transparent shadow-md"
                          : "bg-white/3 border-white/5 text-mutedgray hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Cell Phone Permissions Center */}
              <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-cyan-400">
                  <Cpu className="h-4 w-4" />
                  {t("dashboard.devicePermissions")}
                </div>
                
                <div className="flex flex-col gap-2 bg-black/40 border border-white/5 rounded-xl p-3 font-sans">
                  {/* GPS Geolocation check */}
                  <div className="flex justify-between items-center text-[10px]">
                    <div className="flex flex-col text-left">
                      <span className="font-black text-white uppercase tracking-wider">{t("dashboard.gpsAccess")}</span>
                      <span className="text-[8px] text-mutedgray uppercase font-semibold leading-normal">
                        {t("dashboard.gpsAccessBody")}
                      </span>
                    </div>
                    {gpsPermission === "granted" ? (
                      <span className="px-2 py-0.5 rounded bg-volt/10 border border-volt/20 text-volt text-[8px] font-black uppercase">
                        {t("dashboard.enabled")}
                      </span>
                    ) : gpsPermission === "denied" ? (
                      <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-black uppercase">
                        {t("dashboard.denied")}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestGPS}
                        className="px-2 py-1 rounded bg-volt text-black text-[8px] font-black uppercase hover:scale-105 active:scale-95 transition-all cursor-pointer font-black"
                      >
                        {t("dashboard.allow")}
                      </button>
                    )}
                  </div>

                  {/* Push/Local Notifications check */}
                  <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-2">
                    <div className="flex flex-col text-left">
                      <span className="font-black text-white uppercase tracking-wider">{t("dashboard.pwaAlerts")}</span>
                      <span className="text-[8px] text-mutedgray uppercase font-semibold leading-normal">
                        {t("dashboard.pwaAlertsBody")}
                      </span>
                    </div>
                    {notifPermission === "granted" ? (
                      <span className="px-2 py-0.5 rounded bg-volt/10 border border-volt/20 text-volt text-[8px] font-black uppercase">
                        {t("dashboard.enabled")}
                      </span>
                    ) : notifPermission === "denied" || notifPermission === "not_supported" ? (
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-mutedgray text-[8px] font-black uppercase">
                        {t("dashboard.unavailable")}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestNotif}
                        className="px-2 py-1 rounded bg-hyperpink text-white text-[8px] font-black uppercase hover:scale-105 active:scale-95 transition-all cursor-pointer font-black"
                      >
                        {t("dashboard.enable")}
                      </button>
                    )}
                  </div>

                  {/* Screen Wake Lock check */}
                  <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-2">
                    <div className="flex flex-col text-left">
                      <span className="font-black text-white uppercase tracking-wider">{t("dashboard.wakeLock")}</span>
                      <span className="text-[8px] text-mutedgray uppercase font-semibold leading-normal">
                        {t("dashboard.wakeLockBody")}
                      </span>
                    </div>
                    {wakeLockStatus === "active" ? (
                      <span className="px-2 py-0.5 rounded bg-volt/10 border border-volt/20 text-volt text-[8px] font-black uppercase">
                        {t("dashboard.enabled")}
                      </span>
                    ) : wakeLockStatus === "supported" ? (
                      <button
                        type="button"
                        onClick={handleRequestWakeLock}
                        className="px-2 py-1 rounded bg-volt text-black text-[8px] font-black uppercase hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        {t("dashboard.enable")}
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-mutedgray text-[8px] font-black uppercase">
                        {t("dashboard.notSupported")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 5. LGPD Privacy & Data Rights */}
              <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-volt">
                  <ShieldCheck className="h-4 w-4" />
                  {t("dashboard.lgpdCenter")}
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-black/40 p-3">
                  <p className="text-[9px] text-mutedgray leading-relaxed">
                    {t("dashboard.lgpdBody")}
                  </p>

                  <button
                    type="button"
                    onClick={handleToggleLgpdConsent}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all ${
                      lgpdConsent
                        ? "bg-volt/10 border-volt/20"
                        : "bg-white/3 border-white/5"
                    }`}
                  >
                    <span>
                      <span className={`block text-[10px] font-black uppercase tracking-wider ${lgpdConsent ? "text-volt" : "text-white"}`}>
                        {lgpdConsent ? t("dashboard.lgpdConsentOn") : t("dashboard.lgpdConsentOff")}
                      </span>
                      <span className="block text-[8px] text-mutedgray mt-0.5">
                        {t("dashboard.lgpdConsentBody")}
                      </span>
                    </span>
                    <span className={`h-5 w-10 rounded-full p-0.5 transition-all ${lgpdConsent ? "bg-volt" : "bg-white/10"}`}>
                      <span className={`block h-4 w-4 rounded-full bg-white transition-all ${lgpdConsent ? "translate-x-5" : ""}`} />
                    </span>
                  </button>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={handleExportLgpdData}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-white hover:border-volt/30 hover:text-volt"
                    >
                      <Download className="h-4 w-4" />
                      {t("dashboard.lgpdExport")}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteLgpdData}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("dashboard.lgpdDelete")}
                    </button>
                  </div>


                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-white/5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/25 bg-red-500/10 text-red-400 text-xs font-black uppercase tracking-wider hover:bg-red-500/20 hover:border-red-500/40 transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  {t("dashboard.logoutTitle")}
                </button>

                <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-black uppercase tracking-wider hover:bg-white/5 transition-all cursor-pointer"
                >
                  {t("dashboard.cancel")}
                </button>
                <Button
                  type="submit"
                  variant="volt"
                  className="px-5 py-2.5 text-xs font-black uppercase shadow-[0_0_10px_rgba(198,255,0,0.15)]"
                >
                  {t("dashboard.saveSettings")}
                </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
