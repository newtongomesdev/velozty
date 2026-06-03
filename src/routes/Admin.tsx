import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, Users, MessageSquare, Compass, Activity, 
  Trash2, Edit, X, Globe, Lock, ArrowLeft,
  Search, Check, ShieldAlert
} from "lucide-react";
import { useAuth } from "../components/auth/AuthGuard";
import { useI18n } from "../components/i18n/I18nProvider";
import { useToast } from "../components/ui/Toast";
import { Card } from "../components/ui/Card";
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
  type AdminStats,
  type Profile,
  type SocialPost,
  type Race
} from "../lib/supabase";
import { sanitizeImageUrl } from "../lib/sanitize";

type AdminTab = "dashboard" | "users" | "social" | "races";

const ADMIN_EMAIL = "egeohub101@gmail.com";

const Admin: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [stats, setStats] = useState<AdminStats>({ users: 0, races: 0, posts: 0, volts: 0 });
  const [loading, setLoading] = useState(true);

  // Data arrays
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [postsList, setPostsList] = useState<(SocialPost & { display_name: string; username: string })[]>([]);
  const [racesList, setRacesList] = useState<Race[]>([]);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState("");

  // Edit user state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editWebsite, setEditWebsite] = useState("");

  // Access validation
  useEffect(() => {
    if (!authLoading) {
      const isAdmin = user?.is_admin || user?.email === ADMIN_EMAIL;
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
      }
    } catch (err) {
      console.error("Erro ao carregar dados do admin:", err);
      showToast(t("common.loadError"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.is_admin || user.email === ADMIN_EMAIL)) {
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
    setEditingUserId(target.id);
    setEditDisplayName(target.display_name || "");
    setEditCity(target.city || "");
    setEditWebsite(target.website || "");
  };

  const handleSaveUser = async (targetId: string) => {
    if (!editDisplayName.trim()) return;
    try {
      await adminUpdateUser(targetId, {
        display_name: editDisplayName.trim(),
        city: editCity.trim(),
        website: editWebsite.trim()
      });
      showToast(t("admin.userUpdated"), "success");
      setUsersList(prev => prev.map(u => u.id === targetId ? { 
        ...u, 
        display_name: editDisplayName.trim(), 
        city: editCity.trim(), 
        website: editWebsite.trim() 
      } : u));
      setEditingUserId(null);
    } catch {
      showToast(t("common.updateError"), "error");
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

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-darkbg text-xs font-black uppercase tracking-widest text-mutedgray">
        {t("common.loading")}
      </div>
    );
  }

  const isAdmin = user?.is_admin || user?.email === ADMIN_EMAIL;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-darkbg text-white p-4 md:p-8">
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

        {/* Tab Selection */}
        <div className="flex overflow-x-auto gap-2 bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 scrollbar-hide">
          <button
            onClick={() => { setActiveTab("dashboard"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "dashboard" ? "bg-volt text-black shadow-[0_0_12px_rgba(198,255,0,0.3)]" : "text-mutedgray hover:text-white hover:bg-white/5"}`}
          >
            <Activity className="h-4 w-4" />
            {t("admin.tabDashboard")}
          </button>
          <button
            onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "users" ? "bg-volt text-black shadow-[0_0_12px_rgba(198,255,0,0.3)]" : "text-mutedgray hover:text-white hover:bg-white/5"}`}
          >
            <Users className="h-4 w-4" />
            {t("admin.tabUsers")}
          </button>
          <button
            onClick={() => { setActiveTab("social"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "social" ? "bg-volt text-black shadow-[0_0_12px_rgba(198,255,0,0.3)]" : "text-mutedgray hover:text-white hover:bg-white/5"}`}
          >
            <MessageSquare className="h-4 w-4" />
            {t("admin.tabSocial")}
          </button>
          <button
            onClick={() => { setActiveTab("races"); setSearchQuery(""); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === "races" ? "bg-volt text-black shadow-[0_0_12px_rgba(198,255,0,0.3)]" : "text-mutedgray hover:text-white hover:bg-white/5"}`}
          >
            <ShieldAlert className="h-4 w-4" />
            {t("admin.tabRaces")}
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
                activeTab === "social" ? t("admin.searchPosts") : t("admin.searchRaces")
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
              <Card glow="volt" className="overflow-x-auto p-4 border border-white/5 bg-zinc-900/40">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-volt">{t("admin.usersList")}</h3>
                  <span className="text-[10px] font-mono text-mutedgray">{filteredUsers.length} pilotos</span>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-mutedgray font-black uppercase tracking-wider text-[10px]">
                      <th className="pb-3 pr-4">Avatar</th>
                      <th className="pb-3 pr-4">{t("admin.colName")}</th>
                      <th className="pb-3 pr-4">{t("admin.colEmail")}</th>
                      <th className="pb-3 pr-4">{t("admin.colRole")}</th>
                      <th className="pb-3 pr-4">{t("admin.colVisibility")}</th>
                      <th className="pb-3 text-right">{t("admin.colActions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-800 border border-white/10 flex items-center justify-center">
                            {u.avatar_url ? (
                              <img src={sanitizeImageUrl(u.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-black uppercase">{u.display_name.slice(0,2)}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-semibold">
                          {editingUserId === u.id ? (
                            <div className="flex flex-col gap-1.5">
                              <input 
                                type="text" 
                                value={editDisplayName} 
                                onChange={e => setEditDisplayName(e.target.value)} 
                                className="bg-zinc-850 border border-white/10 rounded px-2 py-1 text-xs text-white max-w-[150px]"
                              />
                              <input 
                                type="text" 
                                placeholder="Cidade" 
                                value={editCity} 
                                onChange={e => setEditCity(e.target.value)} 
                                className="bg-zinc-850 border border-white/10 rounded px-2 py-1 text-[10px] text-white max-w-[150px]"
                              />
                              <input 
                                type="text" 
                                placeholder="Website" 
                                value={editWebsite} 
                                onChange={e => setEditWebsite(e.target.value)} 
                                className="bg-zinc-850 border border-white/10 rounded px-2 py-1 text-[10px] text-white max-w-[150px]"
                              />
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold text-white">{u.display_name}</p>
                              <p className="text-[10px] font-mono text-volt">@{u.username}</p>
                              {u.city && <p className="text-[9px] text-mutedgray">{u.city}, {u.state}</p>}
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-4 font-mono text-mutedgray text-[10px]">{u.email || "n/a"}</td>
                        <td className="py-3 pr-4">
                          <button
                            onClick={() => handleToggleAdmin(u)}
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-colors ${u.is_admin ? "bg-volt/20 text-volt border border-volt/30" : "bg-white/5 text-mutedgray hover:bg-white/10"}`}
                          >
                            {u.is_admin ? t("admin.roleAdmin") : t("admin.roleUser")}
                          </button>
                        </td>
                        <td className="py-3 pr-4">
                          <button
                            onClick={() => handleToggleVisibility(u)}
                            className="flex items-center gap-1 text-[10px] text-mutedgray hover:text-white transition-colors"
                          >
                            {u.is_public ? (
                              <><Globe className="h-3.5 w-3.5 text-volt" /> {t("admin.visibilityPublic")}</>
                            ) : (
                              <><Lock className="h-3.5 w-3.5 text-hyperpink" /> {t("admin.visibilityPrivate")}</>
                            )}
                          </button>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {editingUserId === u.id ? (
                              <>
                                <button
                                  onClick={() => handleSaveUser(u.id)}
                                  className="p-1.5 rounded bg-volt text-black hover:bg-volt-light"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingUserId(null)}
                                  className="p-1.5 rounded bg-zinc-800 text-white hover:bg-zinc-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartEdit(u)}
                                  className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/80 hover:text-white"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleBanUser(u.id)}
                                  className="p-1.5 rounded bg-hyperpink/10 hover:bg-hyperpink/20 text-hyperpink"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}

            {/* Social Feed Tab */}
            {activeTab === "social" && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <h3 className="text-xs font-black uppercase tracking-widest text-hyperpink">{t("admin.socialPosts")}</h3>
                <div className="grid gap-4">
                  {filteredPosts.map(post => (
                    <Card key={post.id} glow="pink" className="border border-white/5 bg-zinc-900/40 p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-[10px] font-black uppercase">
                            {post.avatar_url ? (
                              <img src={sanitizeImageUrl(post.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span>{post.display_name.slice(0,2)}</span>
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white">{post.display_name}</span>
                            <span className="block text-[8px] font-mono text-mutedgray">@{post.username}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="flex items-center gap-1 rounded-xl bg-hyperpink/10 border border-hyperpink/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-hyperpink hover:bg-hyperpink hover:text-white transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t("admin.actionDeletePost")}
                        </button>
                      </div>

                      {/* Post body */}
                      <p className="text-xs font-semibold leading-relaxed text-white/95">{post.content}</p>
                      {post.image_url && (
                        <div className="max-w-xs overflow-hidden rounded-xl border border-white/10">
                          <img src={sanitizeImageUrl(post.image_url)} alt="Media" className="w-full object-contain max-h-48" />
                        </div>
                      )}

                      {/* Comments section */}
                      {(post.comments || []).length > 0 && (
                        <div className="mt-2 bg-black/30 rounded-xl p-3 border border-white/5 flex flex-col gap-2">
                          <span className="text-[9px] font-black uppercase tracking-wider text-mutedgray">Comentários</span>
                          <div className="flex flex-col gap-2 divide-y divide-white/5">
                            {(post.comments || []).map(c => (
                              <div key={c.id} className="pt-2 flex items-start justify-between gap-4">
                                <div className="flex gap-2">
                                  <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-[8px] font-black uppercase shrink-0">
                                    {c.avatar_url ? (
                                      <img src={sanitizeImageUrl(c.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                      <span>{c.display_name.slice(0,2)}</span>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-white">{c.display_name}</span>
                                    <p className="text-[11px] text-white/80">{c.content}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteComment(post.id, c.id)}
                                  className="text-mutedgray hover:text-hyperpink transition-colors p-1"
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
              <Card glow="volt" className="overflow-x-auto p-4 border border-white/5 bg-zinc-900/40">
                <h3 className="text-xs font-black uppercase tracking-widest text-volt mb-4">{t("admin.racesMonitor")}</h3>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-mutedgray font-black uppercase tracking-wider text-[10px]">
                      <th className="pb-3 pr-4">{t("admin.colRaceName")}</th>
                      <th className="pb-3 pr-4">{t("admin.colHost")}</th>
                      <th className="pb-3 pr-4">{t("admin.colStatus")}</th>
                      <th className="pb-3 pr-4">{t("admin.colSport")}</th>
                      <th className="pb-3 text-right">Controle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-semibold">
                    {filteredRaces.map(r => (
                      <tr key={r.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="font-bold text-white">{r.name}</p>
                          <p className="text-[10px] text-mutedgray">{r.city || "Online"}, {r.state}</p>
                        </td>
                        <td className="py-3 pr-4 font-mono text-[10px] text-mutedgray">{r.host_user_id}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                            r.status === "active" ? "bg-volt/20 text-volt border border-volt/30" :
                            r.status === "lobby" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" :
                            r.status === "finished" ? "bg-emerald-550/20 text-emerald-400 border border-emerald-550/30" :
                            "bg-white/5 text-mutedgray"
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 uppercase text-[10px] text-mutedgray">{r.modality}</td>
                        <td className="py-3 text-right">
                          {r.status !== "finished" && r.status !== "cancelled" && (
                            <button
                              onClick={() => handleCancelRace(r.id)}
                              className="px-2 py-1 rounded bg-hyperpink/10 border border-hyperpink/20 hover:bg-hyperpink hover:text-white text-hyperpink text-[9px] font-black uppercase tracking-wider transition-all"
                            >
                              {t("admin.actionCancel")}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </>
        )}

      </main>
    </div>
  );
};

export default Admin;
