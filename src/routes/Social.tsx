import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Heart, ImagePlus, MessageCircle, RefreshCw, Search, Send, UserMinus, UserPlus, Users, X } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardTitle } from "../components/ui/Card";
import { useToast } from "../components/ui/Toast";
import { useI18n } from "../components/i18n/I18nProvider";
import { useAuth } from "../components/auth/AuthGuard";
import {
  createSocialPost,
  createSocialComment,
  fetchSocialFeed,
  fetchSocialProfiles,
  followUser,
  MAX_IMAGE_UPLOAD_BYTES,
  toggleSocialCommentLike,
  toggleSocialLike,
  unfollowUser,
  uploadMediaImage,
  fetchFeedVolts,
  fetchActiveVoltsUsers,
  toggleVoltLike,
  type SocialPost,
  type SocialProfile,
  type ProfileVolt,
} from "../lib/supabase";
import { sanitizeImageUrl } from "../lib/sanitize";

const formatPostTime = (date: string) => new Intl.DateTimeFormat(undefined, {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date(date));

type MentionTarget =
  | { kind: "post" }
  | { kind: "comment"; postId: string };

const getMentionQuery = (value: string): string | null => {
  const match = value.match(/(?:^|\s)@([a-zA-Z0-9_.-]{0,24})$/);
  return match ? match[1].toLowerCase() : null;
};

const insertMention = (value: string, username: string): string => (
  value.replace(/(^|\s)@([a-zA-Z0-9_.-]{0,24})$/, `$1@${username} `)
);

const withUiTimeout = async <T,>(promise: Promise<T>, timeoutMs = 3500): Promise<T> => (
  Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error("Social request timed out")), timeoutMs);
    }),
  ])
);

const renderWithMentions = (value: string) => value
  .split(/(@[a-zA-Z0-9_.-]+)/g)
  .map((part, index) => (
    part.startsWith("@") ? (
      <span key={`${part}-${index}`} className="font-black text-volt">{part}</span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    )
  ));

