import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Globe, ImagePlus, Link as LinkIcon, MapPin, MessageCircle, UserMinus, UserPlus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { useToast } from "../components/ui/Toast";
import { useI18n } from "../components/i18n/I18nProvider";
import {
  fetchSocialProfile,
  createProfilePhoto,
  fetchProfilePhotos,
  followUser,
  getCurrentUser,
  unfollowUser,
  type ProfilePhoto,
  type Profile,
  type SocialProfile,
} from "../lib/supabase";

const PublicProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useI18n();
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [profileData, userData, photoData] = await Promise.all([
        fetchSocialProfile(id),
        getCurrentUser(),
        fetchProfilePhotos(id),
      ]);
      setProfile(profileData);
      setCurrentUser(userData);
      setPhotos(photoData);
    } catch (err) {
      showToast(t("social.loadError"), "error");
    } finally {
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

  const location = [profile?.city, profile?.state, profile?.country].filter(Boolean).join(", ");
  const isOwnProfile = currentUser?.id === profile?.id;

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !isOwnProfile) return;
    if (!file.type.startsWith("image/")) {
      showToast(t("social.imageInvalid"), "warning");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast(t("social.imageTooLarge"), "warning");
      return;
    }

    setUploadingPhoto(true);
    try {
      await createProfilePhoto(file);
      if (id) setPhotos(await fetchProfilePhotos(id));
    } catch {
      showToast(t("social.photoUploadError"), "error");
    } finally {
      setUploadingPhoto(false);
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
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-volt text-2xl font-black text-black shadow-[0_0_25px_rgba(198,255,0,0.28)]">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name} className="h-full w-full object-cover" />
                  ) : (
                    profile.display_name.slice(0, 2).toUpperCase()
                  )}
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
                    <img
                      key={photo.id}
                      src={photo.image_url}
                      alt={photo.caption || t("social.photos")}
                      className="aspect-square w-full rounded-2xl border border-white/10 object-cover"
                    />
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
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-2xl border border-white/5 bg-black/15 px-4 py-3 hover:text-volt">
                  <LinkIcon className="h-4 w-4 text-volt" />
                  <span className="truncate">{profile.website}</span>
                </a>
              )}
              <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-black/15 px-4 py-3">
                <Globe className="h-4 w-4 text-volt" />
                <span>{profile.is_public === false ? t("dashboard.privateProfile") : t("dashboard.publicProfile")}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/app/social")}
                className="flex items-center gap-2 rounded-2xl border border-white/5 bg-black/15 px-4 py-3 text-left hover:text-volt"
              >
                <MessageCircle className="h-4 w-4 text-volt" />
                <span>{t("social.backToFeed")}</span>
              </button>
            </section>
          </Card>
        )}
      </main>
    </div>
  );
};

export default PublicProfile;
