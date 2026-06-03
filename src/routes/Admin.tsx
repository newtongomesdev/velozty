import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, Users, MessageSquare, Compass, Activity, 
  Trash2, Edit, X, Globe, Lock, ArrowLeft,
  Search, ShieldAlert, Flag, Image, Zap
} from "lucide-react";
import { useAuth } from "../components/auth/AuthGuard";
import { useI18n } from "../components/i18n/I18nProvider";
import { useToast } from "../components/ui/Toast";
import { Card } from "../components/ui/Card";
import { UserEditModal } from "../components/ui/UserEditModal";
import {
  adminFetchStats,
  adminFetchUsers,
  adminUpdateUser,
  adminDeleteUser,
  adminFetchAllPosts,
  adminDeletePost,
  adminDeleteComment,
  adminFetchAllRaces,
  adminCancelRace,
  adminFetchReports,
  adminResolveReport,
  adminFetchAllVolts,
  adminDeleteVolt,
  adminFetchAllProfilePhotos,
  adminDeleteProfilePhoto,
  adminFetchRaceParticipants,
  adminKickParticipant,
  type AdminStats,
  type Profile,
  type SocialPost,
  type Race,
  type AppReport,
  type ProfileVolt,
  type ProfilePhoto,
  type RaceParticipant
} from "../lib/supabase";
import { sanitizeImageUrl } from "../lib/sanitize";

type AdminTab = "dashboard" | "users" | "social" | "races" | "reports" | "volts" | "gallery";

const ADMIN_EMAILS = ["egeohub101@gmail.com", "ngfilho@gmail.com"];

