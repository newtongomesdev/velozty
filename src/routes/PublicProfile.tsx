import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Clock, Flame, Globe, Heart, ImagePlus, Link as LinkIcon, MapPin, MessageCircle, UserMinus, UserPlus, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useToast } from "../components/ui/Toast";
import { useI18n } from "../components/i18n/I18nProvider";
import {
  fetchSocialProfile,
  createProfilePhoto,
  createProfileVolt,
  fetchProfilePhotos,
  fetchProfileVolts,
  followUser,
  getCurrentUser,
  MAX_IMAGE_UPLOAD_BYTES,
  toggleVoltLike,
  unfollowUser,
  type ProfilePhoto,
  type ProfileVolt,
  type Profile,
  type SocialProfile,
} from "../lib/supabase";
import { sanitizeImageUrl, sanitizeUrl } from "../lib/sanitize";

const PublicProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useI18n();
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [volts, setVolts] = useState<ProfileVolt[]>([]);
  const [selectedVolt, setSelectedVolt] = useState<ProfileVolt | null>(null);
  const [voltCaption, setVoltCaption] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVolt, setUploadingVolt] = useState(false);
  const [loading, setLoading] = useState(true);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const voltInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1. Fetch core profile and user data
      const [profileData, userData] = await Promise.all([
        fetchSocialProfile(id),
        getCurrentUser().catch(() => null),
      ]);
      setProfile(profileData);
      setCurrentUser(userData);
      setLoading(false);

      if (!profileData) return;

      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id || "");
      if (isUuid && profileData.username) {
        navigate(`/${profileData.username}`, { replace: true });
        return;
      }

      // 2. Fetch media independently (non-blocking)
      try {
        const photoData = await fetchProfilePhotos(profileData.id);
        setPhotos(photoData);
      } catch (photoErr) {
        console.error("Erro ao carregar fotos do perfil:", photoErr);
        setPhotos([]);
      }

      try {
        const voltData = await fetchProfileVolts(profileData.id);
        setVolts(voltData);
      } catch (voltErr) {
        console.error("Erro ao carregar Volts do perfil:", voltErr);
        setVolts([]);
      }
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
      showToast(t("social.loadError"), "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const handleToggleFollow = async () => {
    if (!profile) return;
    try {
      if (profile.is_following) {
        await unfollowUser(profile.id);
      } else {
        await followUser(profile.id);
      }
      await loadProfile();
    } catch (err) {
      showToast(t("social.followError"), "error");
    }
  };

  const isOwnProfile = currentUser?.id === profile?.id;
  const location = [profile?.city, profile?.state, profile?.country].filter(Boolean).join(", ");
  const safeWebsite = sanitizeUrl(profile?.website);
  const safeAvatarUrl = sanitizeImageUrl(profile?.avatar_url);

  const formatVoltExpiry = (expiresAt: string) => {
    const remainingMs = new Date(expiresAt).getTime() - Date.now();
    if (remainingMs <= 0) return "0h";
    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const minutes = Math.max(1, Math.ceil((remainingMs % (60 * 60 * 1000)) / (60 * 1000)));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !isOwnProfile) return;
    if (!file.type.startsWith("image/")) {
      showToast(t("social.imageInvalid"), "warning");
      return;
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      showToast(t("social.imageTooLarge"), "warning");
      return;
    }

    setUploadingPhoto(true);
    try {
      await createProfilePhoto(file);
      if (profile?.id) setPhotos(await fetchProfilePhotos(profile.id));
    } catch {
      showToast(t("social.photoUploadError"), "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleVoltUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !isOwnProfile) return;
    if (!file.type.startsWith("image/")) {
      showToast(t("social.imageInvalid"), "warning");
      return;
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      showToast(t("social.imageTooLarge"), "warning");
      return;
    }

    setUploadingVolt(true);
    try {
      await createProfileVolt(file, voltCaption);
      setVoltCaption("");
      if (profile?.id) setVolts(await fetchProfileVolts(profile.id));
      showToast(t("social.voltCreated"), "success");
    } catch {
      showToast(t("social.voltUploadError"), "error");
    } finally {
      setUploadingVolt(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-darkbg text-white p-4 md:p-8">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-fit rounded-2xl border border-white/10 bg-white/5 p-3 text-white/80 hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="py-16 text-center text-xs font-black uppercase tracking-widest text-mutedgray">{t("common.loading")}</div>
        ) : !profile ? (
          <Card glow="pink" className="py-14 text-center">
            <p className="text-sm font-black uppercase text-mutedgray">{t("social.profileNotFound")}</p>
          </Card>
        ) : (
          <Card glow="volt" className="social-overflow-visible flex flex-col gap-5">
            <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-volt text-2xl font-black text-black shadow-[0_0_25px_rgba(198,255,0,0.28)] ${volts.length > 0 ? "avatar-volt-ring" : ""}`}>
                  <div className="h-full w-full overflow-hidden rounded-[22px] bg-darkbg flex items-center justify-center">
                    {safeAvatarUrl ? (
                      <img src={safeAvatarUrl} alt={profile.display_name} className="h-full w-full object-cover" />
                    ) : (
                      profile.display_name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-widest text-volt">{t("social.publicProfile")}</span>
                  <h1 className="truncate text-2xl font-black uppercase text-white">{profile.display_name}</h1>
                  <p className="font-mono text-xs text-mutedgray">@{profile.username}</p>
                </div>
              </div>

              {!isOwnProfile && (
                <Button type="button" variant={profile.is_following ? "glass" : "volt"} onClick={handleToggleFollow} className="gap-2 text-xs">
                  {profile.is_following ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {profile.is_following ? t("social.unfollow") : t("social.follow")}
                </Button>
              )}
            </section>

            {profile.bio && (
              <p className="rounded-2xl border border-white/5 bg-black/20 p-4 text-sm leading-relaxed text-white/85">{profile.bio}</p>
            )}

            <section className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/5 bg-black/20 p-4 text-center">
                <p className="text-xl font-black text-white">{profile.followers_count}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-mutedgray">{t("social.followersLabel")}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/20 p-4 text-center">
                <p className="text-xl font-black text-white">{profile.following_count}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-mutedgray">{t("social.followingLabel")}</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/20 p-4 text-center">
                <p className="text-xl font-black text-white">{profile.posts_count || 0}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-mutedgray">{t("social.postsLabel")}</p>
              </div>
            </section>

            <section className="flex flex-col gap-3 rounded-2xl border border-volt/10 bg-volt/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-volt">
                    <Flame className="h-4 w-4 fill-current" />
                    {t("social.volts")}
                  </h2>
                  <p className="mt-1 text-[10px] font-semibold text-mutedgray">{t("social.voltsSubtitle")}</p>
                </div>
                {isOwnProfile && (
                  <div className="flex flex-col gap-2 sm:min-w-72">
                    <input
                      type="text"
                      value={voltCaption}
                      onChange={(event) => setVoltCaption(event.target.value)}
                      maxLength={120}
                      placeholder={t("social.voltCaptionPlaceholder")}
                      className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-white placeholder-white/20 focus:border-volt focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => voltInputRef.current?.click()}
                      disabled={uploadingVolt}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-volt/30 bg-volt/10 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-volt hover:bg-volt hover:text-black disabled:opacity-50"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      {uploadingVolt ? t("social.uploadingVolt") : t("social.addVolt")}
                    </button>
                    <input ref={voltInputRef} type="file" accept="image/*" className="hidden" onChange={handleVoltUpload} />
                  </div>
                )}
              </div>

              {volts.length === 0 ? (
                <p className="text-[10px] font-semibold text-mutedgray">{t("social.noVolts")}</p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {volts.map((volt) => (
                    sanitizeImageUrl(volt.image_url) ? (
                      <article
                        key={volt.id}
                        onClick={() => setSelectedVolt(volt)}
                        className="relative h-64 w-36 shrink-0 overflow-hidden rounded-3xl border border-volt/20 bg-black/40 shadow-[0_18px_45px_rgba(0,0,0,0.28)] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        <img src={sanitizeImageUrl(volt.image_url)} alt={volt.caption || t("social.volts")} className="h-full w-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-3">
                          {volt.caption && <p className="line-clamp-3 text-[10px] font-bold leading-snug text-white">{volt.caption}</p>}
                          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-volt/90 px-2 py-1 text-[8px] font-black uppercase text-black">
                            <Clock className="h-3 w-3" />
                            {t("social.expiresIn", { time: formatVoltExpiry(volt.expires_at) })}
                          </span>
                        </div>
                      </article>
                    ) : null
                  ))}
                </div>
              )}
            </section>

            <section className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-black/15 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-volt">{t("social.photos")}</h2>
                {isOwnProfile && (
                  <>
                    <button
                      type="button"
                      onClick={() => profilePhotoInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-white hover:border-volt/40 hover:text-volt disabled:opacity-50"
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      {uploadingPhoto ? t("dashboard.uploadingPhoto") : t("social.addPhoto")}
                    </button>
                    <input ref={profilePhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </>
                )}
              </div>
              {photos.length === 0 ? (
                <p className="text-[10px] font-semibold text-mutedgray">{t("social.noPhotos")}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {photos.map((photo) => (
                    sanitizeImageUrl(photo.image_url) ? (
                      <img
                        key={photo.id}
                        src={sanitizeImageUrl(photo.image_url)}
                        alt={photo.caption || t("social.photos")}
                        className="aspect-square w-full rounded-2xl border border-white/10 object-cover"
                      />
                    ) : null
                  ))}
                </div>
              )}
            </section>

            <section className="grid gap-2 text-xs font-semibold text-mutedgray sm:grid-cols-2">
              {location && (
                <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-black/15 px-4 py-3">
                  <MapPin className="h-4 w-4 text-volt" />
                  <span>{location}</span>
                </div>
              )}
              {safeWebsite && (
                <a href={safeWebsite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-2xl border border-white/5 bg-black/15 px-4 py-3 hover:text-volt">
                  <LinkIcon className="h-4 w-4 text-volt" />
                  <span className="truncate">{safeWebsite}</span>
                </a>
              )}
              <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-black/15 px-4 py-3">
                <Globe className="h-4 w-4 text-volt" />
                <span>{profile.is_public === false ? t("dashboard.privateProfile") : t("dashboard.publicProfile")}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/social")}
                className="flex items-center gap-2 rounded-2xl border border-white/5 bg-black/15 px-4 py-3 text-left hover:text-volt"
              >
                <MessageCircle className="h-4 w-4 text-volt" />
                <span>{t("social.backToFeed")}</span>
              </button>
            </section>
          </Card>
        )}
      </main>

      {/* Volts Viewer Modal Overlay */}
      {selectedVolt && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-fade-in"
          onClick={() => setSelectedVolt(null)}
        >
          {/* Close Button */}
          <button 
            onClick={() => setSelectedVolt(null)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 transition-colors"
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

            {/* Story Image */}
            <img 
              src={sanitizeImageUrl(selectedVolt.image_url)} 
              alt={selectedVolt.caption || "Volt"} 
              className="w-full h-full object-cover"
            />
            
            {/* Info overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-6 flex flex-col gap-3">
              {/* Creator display name & time remaining */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-volt">{profile?.display_name}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-volt/95 px-2.5 py-1 text-[9px] font-black uppercase text-black">
                  <Clock className="h-3 w-3" />
                  {t("social.expiresIn", { time: formatVoltExpiry(selectedVolt.expires_at) })}
                </span>
              </div>

              {/* Caption */}
              {selectedVolt.caption && (
                <p className="text-sm font-semibold leading-relaxed text-white">
                  {selectedVolt.caption}
                </p>
              )}

              {/* Like Button */}
              <div className="flex items-center gap-3 border-t border-white/10 pt-3 mt-1">
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await toggleVoltLike(selectedVolt.id, currentUser);
                      if (id) {
                        const updatedVolts = await fetchProfileVolts(id);
                        setVolts(updatedVolts);
                      }
                      
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
                      console.error("Erro ao curtir Volt:", err);
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

export default PublicProfile;

