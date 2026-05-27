import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, RefreshCw, Search, Send, UserMinus, UserPlus, Users } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardTitle } from "../components/ui/Card";
import { useToast } from "../components/ui/Toast";
import { useI18n } from "../components/i18n/I18nProvider";
import {
  createSocialPost,
  createSocialComment,
  fetchSocialFeed,
  fetchSocialProfiles,
  followUser,
  toggleSocialCommentLike,
  toggleSocialLike,
  unfollowUser,
  type SocialPost,
  type SocialProfile,
} from "../lib/supabase";

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
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [mentionTarget, setMentionTarget] = useState<MentionTarget | null>(null);

  const loadSocialData = async () => {
    setLoading(true);
    try {
      const [feedData, profileData] = await Promise.all([
        fetchSocialFeed(),
        fetchSocialProfiles(),
      ]);
      setPosts(feedData);
      setProfiles(profileData);
    } catch (err) {
      showToast(t("social.loadError"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSocialData();
  }, []);

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
    if (!content.trim()) return;
    setPosting(true);
    try {
      await createSocialPost(content);
      setContent("");
      showToast(t("social.postCreated"), "success");
      await loadSocialData();
    } catch (err) {
      showToast(t("social.postError"), "error");
    } finally {
      setPosting(false);
    }
  };

  const handleToggleFollow = async (profile: SocialProfile) => {
    try {
      if (profile.is_following) {
        await unfollowUser(profile.id);
      } else {
        await followUser(profile.id);
      }
      await loadSocialData();
    } catch (err) {
      showToast(t("social.followError"), "error");
    }
  };

  const handleToggleLike = async (postId: string) => {
    await toggleSocialLike(postId);
    await loadSocialData();
  };

  const handleToggleCommentLike = async (commentId: string) => {
    await toggleSocialCommentLike(commentId);
    await loadSocialData();
  };

  const openProfile = (profileId: string) => {
    navigate(`/profile/${profileId}`);
  };

  const handleComment = async (event: React.FormEvent, postId: string) => {
    event.preventDefault();
    const text = commentDrafts[postId]?.trim();
    if (!text) return;
    try {
      await createSocialComment(postId, text);
      setCommentDrafts(prev => ({ ...prev, [postId]: "" }));
      await loadSocialData();
    } catch (err) {
      showToast(t("social.commentError"), "error");
    }
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
                <span className="block truncate text-[11px] font-black uppercase text-white">{profile.display_name}</span>
                <span className="block truncate text-[9px] font-mono text-volt">@{profile.username}</span>
              </span>
              <span className="text-[8px] font-black uppercase text-mutedgray">{profile.city || t("common.unknown")}</span>
            </button>
          ))}
        </div>
      </div>
    )
  );

  return (
    <div className="min-h-[100dvh] bg-darkbg text-white p-4 md:p-8 flex flex-col gap-4">
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
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
          onClick={loadSocialData}
          disabled={loading}
          className="p-3 rounded-2xl bg-white/5 border border-white/10 text-mutedgray hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin text-volt" : ""}`} />
        </button>
      </header>

      <main className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <section className="relative z-50 flex flex-col gap-4 lg:col-span-2">
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
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-mutedgray font-mono">{content.length}/280</span>
                <Button type="submit" variant="volt" isLoading={posting} disabled={!content.trim()} className="text-xs py-2.5 px-5">
                  {t("social.post")}
                </Button>
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
                    className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-volt text-black flex items-center justify-center font-black hover:scale-105"
                    title={post.display_name}
                  >
                    {post.avatar_url ? (
                      <img src={post.avatar_url} alt={post.display_name} className="h-full w-full object-cover" />
                    ) : (
                      post.display_name.slice(0, 2).toUpperCase()
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => openProfile(post.user_id)}
                          className="block max-w-full truncate text-left text-sm font-black uppercase text-white hover:text-volt"
                        >
                          {post.display_name}
                        </button>
                        <span className="text-[9px] font-mono text-mutedgray uppercase">{formatPostTime(post.created_at)}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{renderWithMentions(post.content)}</p>
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
                              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[9px] font-black text-volt hover:bg-volt hover:text-black"
                              title={comment.display_name}
                            >
                              {comment.display_name.slice(0, 2).toUpperCase()}
                            </button>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                <button
                                  type="button"
                                  onClick={() => openProfile(comment.user_id)}
                                  className="text-left text-[10px] font-black uppercase text-white hover:text-volt"
                                >
                                  {comment.display_name}
                                </button>
                                <span className="text-[8px] font-mono text-mutedgray uppercase">{formatPostTime(comment.created_at)}</span>
                              </div>
                              <p className="text-[12px] text-white/80 leading-snug">{renderWithMentions(comment.content)}</p>
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
                    <h3 className="text-xs font-black uppercase truncate text-white hover:text-volt">{profile.display_name}</h3>
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
    </div>
  );
};

export default Social;