const Admin: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats>({ users: 0, races: 0, posts: 0, volts: 0 });
  const [loading, setLoading] = useState(true);

  // Data arrays
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [postsList, setPostsList] = useState<(SocialPost & { display_name: string; username: string })[]>([]);
  const [racesList, setRacesList] = useState<Race[]>([]);
  const [reportsList, setReportsList] = useState<AppReport[]>([]);
  const [voltsList, setVoltsList] = useState<ProfileVolt[]>([]);
  const [photosList, setPhotosList] = useState<ProfilePhoto[]>([]);
  const [raceParticipants, setRaceParticipants] = useState<Record<string, RaceParticipant[]>>({});

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState("");

  // Edit user state
  const [userToEdit, setUserToEdit] = useState<Profile | null>(null);

  // Access validation
  useEffect(() => {
    if (!authLoading) {
      const isAdmin = user?.is_admin || ADMIN_EMAILS.includes(user?.email || "");
      if (!isAdmin) {
        showToast("Acesso Negado: Apenas administradores.", "warning");
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const statsData = await adminFetchStats();
      setStats(statsData);

      if (activeTab === "users") {
        const u = await adminFetchUsers();
        setUsersList(u);
      } else if (activeTab === "social") {
        const p = await adminFetchAllPosts();
        setPostsList(p);
      } else if (activeTab === "races") {
        const r = await adminFetchAllRaces();
        setRacesList(r);
      } else if (activeTab === "reports") {
        const rep = await adminFetchReports();
        setReportsList(rep);
      } else if (activeTab === "volts") {
        const v = await adminFetchAllVolts();
        setVoltsList(v);
      } else if (activeTab === "gallery") {
        const p = await adminFetchAllProfilePhotos();
        setPhotosList(p);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do admin:", err);
      showToast(t("common.loadError"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.is_admin || ADMIN_EMAILS.includes(user.email || ""))) {
      loadData();
    }
  }, [activeTab, user]);

  // Users Handlers
  const handleToggleAdmin = async (target: Profile) => {
    try {
      const nextAdminState = !target.is_admin;
      await adminUpdateUser(target.id, { is_admin: nextAdminState });
      showToast(t("admin.userUpdated"), "success");
      setUsersList(prev => prev.map(u => u.id === target.id ? { ...u, is_admin: nextAdminState } : u));
    } catch {
      showToast(t("common.updateError"), "error");
    }
  };

  const handleToggleVisibility = async (target: Profile) => {
    try {
      const nextVisibility = !target.is_public;
      await adminUpdateUser(target.id, { is_public: nextVisibility });
      showToast(t("admin.userUpdated"), "success");
      setUsersList(prev => prev.map(u => u.id === target.id ? { ...u, is_public: nextVisibility } : u));
    } catch {
      showToast(t("common.updateError"), "error");
    }
  };

  const handleStartEdit = (target: Profile) => {
    setUserToEdit(target);
  };

  const handleSaveUser = async (targetId: string, data: Partial<Profile>) => {
    if (!data.display_name?.trim()) return;
    try {
      await adminUpdateUser(targetId, data);
      showToast(t("admin.userUpdated"), "success");
      setUsersList(prev => prev.map(u => u.id === targetId ? { ...u, ...data } : u));
    } catch {
      showToast(t("common.updateError"), "error");
      throw new Error("Failed");
    }
  };

  const handleBanUser = async (targetId: string) => {
    if (targetId === user?.id) {
      showToast("Você não pode se banir!", "warning");
      return;
    }
    if (!window.confirm(t("admin.confirmBan"))) return;

    try {
      await adminDeleteUser(targetId);
      showToast(t("admin.userDeleted"), "success");
      setUsersList(prev => prev.filter(u => u.id !== targetId));
    } catch {
      showToast(t("common.deleteError"), "error");
    }
  };

  // Social Moderation Handlers
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm(t("admin.confirmDeletePost"))) return;
    try {
      await adminDeletePost(postId);
      showToast(t("admin.postDeleted"), "success");
      setPostsList(prev => prev.filter(p => p.id !== postId));
    } catch {
      showToast(t("common.deleteError"), "error");
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await adminDeleteComment(commentId);
      showToast(t("admin.commentDeleted"), "success");
      setPostsList(prev => prev.map(post => {
        if (post.id === postId) {
          const filtered = (post.comments || []).filter(c => c.id !== commentId);
          return {
            ...post,
            comments: filtered,
            comments_count: filtered.length
          };
        }
        return post;
      }));
    } catch {
      showToast(t("common.deleteError"), "error");
    }
  };

  // Races Moderation Handlers
  const handleCancelRace = async (raceId: string) => {
    if (!window.confirm(t("admin.confirmCancelRace"))) return;
    try {
      await adminCancelRace(raceId);
      showToast(t("admin.raceCancelled"), "success");
      setRacesList(prev => prev.map(r => r.id === raceId ? { ...r, status: "cancelled" } : r));
    } catch {
      showToast(t("common.updateError"), "error");
    }
  };

  const handleViewParticipants = async (raceId: string) => {
    if (raceParticipants[raceId]) {
      setRaceParticipants(prev => {
        const next = { ...prev };
        delete next[raceId];
        return next;
      });
      return;
    }
    try {
      const participants = await adminFetchRaceParticipants(raceId);
      setRaceParticipants(prev => ({ ...prev, [raceId]: participants }));
    } catch {
      showToast("Erro ao carregar participantes", "error");
    }
  };

  const handleKickParticipant = async (raceId: string, participantId: string) => {
    if (!window.confirm("Expulsar participante?")) return;
    try {
      await adminKickParticipant(raceId, participantId);
      showToast("Participante expulso", "success");
      setRaceParticipants(prev => ({
        ...prev,
        [raceId]: prev[raceId].filter(p => p.user_id !== participantId)
      }));
    } catch {
      showToast(t("common.deleteError"), "error");
    }
  };

  const handleResolveReport = async (reportId: string, resolution: "act" | "dismiss") => {
    try {
      await adminResolveReport(reportId, resolution);
      showToast(t("admin.userUpdated") || "Report updated", "success");
      const newStatus = resolution === "dismiss" ? "dismissed" : "acted";
      setReportsList(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus, resolved_at: new Date().toISOString() } : r));
    } catch {
      showToast(t("common.updateError"), "error");
    }
  };

  const handleDeleteVolt = async (voltId: string) => {
    if (!window.confirm("Remover este Volt permanentemente?")) return;
    try {
      await adminDeleteVolt(voltId);
      showToast("Volt removido", "success");
      setVoltsList(prev => prev.filter(v => v.id !== voltId));
    } catch {
      showToast(t("common.deleteError"), "error");
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!window.confirm("Remover foto de perfil?")) return;
    try {
      await adminDeleteProfilePhoto(photoId);
      showToast("Foto removida", "success");
      setPhotosList(prev => prev.filter(p => p.id !== photoId));
    } catch {
      showToast(t("common.deleteError"), "error");
    }
  };

  const filteredUsers = usersList.filter(u => 
    [u.display_name, u.email, u.username].some(val => 
      val?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const filteredPosts = postsList.filter(p => 
    p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRaces = racesList.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReports = reportsList.filter(r => 
    r.target_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVolts = voltsList.filter(v =>
    v.caption?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPhotos = photosList;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-darkbg text-xs font-black uppercase tracking-widest text-mutedgray">
        {t("common.loading")}
      </div>
    );
  }

  const isAdmin = user?.is_admin || ADMIN_EMAILS.includes(user?.email || "");
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-darkbg text-white p-4 md:p-8">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        
        {/* Header Block */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/80 hover:bg-white/10 active:scale-95 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Shield className="h-6 w-6 text-volt animate-pulse" />
                {t("admin.panelTitle")}
              </h1>
              <p className="text-[10px] md:text-xs font-black tracking-widest text-volt uppercase">
                {t("admin.panelSubtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Tab Selector (Hamburger Menu) */}
        <div className="sm:hidden relative w-full">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/5 text-xs font-black uppercase tracking-wider hover:bg-white/10"
          >
            <span className="flex items-center gap-2">
              {activeTab === "dashboard" && <Activity className="h-4 w-4 text-volt" />}
              {activeTab === "users" && <Users className="h-4 w-4 text-volt" />}
              {activeTab === "social" && <MessageSquare className="h-4 w-4 text-volt" />}
              {activeTab === "races" && <ShieldAlert className="h-4 w-4 text-volt" />}
              {activeTab === "reports" && <Flag className="h-4 w-4 text-volt" />}
              {activeTab === "volts" && <Zap className="h-4 w-4 text-volt" />}
              {activeTab === "gallery" && <Image className="h-4 w-4 text-volt" />}
              <span className="text-white dark:text-white">
                {activeTab === "dashboard" ? t("admin.tabDashboard") :
                 activeTab === "users" ? t("admin.tabUsers") :
                 activeTab === "social" ? t("admin.tabSocial") :
                 activeTab === "races" ? t("admin.tabRaces") :
                 activeTab === "reports" ? (t("report.adminTab") || "Denúncias") :
                 activeTab === "volts" ? "Volts" : "Galeria"}
              </span>
            </span>
            <span className="text-sm font-bold text-volt">☰</span>
          </button>
          {menuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-[99] rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 p-2 shadow-2xl flex flex-col gap-1">
              <button
                onClick={() => { setActiveTab("dashboard"); setMenuOpen(false); setSearchQuery(""); }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider w-full ${activeTab === "dashboard" ? "bg-volt text-black" : "text-mutedgray hover:bg-zinc-100 dark:hover:bg-white/5"}`}
              >
                <Activity className="h-4 w-4" />
                {t("admin.tabDashboard")}
              </button>
              <button
                onClick={() => { setActiveTab("users"); setMenuOpen(false); setSearchQuery(""); }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider w-full ${activeTab === "users" ? "bg-volt text-black" : "text-mutedgray hover:bg-zinc-100 dark:hover:bg-white/5"}`}
              >
                <Users className="h-4 w-4" />
                {t("admin.tabUsers")}
              </button>
              <button
                onClick={() => { setActiveTab("social"); setMenuOpen(false); setSearchQuery(""); }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider w-full ${activeTab === "social" ? "bg-volt text-black" : "text-mutedgray hover:bg-zinc-100 dark:hover:bg-white/5"}`}
              >
                <MessageSquare className="h-4 w-4" />
                {t("admin.tabSocial")}
              </button>
              <button
                onClick={() => { setActiveTab("races"); setMenuOpen(false); setSearchQuery(""); }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider w-full ${activeTab === "races" ? "bg-volt text-black" : "text-mutedgray hover:bg-zinc-100 dark:hover:bg-white/5"}`}
              >
                <ShieldAlert className="h-4 w-4" />
                {t("admin.tabRaces")}
              </button>
              <button
                onClick={() => { setActiveTab("reports"); setMenuOpen(false); setSearchQuery(""); }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider w-full ${activeTab === "reports" ? "bg-volt text-black" : "text-mutedgray hover:bg-zinc-100 dark:hover:bg-white/5"}`}
              >
                <Flag className="h-4 w-4" />
                {t("report.adminTab") || "Denúncias"}
              </button>
              <button
                onClick={() => { setActiveTab("volts"); setMenuOpen(false); setSearchQuery(""); }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider w-full ${activeTab === "volts" ? "bg-volt text-black" : "text-mutedgray hover:bg-zinc-100 dark:hover:bg-white/5"}`}
              >
                <Zap className="h-4 w-4" />
                Volts
              </button>
              <button
                onClick={() => { setActiveTab("gallery"); setMenuOpen(false); setSearchQuery(""); }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider w-full ${activeTab === "gallery" ? "bg-volt text-black" : "text-mutedgray hover:bg-zinc-100 dark:hover:bg-white/5"}`}
              >
                <Image className="h-4 w-4" />
                Galeria
              </button>
            </div>
          )}
        </div>

        {/* Desktop Tab Selection */}
        <div className="hidden sm:flex overflow-x-auto gap-1 border-b border-zinc-200 dark:border-white/10 w-full no-scrollbar touch-pan-x scroll-smooth">
          <button
            onClick={() => { setActiveTab("dashboard"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap -mb-px border-b-2 ${
              activeTab === "dashboard"
                ? "text-volt border-volt"
                : "text-mutedgray hover:text-zinc-900 dark:hover:text-white border-transparent"
            }`}
          >
            <Activity className="h-4 w-4" />
            {t("admin.tabDashboard")}
          </button>
          <button
            onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap -mb-px border-b-2 ${
              activeTab === "users"
                ? "text-volt border-volt"
                : "text-mutedgray hover:text-zinc-900 dark:hover:text-white border-transparent"
            }`}
          >
            <Users className="h-4 w-4" />
            {t("admin.tabUsers")}
          </button>
          <button
            onClick={() => { setActiveTab("social"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap -mb-px border-b-2 ${
              activeTab === "social"
                ? "text-volt border-volt"
                : "text-mutedgray hover:text-zinc-900 dark:hover:text-white border-transparent"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            {t("admin.tabSocial")}
          </button>
          <button
            onClick={() => { setActiveTab("races"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap -mb-px border-b-2 ${
              activeTab === "races"
                ? "text-volt border-volt"
                : "text-mutedgray hover:text-zinc-900 dark:hover:text-white border-transparent"
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            {t("admin.tabRaces")}
          </button>
          <button
            onClick={() => { setActiveTab("reports"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap -mb-px border-b-2 ${
              activeTab === "reports"
                ? "text-volt border-volt"
                : "text-mutedgray hover:text-zinc-900 dark:hover:text-white border-transparent"
            }`}
          >
            <Flag className="h-4 w-4" />
            {t("report.adminTab") || "Denúncias"}
          </button>
          <button
            onClick={() => { setActiveTab("volts"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap -mb-px border-b-2 ${
              activeTab === "volts"
                ? "text-volt border-volt"
                : "text-mutedgray hover:text-zinc-900 dark:hover:text-white border-transparent"
            }`}
          >
            <Zap className="h-4 w-4" />
            Volts
          </button>
          <button
            onClick={() => { setActiveTab("gallery"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap -mb-px border-b-2 ${
              activeTab === "gallery"
                ? "text-volt border-volt"
                : "text-mutedgray hover:text-zinc-900 dark:hover:text-white border-transparent"
            }`}
          >
            <Image className="h-4 w-4" />
            Galeria
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "dashboard" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <h2 className="text-sm font-black uppercase tracking-widest text-mutedgray">
              {t("admin.statsTitle")}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card glow="volt" className="flex flex-col items-center justify-center p-6 text-center">
                <Users className="h-8 w-8 text-volt mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest text-mutedgray">{t("admin.totalUsers")}</span>
                <span className="text-3xl font-black mt-1 font-mono text-white">{stats.users}</span>
              </Card>
              <Card glow="pink" className="flex flex-col items-center justify-center p-6 text-center">
                <Activity className="h-8 w-8 text-hyperpink mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest text-mutedgray">{t("admin.totalRaces")}</span>
                <span className="text-3xl font-black mt-1 font-mono text-white">{stats.races}</span>
              </Card>
              <Card glow="volt" className="flex flex-col items-center justify-center p-6 text-center">
                <Compass className="h-8 w-8 text-volt mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest text-mutedgray">{t("admin.totalVolts") || "Total Volts"}</span>
                <span className="text-3xl font-black mt-1 font-mono text-white">{stats.volts}</span>
              </Card>
              <Card glow="pink" className="flex flex-col items-center justify-center p-6 text-center">
                <MessageSquare className="h-8 w-8 text-hyperpink mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest text-mutedgray">{t("admin.totalPosts")}</span>
                <span className="text-3xl font-black mt-1 font-mono text-white">{stats.posts}</span>
              </Card>
            </div>
          </div>
        )}

        {/* Filter Input for other tabs */}
        {activeTab !== "dashboard" && (
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-mutedgray" />
            <input
              type="text"
              placeholder={
                activeTab === "users" ? t("admin.searchUsers") : 
                activeTab === "social" ? t("admin.searchPosts") :
                activeTab === "races" ? t("admin.searchRaces") :
                activeTab === "reports" ? "Buscar denúncias..." :
                activeTab === "volts" ? "Buscar Volts..." : "Buscar..."
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-xs font-semibold text-white placeholder-mutedgray focus:border-volt focus:outline-none focus:ring-1 focus:ring-volt transition-all"
            />
          </div>
        )}

        {/* Loading / Empty States */}
        {loading && activeTab !== "dashboard" ? (
          <div className="py-20 text-center text-xs font-black uppercase tracking-widest text-mutedgray">
            {t("common.loading")}
          </div>
        ) : (
          <>
            {/* Users Tab */}
            {activeTab === "users" && (
              <Card glow="volt" className="w-full p-4 border border-white/5 bg-zinc-900/40">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-volt">{t("admin.usersList")}</h3>
                  <span className="text-[10px] font-mono text-mutedgray">{filteredUsers.length} pilotos</span>
                </div>
                <div className="flex flex-col gap-3 min-w-0">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 gap-3 transition-colors min-w-0 w-full text-xs">
                      {/* Left: Avatar + Info */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0">
                          {u.avatar_url ? (
                            <img src={sanitizeImageUrl(u.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-black uppercase">{u.display_name.slice(0,2)}</span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-white font-bold leading-tight truncate block text-sm">{u.display_name}</span>
                          <span className="text-[10px] text-mutedgray font-mono truncate block">
                            @{u.username} • <span className="opacity-70">{u.email || "n/a"}</span>
                          </span>
                        </div>
                      </div>

                      {/* Right: Compact Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Admin Badge/Button */}
                        <button
                          onClick={() => handleToggleAdmin(u)}
                          className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-colors ${u.is_admin ? "bg-volt/20 text-volt border border-volt/30" : "bg-white/5 text-mutedgray border border-transparent"}`}
                        >
                          {u.is_admin ? "ADM" : "USR"}
                        </button>
                        
                        {/* Visibility Badge/Button */}
                        <button
                          onClick={() => handleToggleVisibility(u)}
                          className="p-1 rounded text-mutedgray hover:text-white transition-colors bg-white/5"
                          title={u.is_public ? t("admin.visibilityPublic") : t("admin.visibilityPrivate")}
                        >
                          {u.is_public ? (
                            <Globe className="h-3.5 w-3.5 text-volt" />
                          ) : (
                            <Lock className="h-3.5 w-3.5 text-hyperpink" />
                          )}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleStartEdit(u)}
                          className="p-1 bg-white/5 rounded text-mutedgray hover:text-white transition-colors"
                          title={t("admin.actionEdit")}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        {/* Ban Button */}
                        <button
                          onClick={() => handleBanUser(u.id)}
                          className="p-1 bg-rose-500/10 rounded text-rose-500 hover:text-white hover:bg-rose-500 transition-colors"
                          title={t("admin.actionDelete")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Social Feed Tab */}
            {activeTab === "social" && (
              <div className="flex flex-col gap-4 animate-fade-in min-w-0 w-full">
                <h3 className="text-xs font-black uppercase tracking-widest text-hyperpink">{t("admin.socialPosts")}</h3>
                <div className="grid gap-4 min-w-0 w-full">
                  {filteredPosts.map(post => (
                    <Card key={post.id} glow="pink" className="border border-white/5 bg-zinc-900/40 p-4 flex flex-col gap-3 min-w-0 w-full">
                      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-[10px] font-black uppercase shrink-0">
                            {post.avatar_url ? (
                              <img src={sanitizeImageUrl(post.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span>{post.display_name.slice(0,2)}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white block truncate">{post.display_name}</span>
                            <span className="block text-[8px] font-mono text-mutedgray truncate">@{post.username}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="flex items-center gap-1 rounded-xl bg-hyperpink/10 border border-hyperpink/20 p-2 sm:px-3 sm:py-1.5 text-[10px] font-black uppercase tracking-wider text-hyperpink hover:bg-hyperpink hover:text-white transition-all shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{t("admin.actionDeletePost")}</span>
                        </button>
                      </div>

                      {/* Post body */}
                      <p className="text-xs font-semibold leading-relaxed text-white/95 break-words">{post.content}</p>
                      {post.image_url && (
                        <div className="max-w-xs overflow-hidden rounded-xl border border-white/10">
                          <img src={sanitizeImageUrl(post.image_url)} alt="Media" className="w-full object-contain max-h-48" />
                        </div>
                      )}

                      {/* Comments section */}
                      {(post.comments || []).length > 0 && (
                        <div className="mt-2 bg-black/30 rounded-xl p-3 border border-white/5 flex flex-col gap-2 min-w-0">
                          <span className="text-[9px] font-black uppercase tracking-wider text-mutedgray">Comentários</span>
                          <div className="flex flex-col gap-2 divide-y divide-white/5 min-w-0">
                            {(post.comments || []).map(c => (
                              <div key={c.id} className="pt-2 flex items-start justify-between gap-4 min-w-0">
                                <div className="flex gap-2 min-w-0 flex-1">
                                  <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-[8px] font-black uppercase shrink-0">
                                    {c.avatar_url ? (
                                      <img src={sanitizeImageUrl(c.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{c.display_name.slice(0,2)}</span>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-bold text-white block truncate">{c.display_name}</span>
                                    <p className="text-[11px] text-white/80 break-words">{c.content}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteComment(post.id, c.id)}
                                  className="text-mutedgray hover:text-hyperpink transition-colors p-1 shrink-0"
                                  title="Deletar comentário"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Races Monitor Tab */}
            {activeTab === "races" && (
              <Card glow="volt" className="w-full p-4 border border-white/5 bg-zinc-900/40">
                <h3 className="text-xs font-black uppercase tracking-widest text-volt mb-4">{t("admin.racesMonitor")}</h3>
                <div className="flex flex-col gap-3 min-w-0">
                  {filteredRaces.map(r => (
                    <div key={r.id} className="flex flex-col bg-zinc-800/30 rounded-xl border border-white/5 overflow-hidden min-w-0">
                      <div className="flex flex-col md:flex-row md:items-center justify-between p-3 gap-3 min-w-0">
                        <div className="flex flex-col min-w-0">
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <span className="font-bold text-white text-sm truncate max-w-[200px] sm:max-w-[300px]">{r.name}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shrink-0 ${
                                r.status === "active" ? "bg-volt/20 text-volt border border-volt/30" :
                                r.status === "lobby" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" :
                                r.status === "finished" ? "bg-emerald-550/20 text-emerald-400 border border-emerald-550/30" :
                                "bg-white/5 text-mutedgray"
                              }`}>
                                {r.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-mutedgray mt-1 truncate">{r.city || "Online"}, {r.state} • <span className="uppercase">{r.modality}</span></span>
                          <span className="text-[9px] font-mono text-white/40 mt-1 truncate">Host: {r.host_user_id}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3 md:mt-0 pt-3 md:pt-0 border-t border-white/5 md:border-none w-full md:w-auto shrink-0">
                          <button
                            onClick={() => handleViewParticipants(r.id)}
                            className="flex-1 md:flex-none justify-center flex px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-wider transition-all"
                          >
                            Pilotos
                          </button>
                          {r.status !== "finished" && r.status !== "cancelled" && (
                            <button
                              onClick={() => handleCancelRace(r.id)}
                              className="flex-1 md:flex-none justify-center flex px-3 py-2 rounded-lg bg-hyperpink/10 border border-hyperpink/20 hover:bg-hyperpink hover:text-white text-hyperpink text-[10px] font-black uppercase tracking-wider transition-all"
                            >
                              {t("admin.actionCancel")}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Participants section */}
                      {raceParticipants[r.id] && (
                        <div className="bg-black/40 p-3 border-t border-white/5 min-w-0">
                          <h4 className="text-[10px] font-black uppercase text-volt mb-3">Participantes ({raceParticipants[r.id].length})</h4>
                          {raceParticipants[r.id].length === 0 ? (
                            <span className="text-[10px] text-mutedgray">Nenhum participante.</span>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 min-w-0">
                              {raceParticipants[r.id].map(p => (
                                <div key={p.id} className="flex items-center justify-between bg-zinc-800/80 p-2.5 rounded-lg border border-white/5 min-w-0 gap-2">
                                  <div className="text-[10px] text-white/80 font-mono truncate min-w-0 flex-1">
                                    {p.user_id}
                                  </div>
                                  <button 
                                    onClick={() => handleKickParticipant(r.id, p.user_id)}
                                    className="p-1.5 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors shrink-0"
                                    title="Expulsar da corrida"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Reports Tab */}
            {activeTab === "reports" && (
              <Card glow="pink" className="w-full p-4 border border-white/5 bg-zinc-900/40">
                <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 mb-4">{t("report.adminTab") || "Denúncias"}</h3>
                <div className="flex flex-col gap-3 min-w-0">
                  {filteredReports.map(r => (
                    <div key={r.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-zinc-800/30 rounded-xl border border-white/5 gap-3 min-w-0">
                      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shrink-0 ${
                              r.status === "pending" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                              r.status === "acted" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                              "bg-white/5 text-mutedgray"
                            }`}>
                              {r.status}
                          </span>
                          <span className="font-bold text-white text-sm break-words flex-1 min-w-0">{r.reason}</span>
                        </div>
                        <span className="text-[10px] uppercase font-mono text-volt bg-volt/10 w-fit px-2 py-0.5 rounded border border-volt/20 truncate block max-w-full">
                          {r.target_type}: {r.target_id}
                        </span>
                        <span className="font-mono text-[9px] text-mutedgray mt-1 block">
                          {new Date(r.created_at).toLocaleString()}
                        </span>
                      </div>

                      {r.status === "pending" && (
                        <div className="flex items-center gap-2 mt-3 md:mt-0 pt-3 md:pt-0 border-t border-white/5 md:border-none w-full md:w-auto shrink-0">
                          <button
                            onClick={() => handleResolveReport(r.id, "act")}
                            className="flex-1 md:flex-none justify-center px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-500 text-[10px] font-black uppercase tracking-wider transition-all"
                          >
                            {t("report.adminAct") || "Punir"}
                          </button>
                          <button
                            onClick={() => handleResolveReport(r.id, "dismiss")}
                            className="flex-1 md:flex-none justify-center px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-wider transition-all"
                          >
                            {t("report.adminDismiss") || "Ignorar"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Volts Tab */}
            {activeTab === "volts" && (
              <Card glow="volt" className="p-4 border border-white/5 bg-zinc-900/40">
                <h3 className="text-xs font-black uppercase tracking-widest text-volt mb-4">Moderação de Volts</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {filteredVolts.map(v => (
                    <div key={v.id} className="relative aspect-[9/16] rounded-xl overflow-hidden group">
                      <img src={sanitizeImageUrl(v.image_url)} alt="Volt" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                        <div className="text-[9px] text-white font-bold">{new Date(v.created_at).toLocaleString()}</div>
                        <div>
                          <p className="text-[10px] text-white mb-2 line-clamp-3">{v.caption}</p>
                          <button
                            onClick={() => handleDeleteVolt(v.id)}
                            className="w-full py-1.5 bg-rose-500/20 text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white rounded text-[9px] font-black uppercase tracking-widest transition-colors"
                          >
                            Deletar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Gallery Tab */}
            {activeTab === "gallery" && (
              <Card glow="volt" className="p-4 border border-white/5 bg-zinc-900/40">
                <h3 className="text-xs font-black uppercase tracking-widest text-volt mb-4">Moderação de Fotos de Perfil</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {filteredPhotos.map(p => (
                    <div key={p.id} className="relative aspect-square rounded-full overflow-hidden group border-2 border-white/10">
                      <img src={sanitizeImageUrl(p.image_url)} alt="Profile" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                        <button
                          onClick={() => handleDeletePhoto(p.id)}
                          className="p-2 bg-rose-500 rounded-full text-white hover:bg-rose-600 transition-colors"
                          title="Remover Foto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

      </main>

      {userToEdit && (
        <UserEditModal
          user={userToEdit}
          onClose={() => setUserToEdit(null)}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
};

export default Admin;