const Social: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useI18n();
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [mentionTarget, setMentionTarget] = useState<MentionTarget | null>(null);
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState("");
  const [feedVolts, setFeedVolts] = useState<(ProfileVolt & { display_name: string; avatar_url: string | null })[]>([]);
  const [activeVoltsUserIds, setActiveVoltsUserIds] = useState<Set<string>>(new Set());
  const [selectedVolt, setSelectedVolt] = useState<ProfileVolt | null>(null);
  const [selectedVoltProfile, setSelectedVoltProfile] = useState<{ display_name: string; id: string } | null>(null);

  const loadSocialData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    let hadError = false;
    try {
      const [feedResult, profileResult, voltsResult, activeUsersResult] = await Promise.allSettled([
        withUiTimeout(fetchSocialFeed(user)),
        withUiTimeout(fetchSocialProfiles(user)),
        withUiTimeout(fetchFeedVolts(user)),
        withUiTimeout(fetchActiveVoltsUsers()),
      ]);

      if (feedResult.status === "fulfilled") {
        setPosts(feedResult.value);
      } else {
        hadError = true;
        setPosts([]);
      }

      if (profileResult.status === "fulfilled") {
        setProfiles(profileResult.value);
      } else {
        hadError = true;
        setProfiles([]);
      }

      if (voltsResult.status === "fulfilled") {
        setFeedVolts(voltsResult.value);
      } else {
        setFeedVolts([]);
      }

      if (activeUsersResult.status === "fulfilled") {
        setActiveVoltsUserIds(new Set(activeUsersResult.value));
      } else {
        setActiveVoltsUserIds(new Set());
      }

      if (hadError) {
        showToast(t("social.loadError"), "error");
      }
    } catch {
      showToast(t("social.loadError"), "error");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [showToast, t, user]);

  useEffect(() => {
    loadSocialData();
  }, [loadSocialData]);

  const currentUserVolts = useMemo(() => {
    if (!user) return [];
    return feedVolts
      .filter(v => v.user_id === user.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [feedVolts, user]);

  const voltsByUser = useMemo(() => {
    const map: Record<string, { user_id: string; display_name: string; avatar_url: string | null; volts: ProfileVolt[] }> = {};
    feedVolts.forEach(volt => {
      if (!map[volt.user_id]) {
        map[volt.user_id] = {
          user_id: volt.user_id,
          display_name: volt.display_name,
          avatar_url: volt.avatar_url,
          volts: []
        };
      }
      map[volt.user_id].volts.push(volt);
    });
    Object.values(map).forEach(u => {
      u.volts.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
    return Object.values(map).filter(u => u.user_id !== user?.id);
  }, [feedVolts, user]);

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return profiles;
    return profiles.filter(profile => [
      profile.display_name,
      profile.username,
      profile.city,
      profile.state,
      profile.country,
    ].some(value => value?.toLowerCase().includes(query)));
  }, [profiles, search]);

  const mentionOptions = useMemo(() => {
    if (!mentionTarget) return [];
    const value = mentionTarget.kind === "post" ? content : commentDrafts[mentionTarget.postId] || "";
    const query = getMentionQuery(value);
    if (query === null) return [];
    return profiles
      .filter(profile => [profile.username, profile.display_name]
        .some(field => field?.toLowerCase().includes(query)))
      .slice(0, 5);
  }, [commentDrafts, content, mentionTarget, profiles]);

  const handlePostContentChange = (value: string) => {
    const nextValue = value.slice(0, 280);
    setContent(nextValue);
    setMentionTarget(getMentionQuery(nextValue) !== null ? { kind: "post" } : null);
  };

  const handleCommentDraftChange = (postId: string, value: string) => {
    const nextValue = value.slice(0, 180);
    setCommentDrafts(prev => ({ ...prev, [postId]: nextValue }));
    setMentionTarget(getMentionQuery(nextValue) !== null ? { kind: "comment", postId } : null);
  };

  const handleSelectMention = (profile: SocialProfile) => {
    if (!profile.username || !mentionTarget) return;
    if (mentionTarget.kind === "post") {
      setContent(prev => insertMention(prev, profile.username).slice(0, 280));
    } else {
      setCommentDrafts(prev => ({
        ...prev,
        [mentionTarget.postId]: insertMention(prev[mentionTarget.postId] || "", profile.username).slice(0, 180),
      }));
    }
    setMentionTarget(null);
  };

  const handlePost = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim() && !postImageFile) return;
    setPosting(true);
    try {
      const imageUrl = postImageFile ? await uploadMediaImage(postImageFile, "social") : null;
      await createSocialPost(content, user, imageUrl);
      setContent("");
      setPostImageFile(null);
      setPostImagePreview("");
      showToast(t("social.postCreated"), "success");
      await loadSocialData(true); // Silent update
    } catch {
      showToast(t("social.postError"), "error");
    } finally {
      setPosting(false);
    }
  };

  const handleToggleFollow = async (profile: SocialProfile) => {
    // Optimistic state update
    setProfiles(prev => prev.map(p => {
      if (p.id === profile.id) {
        const following = !p.is_following;
        return {
          ...p,
          is_following: following,
          followers_count: following ? (p.followers_count || 0) + 1 : Math.max(0, (p.followers_count || 0) - 1)
        };
      }
      return p;
    }));
    try {
      if (profile.is_following) {
        await unfollowUser(profile.id, user);
      } else {
        await followUser(profile.id, user);
      }
      await loadSocialData(true); // Silent update in background
    } catch {
      showToast(t("social.followError"), "error");
      await loadSocialData(true); // Revert/sync
    }
  };

  const handleToggleLike = async (postId: string) => {
    // Optimistic state update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const liked = !p.liked_by_current_user;
        return {
          ...p,
          liked_by_current_user: liked,
          likes_count: liked ? (p.likes_count || 0) + 1 : Math.max(0, (p.likes_count || 0) - 1)
        };
      }
      return p;
    }));
    try {
      await toggleSocialLike(postId, user);
      await loadSocialData(true); // Silent update
    } catch {
      await loadSocialData(true); // Sync
    }
  };

  const handleToggleCommentLike = async (commentId: string) => {
    // Optimistic state update
    setPosts(prev => prev.map(p => {
      if (p.comments) {
        return {
          ...p,
          comments: p.comments.map(c => {
            if (c.id === commentId) {
              const liked = !c.liked_by_current_user;
              return {
                ...c,
                liked_by_current_user: liked,
                likes_count: liked ? (c.likes_count || 0) + 1 : Math.max(0, (c.likes_count || 0) - 1)
              };
            }
            return c;
          })
        };
      }
      return p;
    }));
    try {
      await toggleSocialCommentLike(commentId, user);
      await loadSocialData(true); // Silent update
    } catch {
      await loadSocialData(true); // Sync
    }
  };

  const openProfile = (profileId: string) => {
    navigate(`/app/profile/${profileId}`);
  };

  const handleComment = async (event: React.FormEvent, postId: string) => {
    event.preventDefault();
    const text = commentDrafts[postId]?.trim();
    if (!text) return;
    try {
      await createSocialComment(postId, text, user);
      setCommentDrafts(prev => ({ ...prev, [postId]: "" }));
      await loadSocialData(true); // Silent update
    } catch {
      showToast(t("social.commentError"), "error");
    }
  };

  const handlePostImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast(t("social.imageInvalid"), "warning");
      return;
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      showToast(t("social.imageTooLarge"), "warning");
      return;
    }
    setPostImageFile(file);
    setPostImagePreview(URL.createObjectURL(file));
  };

  const renderMentionOptions = () => (
    mentionOptions.length > 0 && (
      <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-44 overflow-y-auto rounded-xl border border-volt/25 bg-neoncard/95 p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <p className="px-2 pb-1 text-[8px] font-black uppercase tracking-widest text-mutedgray">{t("social.mentionHint")}</p>
        <div className="flex flex-col gap-0.5">
          {mentionOptions.map(profile => (
            <button
              key={profile.id}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                handleSelectMention(profile);
              }}
              className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10"
            >
              <span className="min-w-0">
                <span className="social-readable-text block truncate text-[11px] font-black uppercase">{profile.display_name}</span>
                <span className="block truncate text-[9px] font-mono text-volt">@{profile.username}</span>
              </span>
              <span className="text-[8px] font-black uppercase text-mutedgray">{profile.city || t("common.unknown")}</span>
            </button>
          ))}
        </div>
      </div>
    )
  );

  const activeViewingVolts = selectedVoltProfile
    ? (selectedVoltProfile.id === user?.id
        ? currentUserVolts
        : (voltsByUser.find(u => u.user_id === selectedVoltProfile.id)?.volts || []))
    : [];
  const currentVoltIndex = activeViewingVolts.findIndex(v => v.id === selectedVolt?.id);

  return (
    <div className="min-h-[100dvh] bg-darkbg text-white p-4 md:p-8 flex flex-col gap-4">
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/app/dashboard")}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <span className="text-[9px] font-black tracking-widest text-volt uppercase">{t("social.network")}</span>
            <h1 className="text-xl font-black uppercase tracking-wide">{t("social.title")}</h1>
          </div>
        </div>
        <button
          onClick={() => loadSocialData()}
          disabled={loading}
          className="p-3 rounded-2xl bg-white/5 border border-white/10 text-mutedgray hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin text-volt" : ""}`} />
        </button>
      </header>

      <main className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <section className="relative z-50 flex flex-col gap-4 lg:col-span-2">
          {/* Stories (Volts) Bar */}
          <Card glow="volt" className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-hide p-4 flex-row items-center border border-white/5 bg-neoncard">
            {/* Current User Story Circle */}
            <div
              className="flex flex-col items-center shrink-0 cursor-pointer"
              onClick={() => {
                if (currentUserVolts.length > 0) {
                  setSelectedVolt(currentUserVolts[0]);
                  setSelectedVoltProfile({ display_name: user?.display_name || "Newton Gomes", id: user?.id || "" });
                } else {
                  navigate(`/app/profile/${user?.id}`);
                }
              }}
            >
              <div className={`relative h-14 w-14 rounded-full flex items-center justify-center bg-zinc-800 ${currentUserVolts.length > 0 ? "avatar-volt-ring" : ""}`}>
                <div className="h-full w-full overflow-hidden rounded-full border-2 border-darkbg flex items-center justify-center bg-zinc-750">
                  {currentUserVolts.length > 0 ? (
                    <img src={sanitizeImageUrl(currentUserVolts[0].image_url)} alt="Seu Volt" className="h-full w-full object-cover" />
                  ) : user?.avatar_url ? (
                    <img src={sanitizeImageUrl(user.avatar_url)} alt="Seu avatar" className="h-full w-full object-cover" />
                  ) : (
                    user?.display_name?.slice(0, 2).toUpperCase() || "EU"
                  )}
                </div>
                {currentUserVolts.length === 0 && (
                  <span className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-volt text-[10px] font-black text-black border border-darkbg">+</span>
                )}
              </div>
              <span className="mt-1 text-[10px] font-black text-mutedgray max-w-[64px] truncate">{user?.display_name || "Você"}</span>
            </div>

            {/* Other Users Stories Circles */}
            {voltsByUser.map(item => (
              <div
                key={item.user_id}
                className="flex flex-col items-center shrink-0 cursor-pointer"
                onClick={() => {
                  setSelectedVolt(item.volts[0]);
                  setSelectedVoltProfile({ display_name: item.display_name, id: item.user_id });
                }}
              >
                <div className="h-14 w-14 rounded-full flex items-center justify-center bg-zinc-800 avatar-volt-ring">
                  <div className="h-full w-full overflow-hidden rounded-full border-2 border-darkbg flex items-center justify-center bg-zinc-750">
                    <img src={sanitizeImageUrl(item.volts[0].image_url)} alt={item.display_name} className="h-full w-full object-cover" />
                  </div>
                </div>
                <span className="mt-1 text-[10px] font-black social-readable-text max-w-[64px] truncate">{item.display_name}</span>
              </div>
            ))}
          </Card>

          <Card glow="volt" className="social-overflow-visible flex flex-col gap-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageCircle className="h-4.5 w-4.5 text-volt" />
              {t("social.composeTitle")}
            </CardTitle>
            <form onSubmit={handlePost} className="flex flex-col gap-3">
              <div className="relative">
                <textarea
                  value={content}
                  onChange={(event) => handlePostContentChange(event.target.value)}
                  onFocus={() => setMentionTarget(getMentionQuery(content) !== null ? { kind: "post" } : null)}
                  placeholder={t("social.placeholder")}
                  rows={3}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-sm font-semibold text-white focus:outline-none focus:border-volt placeholder-white/20 resize-none"
                />
                {mentionTarget?.kind === "post" && renderMentionOptions()}
              </div>
              {postImagePreview && (
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                  <img src={postImagePreview} alt={t("social.imagePreview")} className="max-h-72 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(postImagePreview);
                      setPostImageFile(null);
                      setPostImagePreview("");
                    }}
                    className="absolute right-2 top-2 rounded-xl border border-white/10 bg-black/70 p-2 text-white hover:bg-hyperpink"
                    title={t("social.removePhoto")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-mutedgray font-mono">{content.length}/280</span>
                <div className="flex items-center gap-2">
                  <label
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 text-mutedgray transition-colors hover:border-volt/40 hover:text-volt"
                    title={t("social.addPhoto")}
                  >
                    <ImagePlus className="h-4.5 w-4.5" />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePostImageChange} />
                  </label>
                  <Button type="submit" variant="volt" isLoading={posting} disabled={!content.trim() && !postImageFile} className="text-xs py-2.5 px-5">
                    {t("social.post")}
                  </Button>
                </div>
              </div>
            </form>
          </Card>

          {loading ? (
            <div className="py-16 text-center text-xs font-black text-mutedgray uppercase tracking-widest">{t("common.loading")}</div>
          ) : posts.length === 0 ? (
            <Card glow="pink" className="text-center py-12">
              <MessageCircle className="h-10 w-10 text-mutedgray/40 mx-auto mb-3" />
              <p className="text-xs font-black uppercase text-mutedgray">{t("social.emptyFeed")}</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {posts.map(post => (
                <Card key={post.id} glow="pink" className="social-overflow-visible flex gap-3">
                  <button
                    type="button"
                    onClick={() => openProfile(post.user_id)}
                    className={`h-11 w-11 shrink-0 rounded-2xl bg-volt text-black flex items-center justify-center font-black hover:scale-105 ${
                      activeVoltsUserIds.has(post.user_id) ? "avatar-volt-ring" : ""
                    }`}
                    title={post.display_name}
                  >
                    <div className="h-full w-full overflow-hidden rounded-[13px] bg-darkbg flex items-center justify-center">
                      {sanitizeImageUrl(post.avatar_url) ? (
                        <img src={sanitizeImageUrl(post.avatar_url)} alt={post.display_name} className="h-full w-full object-cover" />
                      ) : (
                        post.display_name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => openProfile(post.user_id)}
                          className="social-readable-text block max-w-full truncate text-left text-sm font-black uppercase hover:text-volt"
                        >
                          {post.display_name}
                        </button>
                        <span className="text-[9px] font-mono text-mutedgray uppercase">{formatPostTime(post.created_at)}</span>
                      </div>
                    </div>
                    <p className="social-readable-muted mt-2 text-sm leading-relaxed whitespace-pre-wrap">{renderWithMentions(post.content)}</p>
                    {sanitizeImageUrl(post.image_url) && (
                      <img
                        src={sanitizeImageUrl(post.image_url)}
                        alt={t("social.postImage")}
                        className="mt-3 max-h-[420px] w-full rounded-2xl border border-white/10 object-cover"
                      />
                    )}
                    <div className="mt-3 flex items-center gap-3 border-t border-white/5 pt-3">
                      <button
                        type="button"
                        onClick={() => handleToggleLike(post.id)}
                        className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${
                          post.liked_by_current_user ? "text-hyperpink" : "text-mutedgray hover:text-hyperpink"
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${post.liked_by_current_user ? "fill-current" : ""}`} />
                        {t("social.like")} · {post.likes_count || 0}
                      </button>
                      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-mutedgray">
                        <MessageCircle className="h-4 w-4" />
                        {t("social.comments")} · {post.comments_count || 0}
                      </span>
                    </div>

                    {(post.comments || []).length > 0 && (
                      <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-white/5 bg-black/15 p-2 pr-1 scrollbar-hide">
                        {(post.comments || []).map(comment => (
                          <div key={comment.id} className="group flex gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5">
                            <button
                              type="button"
                              onClick={() => openProfile(comment.user_id)}
                              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[9px] font-black text-volt hover:bg-volt hover:text-black overflow-hidden"
                              title={comment.display_name}
                            >
                              {sanitizeImageUrl(comment.avatar_url) ? (
                                <img src={sanitizeImageUrl(comment.avatar_url)} alt={comment.display_name} className="h-full w-full object-cover" />
                              ) : (
                                comment.display_name.slice(0, 2).toUpperCase()
                              )}
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                <button
                                  type="button"
                                  onClick={() => openProfile(comment.user_id)}
                                  className="social-readable-text text-left text-[10px] font-black uppercase hover:text-volt"
                                >
                                  {comment.display_name}
                                </button>
                                <span className="text-[8px] font-mono text-mutedgray uppercase">{formatPostTime(comment.created_at)}</span>
                              </div>
                              <p className="social-readable-muted text-[12px] leading-snug">{renderWithMentions(comment.content)}</p>
                              <button
                                type="button"
                                onClick={() => handleToggleCommentLike(comment.id)}
                                className={`mt-1 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider transition-colors ${
                                  comment.liked_by_current_user ? "text-hyperpink" : "text-mutedgray hover:text-hyperpink"
                                }`}
                              >
                                <Heart className={`h-3 w-3 ${comment.liked_by_current_user ? "fill-current" : ""}`} />
                                {t("social.like")} · {comment.likes_count || 0}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="relative mt-3">
                      <form onSubmit={(event) => handleComment(event, post.id)} className="flex gap-2">
                        <input
                          value={commentDrafts[post.id] || ""}
                          onChange={(event) => handleCommentDraftChange(post.id, event.target.value)}
                          onFocus={() => setMentionTarget(getMentionQuery(commentDrafts[post.id] || "") !== null ? { kind: "comment", postId: post.id } : null)}
                          placeholder={t("social.commentPlaceholder")}
                          className="flex-1 px-3 py-2 bg-black/35 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-volt placeholder-white/20"
                        />
                        <button
                          type="submit"
                          disabled={!commentDrafts[post.id]?.trim()}
                          className="px-3 rounded-xl bg-volt text-black disabled:opacity-40 disabled:cursor-not-allowed"
                          title={t("social.comment")}
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </form>
                      {mentionTarget?.kind === "comment" && mentionTarget.postId === post.id && renderMentionOptions()}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <aside className="relative z-0 flex flex-col gap-4">
          <Card glow="volt" className="social-overflow-visible flex flex-col gap-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-volt" />
              {t("social.people")}
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-mutedgray" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("social.searchPeople")}
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-volt placeholder-white/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              {filteredProfiles.map(profile => (
                <div key={profile.id} className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-white/3 border border-white/5">
                  <button type="button" onClick={() => openProfile(profile.id)} className="min-w-0 text-left">
                    <h3 className="social-readable-text text-xs font-black uppercase truncate hover:text-volt">{profile.display_name}</h3>
                    <p className="text-[9px] text-mutedgray truncate">@{profile.username} • {profile.city || t("common.unknown")}</p>
                    <p className="text-[8px] text-mutedgray uppercase mt-1">{t("social.followers", { count: profile.followers_count })}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleFollow(profile)}
                    className={`p-2 rounded-xl border transition-all shrink-0 ${
                      profile.is_following
                        ? "bg-white/5 border-white/10 text-mutedgray hover:text-red-400"
                        : "bg-volt text-black border-transparent hover:bg-white"
                    }`}
                    title={profile.is_following ? t("social.unfollow") : t("social.follow")}
                  >
                    {profile.is_following ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </main>

      {/* Volts Viewer Modal Overlay */}
      {selectedVolt && selectedVoltProfile && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-fade-in"
          onClick={() => {
            setSelectedVolt(null);
            setSelectedVoltProfile(null);
          }}
        >
          {/* Close Button */}
          <button 
            onClick={() => {
              setSelectedVolt(null);
              setSelectedVoltProfile(null);
            }}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 transition-colors z-[1001]"
          >
            <X className="h-6 w-6" />
          </button>

           {/* Card Wrapper */}
          <div 
            className="relative w-full max-w-sm aspect-[9/16] rounded-3xl overflow-hidden border border-volt/20 bg-black/50 shadow-[0_0_50px_rgba(198,255,0,0.15)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Logo */}
            <div className="absolute top-6 left-6 z-[100] flex items-center gap-1.5 pointer-events-none select-none">
              <span className="text-volt font-black tracking-widest text-xs text-glow-volt">⚡ VELOZTY</span>
            </div>

            {/* Progress Bars Indicator */}
            {activeViewingVolts.length > 1 && (
              <div className="absolute top-3 inset-x-4 flex gap-1 z-[100]">
                {activeViewingVolts.map((v, idx) => (
                  <div key={v.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-volt transition-all duration-300 ${
                        idx <= currentVoltIndex ? "w-full" : "w-0"
                      }`} 
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Left & Right Tap Hotspots */}
            <div className="absolute inset-0 z-40 flex">
              <div 
                className="w-[35%] h-full cursor-w-resize" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentVoltIndex > 0) {
                    setSelectedVolt(activeViewingVolts[currentVoltIndex - 1]);
                  }
                }}
              />
              <div 
                className="w-[65%] h-full cursor-e-resize" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentVoltIndex < activeViewingVolts.length - 1) {
                    setSelectedVolt(activeViewingVolts[currentVoltIndex + 1]);
                  } else {
                    setSelectedVolt(null);
                    setSelectedVoltProfile(null);
                  }
                }}
              />
            </div>

            {/* Story Image */}
            <img 
              src={sanitizeImageUrl(selectedVolt.image_url)} 
              alt={selectedVolt.caption || "Volt"} 
              className="w-full h-full object-cover"
            />
            
            {/* Info overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-6 flex flex-col gap-3 z-50">
              {/* Creator display name & time remaining */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-volt">{selectedVoltProfile.display_name}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-volt/95 px-2.5 py-1 text-[9px] font-black uppercase text-black">
                  <Clock className="h-3 w-3" />
                  {/* remaining hours/minutes */}
                  {(() => {
                    const remainingMs = new Date(selectedVolt.expires_at).getTime() - Date.now();
                    if (remainingMs <= 0) return "0h";
                    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
                    const minutes = Math.max(1, Math.ceil((remainingMs % (60 * 60 * 1000)) / (60 * 1000)));
                    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                  })()}
                </span>
              </div>

              {/* Caption */}
              {selectedVolt.caption && (
                <p className="text-sm font-semibold leading-relaxed text-white">
                  {selectedVolt.caption}
                </p>
              )}

              {/* Like button */}
              <div className="flex items-center gap-3 border-t border-white/10 pt-3 mt-1">
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await toggleVoltLike(selectedVolt.id, user);
                      const updatedFeedVolts = await fetchFeedVolts(user);
                      setFeedVolts(updatedFeedVolts);
                      const updatedActiveUsers = await fetchActiveVoltsUsers();
                      setActiveVoltsUserIds(new Set(updatedActiveUsers));
                      
                      // Directly toggle like state for immediate feedback
                      setSelectedVolt(prev => {
                        if (!prev) return null;
                        const isLiked = !prev.liked_by_current_user;
                        return {
                          ...prev,
                          liked_by_current_user: isLiked,
                          likes_count: isLiked ? (prev.likes_count || 0) + 1 : Math.max(0, (prev.likes_count || 1) - 1)
                        };
                      });
                    } catch (err) {
                      console.error("Erro ao curtir Volt no feed:", err);
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs hover:bg-white/10 text-white transition-colors"
                >
                  <Heart className={`h-4 w-4 ${selectedVolt.liked_by_current_user ? "fill-hyperpink text-hyperpink" : "text-white"}`} />
                  <span className="font-bold">{selectedVolt.likes_count || 0}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Social;
