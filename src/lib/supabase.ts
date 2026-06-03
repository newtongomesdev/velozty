import { createClient, type User } from "@supabase/supabase-js";
import { sanitizeImageUrl, sanitizeOptionalText } from "./sanitize";

// Retrieve keys from environmental variables
const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isUsingMock = !supabaseUrl || !supabaseAnonKey;

// Real Supabase Client
export const supabase = isUsingMock 
  ? null 
  : createClient(supabaseUrl, supabaseAnonKey);

if (typeof window !== "undefined" && supabase) {
  (window as any).supabaseClient = supabase;
}

if (isUsingMock) {
  console.warn("Velozty: Supabase credentials missing. Running in premium Local Simulation Mode!");
}

async function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  return await Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    }),
  ]);
}

// -------------------------------------------------------------
// TYPES
// -------------------------------------------------------------
export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string;
  username: string;
  username_updated_at?: string | null;
  email?: string;
  country?: string;
  state?: string;
  city?: string;
  birthdate?: string;
  gender?: string;
  bio?: string;
  website?: string;
  is_public?: boolean;
  is_admin?: boolean;
  created_at: string;
}

export interface Race {
  id: string;
  host_user_id: string;
  name: string;
  modality: "running" | "bike" | "other";
  mode: "live" | "time_trial";
  status: "lobby" | "active" | "finished" | "cancelled";
  start_lat: number;
  start_lng: number;
  finish_lat: number;
  finish_lng: number;
  finish_radius_m: number;
  invite_code: string;
  is_public: boolean;
  allow_spectators?: boolean;
  city: string | null;
  state: string | null;
  country?: string | null;
  neighborhood: string | null;
  start_address?: string | null;
  finish_address?: string | null;
  address?: string | null;
  location_notes?: string | null;
  scheduled_at?: string | null;
  route_coords: { lat: number; lng: number }[] | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface RaceParticipant {
  id: string;
  race_id: string;
  user_id: string;
  display_name: string;
  color: string;
  joined_at: string;
  started_at: string | null;
  finished_at: string | null;
  finish_time_ms: number | null;
  top_speed_kmh: number;
  abandoned_at: string | null;
}

export interface RacePosition {
  id: number;
  race_id: string;
  participant_id: string;
  user_id: string;
  lat: number;
  lng: number;
  speed_kmh: number;
  distance_to_finish_m: number;
  recorded_at: string;
}

export interface RaceAward {
  id: string;
  race_id: string;
  participant_id: string;
  award_type: "winner" | "top_speed" | "pace_setter" | "personal_best";
  value_text: string;
  created_at: string;
}

const USERNAME_REGEX = /^[A-Za-z0-9_.-]{3,24}$/;

export interface SocialPost {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string | null;
  content: string;
  image_url?: string | null;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
  liked_by_current_user?: boolean;
  comments?: SocialComment[];
}

export interface SocialFollow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface SocialProfile extends Profile {
  is_following: boolean;
  followers_count: number;
  following_count: number;
  posts_count?: number;
}

export interface SocialLike {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface SocialComment {
  id: string;
  post_id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string | null;
  content: string;
  created_at: string;
  likes_count?: number;
  liked_by_current_user?: boolean;
}

export interface SocialCommentLike {
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface ProfilePhoto {
  id: string;
  user_id: string;
  image_url: string;
  caption?: string | null;
  created_at: string;
}

export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

export interface ProfileVolt {
  id: string;
  user_id: string;
  image_url: string;
  caption?: string | null;
  created_at: string;
  expires_at: string;
  likes_count?: number;
  liked_by_current_user?: boolean;
}

export interface ProfileVoltLike {
  volt_id: string;
  user_id: string;
  created_at: string;
}

export interface AppReport {
  id: string;
  reporter_id: string;
  target_type: "post" | "comment" | "volt" | "profile";
  target_id: string;
  reason: string;
  status: "pending" | "reviewed" | "dismissed" | "acted";
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  actor_user_id?: string | null;
  type: "social_like" | "comment_like" | "message" | "upcoming_race" | "system";
  title: string;
  body?: string | null;
  target_url?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface StravaConnection {
  user_id: string;
  athlete_id?: number | null;
  athlete_name?: string | null;
  scope?: string | null;
  expires_at?: string | null;
  connected_at: string;
  updated_at: string;
}

function requireSocialUser(currentUser?: Profile | null): Profile | null {
  return currentUser ?? null;
}

// -------------------------------------------------------------
// LOCAL STATE STORAGE ENGINE (For Mock Mode)
// -------------------------------------------------------------
const STORAGE_KEYS = {
  CURRENT_USER: "velozty_mock_current_user",
  PROFILES: "velozty_mock_profiles",
  RACES: "velozty_mock_races",
  PARTICIPANTS: "velozty_mock_participants",
  POSITIONS: "velozty_mock_positions",
  AWARDS: "velozty_mock_awards",
  SOCIAL_POSTS: "velozty_mock_social_posts",
  SOCIAL_FOLLOWS: "velozty_mock_social_follows",
  SOCIAL_LIKES: "velozty_mock_social_likes",
  SOCIAL_COMMENTS: "velozty_mock_social_comments",
  SOCIAL_COMMENT_LIKES: "velozty_mock_social_comment_likes",
  PROFILE_PHOTOS: "velozty_mock_profile_photos",
  PROFILE_VOLTS: "velozty_mock_profile_volts",
  PROFILE_VOLT_LIKES: "velozty_mock_profile_volt_likes",
  NOTIFICATIONS: "velozty_mock_notifications",
  SOCIAL_REPORTS: "velozty_mock_social_reports"
};

// Initial Mock Seed Data
const defaultProfiles: Profile[] = [
  { id: "user-1", display_name: "BoltVolt ⚡", avatar_url: "", username: "boltvolt", email: "bolt@velozty.com", country: "Brasil", state: "SP", city: "São Paulo", birthdate: "1995-04-12", gender: "Masculino", created_at: new Date().toISOString() },
  { id: "user-2", display_name: "SprintQueen 👑", avatar_url: "", username: "sprintqueen", email: "queen@velozty.com", country: "Brasil", state: "RJ", city: "Rio de Janeiro", birthdate: "1998-08-23", gender: "Feminino", created_at: new Date().toISOString() },
  { id: "user-3", display_name: "NeonPeddler 🚴", avatar_url: "", username: "neonpeddler", email: "peddler@velozty.com", country: "Brasil", state: "MG", city: "Belo Horizonte", birthdate: "1993-11-05", gender: "Masculino", created_at: new Date().toISOString() },
  { id: "user-4", display_name: "TurboTurtle 🐢", avatar_url: "", username: "turboturtle", email: "turtle@velozty.com", country: "Brasil", state: "RS", city: "Porto Alegre", birthdate: "1997-01-30", gender: "Outro", created_at: new Date().toISOString() }
];

const defaultSocialPosts: SocialPost[] = [
  { id: "post-1", user_id: "user-2", display_name: "SprintQueen 👑", avatar_url: "", content: "Treino de tiro concluído. Quem vem para a próxima corrida pública?", created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { id: "post-2", user_id: "user-3", display_name: "NeonPeddler 🚴", avatar_url: "", content: "Rota noturna em São Paulo mapeada. Largada precisa e chegada segura fazem diferença.", created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
  { id: "post-3", user_id: "user-1", display_name: "BoltVolt ⚡", avatar_url: "", content: "Objetivo da semana: baixar meu tempo em 5%.", created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
];

const defaultSocialFollows: SocialFollow[] = [
  { follower_id: "user-1", following_id: "user-2", created_at: new Date().toISOString() },
  { follower_id: "user-1", following_id: "user-3", created_at: new Date().toISOString() },
];

function getStored<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(data) as T;
}

function setStored<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Helper to notify listeners of changes (Simple custom emitter for reactivity in mock mode)
type MockEventCallback<T = unknown> = (data: T) => void;

class MockEventEmitter {
  private listeners: { [key: string]: MockEventCallback[] } = {};

  subscribe<T = unknown>(event: string, callback: MockEventCallback<T>) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback as MockEventCallback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event: string, data: unknown) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

export const mockEmitter = new MockEventEmitter();

// -------------------------------------------------------------
// API SERVER FUNCTIONS (Genuinely bridges Mock and Supabase)
// -------------------------------------------------------------

// Active Mock User state
let mockCurrentUser: Profile | null = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || "null");

export async function getCurrentUser(existingUser?: User): Promise<Profile | null> {
  if (isUsingMock) {
    return mockCurrentUser;
  }
  
  if (!supabase) return null;
  
  let user: User | null = existingUser ?? null;
  if (!user) {
    try {
      const { data: { session }, error } = await withTimeout(
        supabase.auth.getSession(),
        2500,
        "Auth session lookup timed out",
      );
      if (error) return null;
      user = session?.user ?? null;
    } catch {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.getUser(),
          4000,
          "Auth user lookup timed out",
        );
        if (error) return null;
        user = data.user ?? null;
      } catch {
        return null;
      }
    }
  }
  
  if (!user) return null;
  
  // Fallback virtual profile template in case we fail to query/create in the DB
  const fallbackDisplayName = user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Atleta";
  const fallbackUsername = String(user.user_metadata?.username || user.email?.split("@")[0] || `user_${user.id.substring(0, 8)}`)
    .trim()
    .replace(/\s+/g, "");
  const virtualProfile: Profile = {
    id: user.id,
    display_name: fallbackDisplayName,
    avatar_url: user.user_metadata?.avatar_url || "",
    username: fallbackUsername,
    email: user.email,
    created_at: user.created_at || new Date().toISOString(),
    is_public: true
  };

  // Race the query against a timeout so we never block loading indefinitely (3.5 seconds)
  const profileQueryPromise = supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  let profile = null;
  let profileLookupFailed: boolean;

  try {
    const { data, error } = await withTimeout(
      profileQueryPromise,
      3500,
      "Profiles query timed out",
    ) as Awaited<typeof profileQueryPromise>;
    profile = data;
    profileLookupFailed = Boolean(error);
  } catch {
    profileLookupFailed = true;
  }

  if (!profile && !profileLookupFailed) {
    try {
      const { data: insertedProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          display_name: fallbackDisplayName,
          avatar_url: user.user_metadata?.avatar_url || "",
          username: fallbackUsername,
          email: user.email,
          is_public: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        const { data: currentProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        return currentProfile ? { ...currentProfile, email: user.email } : virtualProfile;
      }
      
      profile = insertedProfile;
    } catch {
      return virtualProfile;
    }
  } else if (profileLookupFailed) {
    return virtualProfile;
  }

  return profile ? { ...profile, email: user.email } : virtualProfile;
}

export const RESERVED_USERNAMES = new Set([
  // Core routes / pages
  "dashboard",
  "login",
  "signup",
  "register",
  "races",
  "hall-of-fame",
  "social",
  "profile",
  "strava",
  "watch",
  "join",
  "edit",
  "results",
  "overlay",
  "transmissao",
  "terms",
  "privacy",
  "about",
  "contact",
  "help",
  "faq",
  "settings",
  "config",
  
  // Standard reserved names
  "admin",
  "administrator",
  "root",
  "sys",
  "system",
  "moderator",
  "mod",
  "staff",
  "team",
  "velozty",
  "velocity",
  "official",
  "verified",
  "support",
  "api",
  "dev",
  "developer",
  "developers",
  "security",
  "privacy-policy",
  "terms-of-service",
  "tos",
  "info",
  "mail",
  "email",
  "webmaster",
  "host",
  "localhost",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
  "postmaster",
  "hostmaster",
  
  // Code / system keywords
  "null", "undefined", "nan", "void", "true", "false", "guest", "user", "users", "profile", "profiles", "auth", "db", "database",
  "feed", "post", "posts", "comment", "comments", "like", "likes", "share", "shares",
  "follow", "follower", "followers", "following", "run", "runner", "cycle", "cyclist",
  "ride", "rider", "activity", "activities", "map", "maps", "route", "routes",
  "live", "gps", "device", "devices", "integration", "integrations", "callback",
  "oauth", "connect", "disconnect",
  // System and App Routes
  "admin", "administrator", "root", "system", "sysadmin", "support", "help",
  "login", "logout", "signin", "signout", "register", "signup", "dashboard",
  "settings", "config", "account", "billing", "api", "app", "home",
  "terms", "privacy", "legal", "about", "contact", "faq", "blog", "news",
  "press", "media", "jobs", "careers", "security", "status", "store", "shop",
  "velozty", "velocity", "official",
  // Common abusive or inappropriate terms (basic block)
  "fake", "bot", "spam", "scam", "null", "undefined", "anonymous",
  // Routes specifically used in Velozty AppBoundary
  "social", "races", "race", "watch", "overlay", "transmissao", "results",
  "explore", "search", "messages", "notifications", "chat", "create", "new",
  "edit", "delete", "remove", "update", "upload", "download"
]);

export function isValidUsernameFormat(username: string): boolean {
  const candidate = username.trim().toLowerCase();
  return USERNAME_REGEX.test(candidate) && !RESERVED_USERNAMES.has(candidate);
}

export async function isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
  const candidate = username.trim().toLowerCase();
  if (!candidate) return false;
  if (RESERVED_USERNAMES.has(candidate)) return false;

  if (isUsingMock) {
    const profiles = getStored<Profile[]>(STORAGE_KEYS.PROFILES, defaultProfiles);
    return !profiles.some((profile) => (
      profile.username.toLowerCase() === candidate &&
      profile.id !== excludeUserId
    ));
  }

  if (!supabase) return false;

  let query = supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .ilike("username", candidate);

  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }

  const { count, error } = await query;
  if (error) throw error;
  return (count || 0) === 0;
}

export async function suggestUsernames(username: string, excludeUserId?: string): Promise<string[]> {
  const root = username
    .trim()
    .replace(/[^A-Za-z0-9_.-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 18) || "pilot";

  const candidates = [
    `${root}.app`,
    `${root}_race`,
    `${root}01`,
    `${root}77`,
    `${root}.br`,
    `${root}_pro`,
  ];

  const uniqueCandidates = [...new Set(candidates)].slice(0, 6);
  const availability = await Promise.all(
    uniqueCandidates.map((candidate) => isUsernameAvailable(candidate, excludeUserId))
  );

  return uniqueCandidates.filter((_, index) => availability[index]).slice(0, 3);
}

export async function mockLogin(email: string, name?: string, username?: string): Promise<Profile> {
  const profiles = getStored<Profile[]>(STORAGE_KEYS.PROFILES, defaultProfiles);
  let profile = profiles.find((item) => item.email?.toLowerCase() === email.toLowerCase());
  
  if (!profile) {
    profile = {
      id: `user-${Date.now()}`,
      display_name: name || email.split("@")[0] || "CyberRacer",
      avatar_url: "",
      username: username?.trim() || email.split("@")[0] || "cyberracer",
      email: email,
      country: "Brasil",
      state: "SP",
      city: "São Paulo",
      birthdate: "1995-01-01",
      gender: "Outro",
      bio: "",
      website: "",
      is_public: true,
      created_at: new Date().toISOString()
    };
    profiles.push(profile);
    setStored(STORAGE_KEYS.PROFILES, profiles);
  }
  
  mockCurrentUser = profile;
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(profile));
  mockEmitter.emit("auth_change", profile);
  return profile;
}

export async function mockLogout(): Promise<void> {
  mockCurrentUser = null;
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  mockEmitter.emit("auth_change", null);
}

export async function updateUserProfile(input: {
  display_name: string;
  country: string;
  state: string;
  city: string;
  birthdate: string;
  gender: string;
  bio?: string;
  website?: string;
  avatar_url?: string;
  is_public?: boolean;
  username?: string;
}): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado");
  const requestedUsername = input.username?.trim();
  const usernameChanged = Boolean(requestedUsername && requestedUsername.toLowerCase() !== user.username.toLowerCase());
  const usernameUpdatedAt = user.username_updated_at ? new Date(user.username_updated_at) : null;
  const canChangeUsername = !usernameUpdatedAt || Date.now() - usernameUpdatedAt.getTime() >= 7 * 24 * 60 * 60 * 1000;

  if (usernameChanged) {
    if (!isValidUsernameFormat(requestedUsername!)) {
      throw new Error("Nome de usuário inválido.");
    }
    if (!canChangeUsername) {
      throw new Error("Você só pode alterar o nome de usuário uma vez a cada 7 dias.");
    }
    const available = await isUsernameAvailable(requestedUsername!, user.id);
    if (!available) {
      throw new Error("Esse nome de usuário já existe.");
    }
  }
  
  if (isUsingMock) {
    const profiles = getStored<Profile[]>(STORAGE_KEYS.PROFILES, defaultProfiles);
    const idx = profiles.findIndex(p => p.id === user.id);
    const updated: Profile = {
      ...user,
      display_name: input.display_name,
      country: input.country,
      state: input.state,
      city: input.city,
      birthdate: input.birthdate,
      gender: input.gender,
      bio: input.bio ?? user.bio ?? "",
      website: input.website ?? user.website ?? "",
      avatar_url: input.avatar_url ?? user.avatar_url ?? "",
      is_public: input.is_public ?? user.is_public ?? true,
      username: usernameChanged ? requestedUsername! : user.username,
      username_updated_at: usernameChanged ? new Date().toISOString() : user.username_updated_at ?? null,
    };
    
    if (idx !== -1) {
      profiles[idx] = updated;
      setStored(STORAGE_KEYS.PROFILES, profiles);
    }
    
    mockCurrentUser = updated;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(mockCurrentUser));
    mockEmitter.emit("auth_change", mockCurrentUser);
    return mockCurrentUser;
  } else {
    if (!supabase) throw new Error("Supabase não configurado");
    const { data, error } = await supabase
      .from("profiles")
      .update({ 
        display_name: input.display_name,
        country: input.country,
        state: input.state,
        city: input.city,
        birthdate: input.birthdate,
        gender: input.gender,
        bio: input.bio,
        website: input.website,
        avatar_url: input.avatar_url,
        is_public: input.is_public,
        username: usernameChanged ? requestedUsername : user.username,
        username_updated_at: usernameChanged ? new Date().toISOString() : user.username_updated_at ?? null,
      })
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    
    // Sync Supabase Auth metadata
    await supabase.auth.updateUser({
      data: {
        display_name: input.display_name,
        avatar_url: input.avatar_url,
      }
    }).catch(err => console.error("Error updating auth metadata:", err));

    // Emit auth change event to update global React context state
    mockEmitter.emit("auth_change", { ...data, email: user.email });

    return data;
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadMediaImage(file: File, folder: "avatars" | "profile" | "social"): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado");
  if (!file.type.startsWith("image/")) throw new Error("Arquivo inválido");
  if (file.size > 5 * 1024 * 1024) throw new Error("Imagem muito grande");

  if (isUsingMock) {
    return await fileToDataUrl(file);
  }

  if (!supabase) throw new Error("Supabase não configurado");

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const { error } = await supabase.storage
    .from("velozty-media")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

  const { data } = supabase.storage.from("velozty-media").getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchProfilePhotos(profileId: string): Promise<ProfilePhoto[]> {
  if (isUsingMock) {
    return getStored<ProfilePhoto[]>(STORAGE_KEYS.PROFILE_PHOTOS, [])
      .filter(photo => photo.user_id === profileId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  if (!supabase) return [];
  const { data, error } = await supabase
    .from("profile_photos")
    .select("*")
    .eq("user_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as ProfilePhoto[];
}

export async function createProfilePhoto(file: File, caption = ""): Promise<ProfilePhoto> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado");
  const imageUrl = await uploadMediaImage(file, "profile");

  if (isUsingMock) {
    const photos = getStored<ProfilePhoto[]>(STORAGE_KEYS.PROFILE_PHOTOS, []);
    const photo: ProfilePhoto = {
      id: `profile-photo-${Date.now()}`,
      user_id: user.id,
      image_url: imageUrl,
      caption: caption.trim() || null,
      created_at: new Date().toISOString(),
    };
    photos.unshift(photo);
    setStored(STORAGE_KEYS.PROFILE_PHOTOS, photos);
    return photo;
  }

  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase
    .from("profile_photos")
    .insert([{ user_id: user.id, image_url: imageUrl, caption: caption.trim() || null }])
    .select()
    .single();
  if (error) throw error;
  return data as ProfilePhoto;
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  if (isUsingMock) {
    return getStored<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, [])
      .filter(notification => notification.user_id === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  if (!supabase) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data || []) as AppNotification[];
}

export async function createNotification(input: Omit<AppNotification, "id" | "created_at">): Promise<void> {
  if (input.user_id === input.actor_user_id) return;

  if (isUsingMock) {
    const notifications = getStored<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    notifications.unshift({
      ...input,
      id: `notification-${Date.now()}`,
      created_at: new Date().toISOString(),
    });
    setStored(STORAGE_KEYS.NOTIFICATIONS, notifications);
    return;
  }

  if (!supabase) return;
  await supabase.from("notifications").insert([input]);
}

export async function markNotificationsRead(notificationIds: string[]): Promise<void> {
  const user = await getCurrentUser();
  if (!user || notificationIds.length === 0) return;
  const readAt = new Date().toISOString();

  if (isUsingMock) {
    const notifications = getStored<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    setStored(STORAGE_KEYS.NOTIFICATIONS, notifications.map(notification => (
      notification.user_id === user.id && notificationIds.includes(notification.id)
        ? { ...notification, read_at: readAt }
        : notification
    )));
    return;
  }

  if (!supabase) return;
  await supabase
    .from("notifications")
    .update({ read_at: readAt })
    .eq("user_id", user.id)
    .in("id", notificationIds);
}

export async function fetchStravaConnection(): Promise<StravaConnection | null> {
  const user = await getCurrentUser();
  if (!user || isUsingMock || !supabase) return null;

  const { data, error } = await supabase
    .from("strava_connections")
    .select("user_id, athlete_id, athlete_name, scope, expires_at, connected_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data as StravaConnection | null;
}

export function getStravaAuthorizationUrl(): string | null {
  const clientId = import.meta.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || import.meta.env.VITE_STRAVA_CLIENT_ID || "";
  if (!clientId) return null;
  const redirectUri = `${window.location.origin}/strava/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read,activity:write",
  });
  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

export async function exportMyData(): Promise<Record<string, unknown>> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado");

  if (isUsingMock) {
    const races = getStored<Race[]>(STORAGE_KEYS.RACES, []);
    const participants = getStored<RaceParticipant[]>(STORAGE_KEYS.PARTICIPANTS, []);
    const positions = getStored<RacePosition[]>(STORAGE_KEYS.POSITIONS, []);
    const awards = getStored<RaceAward[]>(STORAGE_KEYS.AWARDS, []);
    const posts = getStored<SocialPost[]>(STORAGE_KEYS.SOCIAL_POSTS, defaultSocialPosts);
    const comments = getStored<SocialComment[]>(STORAGE_KEYS.SOCIAL_COMMENTS, []);
    const follows = getStored<SocialFollow[]>(STORAGE_KEYS.SOCIAL_FOLLOWS, defaultSocialFollows);
    const likes = getStored<SocialLike[]>(STORAGE_KEYS.SOCIAL_LIKES, []);
    const commentLikes = getStored<SocialCommentLike[]>(STORAGE_KEYS.SOCIAL_COMMENT_LIKES, []);

    return {
      exported_at: new Date().toISOString(),
      profile: user,
      races_hosted: races.filter((race) => race.host_user_id === user.id),
      race_participations: participants.filter((participant) => participant.user_id === user.id),
      race_positions: positions.filter((position) => position.user_id === user.id),
      race_awards: awards.filter((award) =>
        participants.some((participant) => participant.id === award.participant_id && participant.user_id === user.id)
      ),
      social_posts: posts.filter((post) => post.user_id === user.id),
      social_comments: comments.filter((comment) => comment.user_id === user.id),
      social_follows: follows.filter((follow) => follow.follower_id === user.id || follow.following_id === user.id),
      social_likes: likes.filter((like) => like.user_id === user.id),
      social_comment_likes: commentLikes.filter((like) => like.user_id === user.id),
    };
  }

  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase.rpc("export_my_data");
  if (error) throw error;
  return (data || {}) as Record<string, unknown>;
}

export async function deleteMyAccount(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado");

  if (isUsingMock) {
    const profiles = getStored<Profile[]>(STORAGE_KEYS.PROFILES, defaultProfiles).filter((profile) => profile.id !== user.id);
    const races = getStored<Race[]>(STORAGE_KEYS.RACES, []).filter((race) => race.host_user_id !== user.id);
    const participants = getStored<RaceParticipant[]>(STORAGE_KEYS.PARTICIPANTS, []).filter((participant) => participant.user_id !== user.id);
    const remainingParticipantIds = new Set(participants.map((participant) => participant.id));
    const raceIds = new Set(races.map((race) => race.id));

    setStored(STORAGE_KEYS.PROFILES, profiles);
    setStored(STORAGE_KEYS.RACES, races);
    setStored(STORAGE_KEYS.PARTICIPANTS, participants);
    setStored(STORAGE_KEYS.POSITIONS, getStored<RacePosition[]>(STORAGE_KEYS.POSITIONS, []).filter((position) => position.user_id !== user.id && raceIds.has(position.race_id)));
    setStored(STORAGE_KEYS.AWARDS, getStored<RaceAward[]>(STORAGE_KEYS.AWARDS, []).filter((award) => remainingParticipantIds.has(award.participant_id) && raceIds.has(award.race_id)));
    setStored(STORAGE_KEYS.SOCIAL_POSTS, getStored<SocialPost[]>(STORAGE_KEYS.SOCIAL_POSTS, defaultSocialPosts).filter((post) => post.user_id !== user.id));
    setStored(STORAGE_KEYS.SOCIAL_COMMENTS, getStored<SocialComment[]>(STORAGE_KEYS.SOCIAL_COMMENTS, []).filter((comment) => comment.user_id !== user.id));
    setStored(STORAGE_KEYS.SOCIAL_FOLLOWS, getStored<SocialFollow[]>(STORAGE_KEYS.SOCIAL_FOLLOWS, defaultSocialFollows).filter((follow) => follow.follower_id !== user.id && follow.following_id !== user.id));
    setStored(STORAGE_KEYS.SOCIAL_LIKES, getStored<SocialLike[]>(STORAGE_KEYS.SOCIAL_LIKES, []).filter((like) => like.user_id !== user.id));
    setStored(STORAGE_KEYS.SOCIAL_COMMENT_LIKES, getStored<SocialCommentLike[]>(STORAGE_KEYS.SOCIAL_COMMENT_LIKES, []).filter((like) => like.user_id !== user.id));
    await mockLogout();
    return;
  }

  if (!supabase) throw new Error("Supabase não configurado");
  const { error } = await supabase.rpc("delete_my_account");
  if (error) throw error;
  await supabase.auth.signOut();
}

// 1. CREATE RACE
export async function createRace(input: {
  name: string;
  modality: "running" | "bike" | "other";
  mode: "live" | "time_trial";
  start_lat: number;
  start_lng: number;
  finish_lat: number;
  finish_lng: number;
  finish_radius_m: number;
  is_public?: boolean;
  allow_spectators?: boolean;
  city?: string | null;
  state?: string | null;
  neighborhood?: string | null;
  start_address?: string | null;
  finish_address?: string | null;
  address?: string | null;
  location_notes?: string | null;
  scheduled_at?: string | null;
  route_coords?: { lat: number; lng: number }[] | null;
}): Promise<Race> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized user");
  if (!input.name.trim()) throw new Error("Race name is required");
  if (input.start_lat === 0 && input.start_lng === 0) throw new Error("Start coordinate is invalid");

  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  if (isUsingMock) {
    const races = getStored<Race[]>(STORAGE_KEYS.RACES, []);
    const newRace: Race = {
      id: `race-${Date.now()}`,
      host_user_id: user.id,
      name: input.name,
      modality: input.modality,
      mode: input.mode,
      status: "lobby",
      start_lat: input.start_lat,
      start_lng: input.start_lng,
      finish_lat: input.finish_lat,
      finish_lng: input.finish_lng,
      finish_radius_m: input.finish_radius_m,
      invite_code: inviteCode,
      is_public: input.is_public || false,
      allow_spectators: input.allow_spectators ?? true,
      city: input.city || null,
      state: input.state || null,
      country: user.country || "Brasil",
      neighborhood: input.neighborhood || null,
      start_address: input.start_address || input.address || null,
      finish_address: input.finish_address || null,
      address: input.address || null,
      location_notes: input.location_notes || null,
      scheduled_at: input.scheduled_at || null,
      route_coords: input.route_coords || null,
      started_at: null,
      finished_at: null,
      created_at: new Date().toISOString()
    };
    
    races.push(newRace);
    setStored(STORAGE_KEYS.RACES, races);

    // Add Host to participants automatically
    const participants = getStored<RaceParticipant[]>(STORAGE_KEYS.PARTICIPANTS, []);
    const newParticipant: RaceParticipant = {
      id: `part-${Date.now()}`,
      race_id: newRace.id,
      user_id: user.id,
      display_name: user.display_name,
      color: "#C6FF00", // Volt for host
      joined_at: new Date().toISOString(),
      started_at: null,
      finished_at: null,
      finish_time_ms: null,
      top_speed_kmh: 0,
      abandoned_at: null
    };
    participants.push(newParticipant);
    setStored(STORAGE_KEYS.PARTICIPANTS, participants);
    
    return newRace;
  }

  if (!supabase) throw new Error("Supabase client is offline");

  // Real Database Insertion
  const { data: newRace, error: raceError } = await supabase
    .from("races")
    .insert([{
      host_user_id: user.id,
      name: input.name,
      modality: input.modality,
      mode: input.mode,
      status: "lobby",
      start_lat: input.start_lat,
      start_lng: input.start_lng,
      finish_lat: input.finish_lat,
      finish_lng: input.finish_lng,
      finish_radius_m: input.finish_radius_m,
      invite_code: inviteCode,
      is_public: input.is_public || false,
      allow_spectators: input.allow_spectators ?? true,
      city: input.city || null,
      state: input.state || null,
      country: user.country || "Brasil",
      neighborhood: input.neighborhood || null,
      start_address: input.start_address || input.address || null,
      finish_address: input.finish_address || null,
      address: input.address || null,
      location_notes: input.location_notes || null,
      scheduled_at: input.scheduled_at || null,
      route_coords: input.route_coords || null
    }])
    .select()
    .single();

  if (raceError || !newRace) throw new Error(raceError?.message || "Failed to create race record");

  // Join as Participant
  const { error: partError } = await supabase
    .from("race_participants")
    .insert([{
      race_id: newRace.id,
      user_id: user.id,
      display_name: user.display_name,
      color: "#C6FF00"
    }]);

  if (partError) throw new Error(partError.message);

  return newRace as Race;
}

export async function updateRace(raceId: string, input: {
  name: string;
  modality: "running" | "bike" | "other";
  mode: "live" | "time_trial";
  start_lat: number;
  start_lng: number;
  finish_lat: number;
  finish_lng: number;
  finish_radius_m: number;
  is_public?: boolean;
  allow_spectators?: boolean;
  city?: string | null;
  state?: string | null;
  neighborhood?: string | null;
  start_address?: string | null;
  finish_address?: string | null;
  address?: string | null;
  location_notes?: string | null;
  scheduled_at?: string | null;
  route_coords?: { lat: number; lng: number }[] | null;
}): Promise<Race> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized user");
  if (!input.name.trim()) throw new Error("Race name is required");
  if (input.start_lat === 0 && input.start_lng === 0) throw new Error("Start coordinate is invalid");

  const updates = {
    name: input.name,
    modality: input.modality,
    mode: input.mode,
    start_lat: input.start_lat,
    start_lng: input.start_lng,
    finish_lat: input.finish_lat,
    finish_lng: input.finish_lng,
    finish_radius_m: input.finish_radius_m,
    is_public: input.is_public || false,
    allow_spectators: input.allow_spectators ?? true,
    city: input.city || null,
    state: input.state || null,
    neighborhood: input.neighborhood || null,
    start_address: input.start_address || input.address || null,
    finish_address: input.finish_address || null,
    address: input.address || null,
    location_notes: input.location_notes || null,
    scheduled_at: input.scheduled_at || null,
    route_coords: input.route_coords || null
  };

  if (isUsingMock) {
    const races = getStored<Race[]>(STORAGE_KEYS.RACES, []);
    const raceIdx = races.findIndex((race) => race.id === raceId);
    if (raceIdx === -1) throw new Error("Race not found");
    if (races[raceIdx].host_user_id !== user.id) throw new Error("Only the race host can edit this race");
    if (races[raceIdx].status !== "lobby") throw new Error("Only lobby races can be edited");

    const updatedRace = { ...races[raceIdx], ...updates };
    races[raceIdx] = updatedRace;
    setStored(STORAGE_KEYS.RACES, races);
    mockEmitter.emit(`race_status_changed_${raceId}`, updatedRace);
    return updatedRace;
  }

  if (!supabase) throw new Error("Supabase client is offline");

  const { data: updatedRace, error } = await supabase
    .from("races")
    .update(updates)
    .eq("id", raceId)
    .eq("host_user_id", user.id)
    .eq("status", "lobby")
    .select()
    .single();

  if (error || !updatedRace) throw new Error(error?.message || "Failed to update race");
  return updatedRace as Race;
}

export async function cancelRace(raceId: string): Promise<Race> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized user");

  if (isUsingMock) {
    const races = getStored<Race[]>(STORAGE_KEYS.RACES, []);
    const raceIdx = races.findIndex((race) => race.id === raceId);
    if (raceIdx === -1) throw new Error("Race not found");
    if (races[raceIdx].host_user_id !== user.id) throw new Error("Only the race host can cancel this race");
    if (races[raceIdx].status === "finished" || races[raceIdx].status === "cancelled") {
      throw new Error("This race can no longer be cancelled");
    }

    const updatedRace = { ...races[raceIdx], status: "cancelled" as const };
    races[raceIdx] = updatedRace;
    setStored(STORAGE_KEYS.RACES, races);
    mockEmitter.emit(`race_status_changed_${raceId}`, { status: "cancelled" });
    return updatedRace;
  }

  if (!supabase) throw new Error("Supabase client is offline");

  const { data: updatedRace, error } = await supabase
    .from("races")
    .update({ status: "cancelled" })
    .eq("id", raceId)
    .eq("host_user_id", user.id)
    .in("status", ["lobby", "active"])
    .select()
    .single();

  if (error || !updatedRace) throw new Error(error?.message || "Failed to cancel race");
  return updatedRace as Race;
}

// 2. JOIN RACE BY CODE
export async function joinRace(inviteCode: string): Promise<RaceParticipant> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required to join races");

  if (isUsingMock) {
    const races = getStored<Race[]>(STORAGE_KEYS.RACES, []);
    const race = races.find(r => r.invite_code === inviteCode.toUpperCase());
    if (!race) throw new Error("Invalid or expired invitation code");

    const participants = getStored<RaceParticipant[]>(STORAGE_KEYS.PARTICIPANTS, []);
    
    // Check if user is already participating
    const existing = participants.find(p => p.race_id === race.id && p.user_id === user.id);
    if (existing) return existing;

    // Pick distinct color based on name/index
    const index = participants.filter(p => p.race_id === race.id).length;
    const colors = ["#FF2BD6", "#00E5FF", "#FF6D00", "#2979FF", "#D500F9", "#FFEA00"];
    const color = colors[index % colors.length];

    const newParticipant: RaceParticipant = {
      id: `part-${Date.now()}`,
      race_id: race.id,
      user_id: user.id,
      display_name: user.display_name,
      color,
      joined_at: new Date().toISOString(),
      started_at: null,
      finished_at: null,
      finish_time_ms: null,
      top_speed_kmh: 0,
      abandoned_at: null
    };

    participants.push(newParticipant);
    setStored(STORAGE_KEYS.PARTICIPANTS, participants);
    mockEmitter.emit(`participants_changed_${race.id}`, participants.filter(p => p.race_id === race.id));
    return newParticipant;
  }

  if (!supabase) throw new Error("Supabase is offline");

  // Fetch race record
  const { data: race, error: raceError } = await supabase
    .from("races")
    .select("*")
    .eq("invite_code", inviteCode.toUpperCase())
    .single();

  if (raceError || !race) throw new Error("Race not found. Check the code.");

  // Check participation
  const { data: currentPart } = await supabase
    .from("race_participants")
    .select("*")
    .eq("race_id", race.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (currentPart) return currentPart as RaceParticipant;

  // Pick color
  const { data: otherParts } = await supabase
    .from("race_participants")
    .select("id")
    .eq("race_id", race.id);
    
  const count = otherParts ? otherParts.length : 0;
  const colors = ["#FF2BD6", "#00E5FF", "#FF6D00", "#2979FF", "#D500F9", "#FFEA00"];
  const color = colors[count % colors.length];

  // Join
  const { data: newPart, error: partError } = await supabase
    .from("race_participants")
    .insert([{
      race_id: race.id,
      user_id: user.id,
      display_name: user.display_name,
      color
    }])
    .select()
    .single();

  if (partError || !newPart) throw new Error(partError?.message || "Failed to join race");

  return newPart as RaceParticipant;
}

// 3. START RACE (HOST ONLY)
export async function startRace(raceId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  if (isUsingMock) {
    const races = getStored<Race[]>(STORAGE_KEYS.RACES, []);
    const raceIdx = races.findIndex(r => r.id === raceId);
    if (raceIdx === -1) throw new Error("Race not found");
    
    if (races[raceIdx].host_user_id !== user.id) {
      throw new Error("Only the race host can start the competition");
    }

    const participants = getStored<RaceParticipant[]>(STORAGE_KEYS.PARTICIPANTS, []);
    const raceParticipants = participants.filter(p => p.race_id === raceId);
    if (raceParticipants.length < 1) {
      throw new Error("At least one racer is required to launch the tracking");
    }

    // Set race active
    const startStr = new Date().toISOString();
    races[raceIdx].status = "active";
    races[raceIdx].started_at = startStr;
    setStored(STORAGE_KEYS.RACES, races);

    // Sync participants started_at
    const updatedParticipants = participants.map(p => {
      if (p.race_id === raceId) {
        return { ...p, started_at: startStr };
      }
      return p;
    });
    setStored(STORAGE_KEYS.PARTICIPANTS, updatedParticipants);

    // Emit Realtime event
    mockEmitter.emit(`race_status_changed_${raceId}`, { status: "active", started_at: startStr });
    mockEmitter.emit(`participants_changed_${raceId}`, updatedParticipants.filter(p => p.race_id === raceId));
    
    // Simulate AI bots participating if in Mock Mode for awesome visual feedback!
    if (raceParticipants.length === 1) {
      simulateAiRacer(raceId, races[raceIdx].start_lat, races[raceIdx].start_lng, races[raceIdx].finish_lat, races[raceIdx].finish_lng, races[raceIdx].finish_radius_m);
    }
    return;
  }

  if (!supabase) throw new Error("Supabase is offline");

  // Validate Host
  const { data: race } = await supabase
    .from("races")
    .select("host_user_id")
    .eq("id", raceId)
    .single();

  if (!race || race.host_user_id !== user.id) {
    throw new Error("Only host can initiate active state");
  }

  const startStr = new Date().toISOString();
  
  // Update race status
  const { error: raceError } = await supabase
    .from("races")
    .update({ status: "active", started_at: startStr })
    .eq("id", raceId);

  if (raceError) throw new Error(raceError.message);

  // Update participants starting times
  const { error: partError } = await supabase
    .from("race_participants")
    .update({ started_at: startStr })
    .eq("race_id", raceId);

  if (partError) throw new Error(partError.message);
}

// 4. FINISH PARTICIPANT
export async function finishParticipant(
  raceId: string,
  participantId: string,
  finishTimeMs: number,
  topSpeedKmh: number
): Promise<void> {
  if (isUsingMock) {
    const participants = getStored<RaceParticipant[]>(STORAGE_KEYS.PARTICIPANTS, []);
    const idx = participants.findIndex(p => p.id === participantId);
    if (idx !== -1) {
      participants[idx].finished_at = new Date().toISOString();
      participants[idx].finish_time_ms = finishTimeMs;
      participants[idx].top_speed_kmh = topSpeedKmh;
      setStored(STORAGE_KEYS.PARTICIPANTS, participants);
      
      mockEmitter.emit(`participants_changed_${raceId}`, participants.filter(p => p.race_id === raceId));
      
      // Auto finalize race if everyone has finished
      checkAndAutoFinalizeRace(raceId);
    }
    return;
  }

  if (!supabase) throw new Error("Supabase is offline");

  const { error } = await supabase
    .from("race_participants")
    .update({
      finished_at: new Date().toISOString(),
      finish_time_ms: finishTimeMs,
      top_speed_kmh: topSpeedKmh
    })
    .eq("id", participantId);

  if (error) throw new Error(error.message);

  // Check if we should finalize the whole race
  await autoFinalizeRaceReal(raceId);
}

// 5. ABANDON RACE
export async function abandonRace(raceId: string, participantId: string): Promise<void> {
  if (isUsingMock) {
    const participants = getStored<RaceParticipant[]>(STORAGE_KEYS.PARTICIPANTS, []);
    const idx = participants.findIndex(p => p.id === participantId);
    if (idx !== -1) {
      participants[idx].abandoned_at = new Date().toISOString();
      setStored(STORAGE_KEYS.PARTICIPANTS, participants);
      
      mockEmitter.emit(`participants_changed_${raceId}`, participants.filter(p => p.race_id === raceId));
      
      checkAndAutoFinalizeRace(raceId);
    }
    return;
  }

  if (!supabase) throw new Error("Supabase is offline");

  const { error } = await supabase
    .from("race_participants")
    .update({ abandoned_at: new Date().toISOString() })
    .eq("id", participantId);

  if (error) throw new Error(error.message);

  await autoFinalizeRaceReal(raceId);
}

// 6. FINALIZE/END RACE (HOST ONLY OR AUTO)
export async function finalizeRace(raceId: string): Promise<void> {
  const finishedStr = new Date().toISOString();

  if (isUsingMock) {
    const races = getStored<Race[]>(STORAGE_KEYS.RACES, []);
    const raceIdx = races.findIndex(r => r.id === raceId);
    if (raceIdx === -1) return;

    races[raceIdx].status = "finished";
    races[raceIdx].finished_at = finishedStr;
    setStored(STORAGE_KEYS.RACES, races);

    // Calculate awards immediately!
    await calculateAwards(raceId);

    mockEmitter.emit(`race_status_changed_${raceId}`, { status: "finished", finished_at: finishedStr });
    return;
  }

  if (!supabase) throw new Error("Supabase is offline");

  const { error } = await supabase
    .from("races")
    .update({ status: "finished", finished_at: finishedStr })
    .eq("id", raceId);

  if (error) throw new Error(error.message);

  // Generate awards records
  await calculateAwards(raceId);
}

// 7. GENERATE AWARDS LOGIC
export async function calculateAwards(raceId: string): Promise<RaceAward[]> {
  if (isUsingMock) {
    const participants = getStored<RaceParticipant[]>(STORAGE_KEYS.PARTICIPANTS, []).filter(p => p.race_id === raceId && p.finished_at && !p.abandoned_at);
    const allPositions = getStored<RacePosition[]>(STORAGE_KEYS.POSITIONS, []).filter(p => p.race_id === raceId);
    const awards = getStored<RaceAward[]>(STORAGE_KEYS.AWARDS, []);

    // Clear previous awards for this race
    const filteredAwards = awards.filter(a => a.race_id !== raceId);

    const generatedAwards: RaceAward[] = [];

    if (participants.length === 0) return [];

    // 1. Winner: Fastest finishing time
    const sortedByTime = [...participants].sort((a, b) => (a.finish_time_ms || 9999999) - (b.finish_time_ms || 9999999));
    const winner = sortedByTime[0];
    if (winner && winner.finish_time_ms) {
      const minutes = Math.floor(winner.finish_time_ms / 60000);
      const seconds = ((winner.finish_time_ms % 60000) / 1000).toFixed(1);
      
      generatedAwards.push({
        id: `award-${Date.now()}-1`,
        race_id: raceId,
        participant_id: winner.id,
        award_type: "winner",
        value_text: `Fastest Finish: ${minutes}m ${seconds}s`,
        created_at: new Date().toISOString()
      });
    }

    // 2. Top Speed: Highest speed recorded
    const sortedBySpeed = [...participants].sort((a, b) => b.top_speed_kmh - a.top_speed_kmh);
    const speedChamp = sortedBySpeed[0];
    if (speedChamp && speedChamp.top_speed_kmh > 0) {
      generatedAwards.push({
        id: `award-${Date.now()}-2`,
        race_id: raceId,
        participant_id: speedChamp.id,
        award_type: "top_speed",
        value_text: `Peak Velocity: ${speedChamp.top_speed_kmh.toFixed(1)} km/h`,
        created_at: new Date().toISOString()
      });
    }

    // 3. Pace Setter (Approximate based on who was first in telemetry records)
    // Map recorded timestamps, find the racer with the smallest distance_to_finish at each unique epoch
    const timeBuckets: { [timestamp: string]: { partId: string; dist: number }[] } = {};
    allPositions.forEach(pos => {
      const timeStr = new Date(pos.recorded_at).getSeconds(); // simple grouping
      if (!timeBuckets[timeStr]) timeBuckets[timeStr] = [];
      timeBuckets[timeStr].push({ partId: pos.participant_id, dist: pos.distance_to_finish_m });
    });

    const leadCounts: { [partId: string]: number } = {};
    participants.forEach(p => { leadCounts[p.id] = 0; });

    Object.values(timeBuckets).forEach(bucket => {
      if (bucket.length === 0) return;
      const leader = bucket.reduce((prev, curr) => (curr.dist < prev.dist ? curr : prev));
      if (leadCounts[leader.partId] !== undefined) {
        leadCounts[leader.partId] += 1;
      }
    });

    let paceSetterId = "";
    let maxLeads = 0;
    Object.entries(leadCounts).forEach(([partId, count]) => {
      if (count > maxLeads) {
        maxLeads = count;
        paceSetterId = partId;
      }
    });

    const paceRacer = participants.find(p => p.id === paceSetterId) || winner;
    if (paceRacer) {
      generatedAwards.push({
        id: `award-${Date.now()}-3`,
        race_id: raceId,
        participant_id: paceRacer.id,
        award_type: "pace_setter",
        value_text: "Lead Pace Setter: Held front position for longest stretch",
        created_at: new Date().toISOString()
      });
    }

    // Push new awards
    filteredAwards.push(...generatedAwards);
    setStored(STORAGE_KEYS.AWARDS, filteredAwards);
    return generatedAwards;
  }

  if (!supabase) throw new Error("Supabase is offline");

  // SQL-based calculation and batch insert for server
  // Fetch finished participants
  const { data: participants } = await supabase
    .from("race_participants")
    .select("*")
    .eq("race_id", raceId)
    .is("abandoned_at", null)
    .not("finished_at", "is", null);

  if (!participants || participants.length === 0) return [];

  // Winners
  const sortedByTime = [...participants].sort((a, b) => (a.finish_time_ms || 9999999) - (b.finish_time_ms || 9999999));
  const winner = sortedByTime[0];
  
  // Speed champ
  const sortedBySpeed = [...participants].sort((a, b) => (b.top_speed_kmh || 0) - (a.top_speed_kmh || 0));
  const speedChamp = sortedBySpeed[0];

  const batch: any[] = [];
  if (winner && winner.finish_time_ms) {
    const minutes = Math.floor(winner.finish_time_ms / 60000);
    const seconds = ((winner.finish_time_ms % 60000) / 1000).toFixed(1);
    batch.push({
      race_id: raceId,
      participant_id: winner.id,
      award_type: "winner",
      value_text: `Fastest Finish: ${minutes}m ${seconds}s`
    });
  }

  if (speedChamp && speedChamp.top_speed_kmh > 0) {
    batch.push({
      race_id: raceId,
      participant_id: speedChamp.id,
      award_type: "top_speed",
      value_text: `Peak Velocity: ${Number(speedChamp.top_speed_kmh).toFixed(1)} km/h`
    });
  }

  // Fallback pace setter
  if (winner) {
    batch.push({
      race_id: raceId,
      participant_id: winner.id,
      award_type: "pace_setter",
      value_text: "Lead Pace Setter: Controlled frontline positions"
    });
  }

  // Clear previous and insert
  await supabase.from("race_awards").delete().eq("race_id", raceId);
  const { data: insertedAwards } = await supabase
    .from("race_awards")
    .insert(batch)
    .select();

  return (insertedAwards || []) as RaceAward[];
}

export async function fetchRaceAwards(raceId: string): Promise<RaceAward[]> {
  if (isUsingMock) {
    const awards = getStored<RaceAward[]>(STORAGE_KEYS.AWARDS, []);
    return awards.filter(a => a.race_id === raceId);
  }
  if (!supabase) return [];

  const { data } = await supabase
    .from("race_awards")
    .select("*")
    .eq("race_id", raceId);

  return (data || []) as RaceAward[];
}

// -------------------------------------------------------------
// POST POSITION Telemetry
// -------------------------------------------------------------
export async function postRacePosition(input: {
  race_id: string;
  participant_id: string;
  lat: number;
  lng: number;
  speed_kmh: number;
  distance_to_finish_m: number;
}): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  if (isUsingMock) {
    const positions = getStored<RacePosition[]>(STORAGE_KEYS.POSITIONS, []);
    const newPos: RacePosition = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      race_id: input.race_id,
      participant_id: input.participant_id,
      user_id: user.id,
      lat: input.lat,
      lng: input.lng,
      speed_kmh: input.speed_kmh,
      distance_to_finish_m: input.distance_to_finish_m,
      recorded_at: new Date().toISOString()
    };
    positions.push(newPos);
    setStored(STORAGE_KEYS.POSITIONS, positions);
    
    // Emit Position change
    mockEmitter.emit(`position_added_${input.race_id}`, newPos);
    return;
  }

  if (!supabase) return;

  await supabase
    .from("race_positions")
    .insert([{
      race_id: input.race_id,
      participant_id: input.participant_id,
      user_id: user.id,
      lat: input.lat,
      lng: input.lng,
      speed_kmh: input.speed_kmh,
      distance_to_finish_m: input.distance_to_finish_m
    }]);
}

// -------------------------------------------------------------
// UTILS & AUTO-FINALIZERS FOR SIMULATION
// -------------------------------------------------------------
function checkAndAutoFinalizeRace(raceId: string) {
  const participants = getStored<RaceParticipant[]>(STORAGE_KEYS.PARTICIPANTS, []).filter(p => p.race_id === raceId);
  const activeCount = participants.filter(p => !p.finished_at && !p.abandoned_at).length;
  
  if (activeCount === 0 && participants.length > 0) {
    finalizeRace(raceId);
  }
}

async function autoFinalizeRaceReal(raceId: string) {
  if (!supabase) return;
  const { data: participants } = await supabase
    .from("race_participants")
    .select("finished_at, abandoned_at")
    .eq("race_id", raceId);

  if (!participants || participants.length === 0) return;
  
  const activeCount = participants.filter(p => !p.finished_at && !p.abandoned_at).length;
  if (activeCount === 0) {
    await finalizeRace(raceId);
  }
}

// AI Bot simulation to make single-player testing extremely exciting and dynamic!
function simulateAiRacer(
  raceId: string,
  startLat: number,
  startLng: number,
  finishLat: number,
  finishLng: number,
  radius: number
) {
  const mockNames = ["Lightning⚡Bot", "NeonRider🚴", "CyberRacer🤖"];
  const botName = mockNames[Math.floor(Math.random() * mockNames.length)];
  
  const participants = getStored<RaceParticipant[]>(STORAGE_KEYS.PARTICIPANTS, []);
  const botId = `bot-${Date.now()}`;
  const newPart: RaceParticipant = {
    id: botId,
    race_id: raceId,
    user_id: `user-bot-${Date.now()}`,
    display_name: botName,
    color: "#FF2BD6", // pink for bot
    joined_at: new Date().toISOString(),
    started_at: new Date().toISOString(),
    finished_at: null,
    finish_time_ms: null,
    top_speed_kmh: 0,
    abandoned_at: null
  };
  participants.push(newPart);
  setStored(STORAGE_KEYS.PARTICIPANTS, participants);
  mockEmitter.emit(`participants_changed_${raceId}`, participants.filter(p => p.race_id === raceId));

  // Run the Bot movement interval
  let progress = 0.0;
  const steps = 15 + Math.floor(Math.random() * 10);
  let topSpeed = 0;
  const startTime = Date.now();

  const interval = setInterval(() => {
    // Check if race state is still active
    const races = getStored<Race[]>(STORAGE_KEYS.RACES, []);
    const race = races.find(r => r.id === raceId);
    if (!race || race.status !== "active") {
      clearInterval(interval);
      return;
    }

    progress += 1.0 / steps;
    if (progress >= 1.0) {
      progress = 1.0;
    }

    // Interpolate coordinates
    const lat = startLat + (finishLat - startLat) * progress;
    const lng = startLng + (finishLng - startLng) * progress;
    const speed = 12 + Math.random() * 15; // 12-27 km/h
    if (speed > topSpeed) topSpeed = speed;

    const R = 6371000;
    const dLat = ((finishLat - lat) * Math.PI) / 180;
    const dLon = ((finishLng - lng) * Math.PI) / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat*Math.PI/180) * Math.cos(finishLat*Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distToFinish = R * c;

    // Post bot coordinates
    const positions = getStored<RacePosition[]>(STORAGE_KEYS.POSITIONS, []);
    const botPos: RacePosition = {
      id: Date.now() + Math.floor(Math.random() * 10000),
      race_id: raceId,
      participant_id: botId,
      user_id: newPart.user_id,
      lat,
      lng,
      speed_kmh: speed,
      distance_to_finish_m: distToFinish,
      recorded_at: new Date().toISOString()
    };
    positions.push(botPos);
    setStored(STORAGE_KEYS.POSITIONS, positions);
    mockEmitter.emit(`position_added_${raceId}`, botPos);

    if (progress >= 1.0 || distToFinish <= radius) {
      clearInterval(interval);
      
      // Mark bot finished
      const parts = getStored<RaceParticipant[]>(STORAGE_KEYS.PARTICIPANTS, []);
      const botIdx = parts.findIndex(p => p.id === botId);
      if (botIdx !== -1) {
        parts[botIdx].finished_at = new Date().toISOString();
        parts[botIdx].finish_time_ms = Date.now() - startTime;
        parts[botIdx].top_speed_kmh = topSpeed;
        setStored(STORAGE_KEYS.PARTICIPANTS, parts);
        mockEmitter.emit(`participants_changed_${raceId}`, parts.filter(p => p.race_id === raceId));
        checkAndAutoFinalizeRace(raceId);
      }
    }
  }, 3000);
}

// -------------------------------------------------------------
// LISTING/DASHBOARD QUERIES
// -------------------------------------------------------------
export async function fetchRacesForDashboard(): Promise<{
  created: Race[];
  joined: Race[];
}> {
  const user = await getCurrentUser();
  if (!user) return { created: [], joined: [] };

  if (isUsingMock) {
    const races = getStored<Race[]>(STORAGE_KEYS.RACES, []);
    const participants = getStored<RaceParticipant[]>(STORAGE_KEYS.PARTICIPANTS, []);
    
    const created = races.filter(r => r.host_user_id === user.id);
    const joined = races.filter(r => {
      // Check if user is participant, but NOT the host
      const isPart = participants.some(p => p.race_id === r.id && p.user_id === user.id);
      return isPart && r.host_user_id !== user.id;
    });

    return { created, joined };
  }

  if (!supabase) return { created: [], joined: [] };

  // Fetch host races
  const { data: createdRaces } = await supabase
    .from("races")
    .select("*")
    .eq("host_user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch joined races
  const { data: joinedParticipants } = await supabase
    .from("race_participants")
    .select("race_id")
    .eq("user_id", user.id);

  const raceIds = joinedParticipants ? joinedParticipants.map(jp => jp.race_id) : [];

  if (raceIds.length === 0) {
    return { created: createdRaces || [], joined: [] };
  }

  const { data: joinedRaces } = await supabase
    .from("races")
    .select("*")
    .in("id", raceIds)
    .neq("host_user_id", user.id)
    .order("created_at", { ascending: false });

  return {
    created: createdRaces || [],
    joined: joinedRaces || []
  };
}

export async function fetchRaceById(raceId: string): Promise<Race | null> {
  if (isUsingMock) {
    const races = getStored<Race[]>(STORAGE_KEYS.RACES, []);
    return races.find(r => r.id === raceId) || null;
  }

  if (!supabase) return null;

  const { data } = await supabase
    .from("races")
    .select("*")
    .eq("id", raceId)
    .single();

  return data as Race | null;
}

export async function fetchRaceParticipants(raceId: string): Promise<RaceParticipant[]> {
  if (isUsingMock) {
    const participants = getStored<RaceParticipant[]>(STORAGE_KEYS.PARTICIPANTS, []);
    return participants.filter(p => p.race_id === raceId);
  }

  if (!supabase) return [];

  const { data } = await supabase
    .from("race_participants")
    .select("*")
    .eq("race_id", raceId);

  return (data || []) as RaceParticipant[];
}

export async function fetchRacePositions(raceId: string): Promise<RacePosition[]> {
  if (isUsingMock) {
    const positions = getStored<RacePosition[]>(STORAGE_KEYS.POSITIONS, []);
    return positions.filter(p => p.race_id === raceId);
  }

  if (!supabase) return [];

  const { data } = await supabase
    .from("race_positions")
    .select("*")
    .eq("race_id", raceId)
    .order("recorded_at", { ascending: true });

  return (data || []) as RacePosition[];
}

export async function fetchPublicRaces(): Promise<Race[]> {
  if (isUsingMock) {
    const races = getStored<Race[]>(STORAGE_KEYS.RACES, []);
    
    // Check if we have public races
    const publicRaces = races.filter(r => r.is_public && (r.status === "lobby" || r.status === "active"));
    
    if (publicRaces.length === 0) {
      const seedRaces: Race[] = [
        {
          id: "public-race-1",
          host_user_id: "user-3",
          name: "GP Noturno Paulista 🚴",
          modality: "bike",
          mode: "live",
          status: "lobby",
          start_lat: -23.5615,
          start_lng: -46.6560,
          finish_lat: -23.5678,
          finish_lng: -46.6490,
          finish_radius_m: 30,
          invite_code: "PAULIS",
          is_public: true,
          allow_spectators: true,
          city: "São Paulo",
          state: "SP",
          country: "Brasil",
          neighborhood: "Bela Vista",
          start_address: "Avenida Paulista, Bela Vista, São Paulo - SP, Brasil",
          finish_address: "Rua Itapeva, Bela Vista, São Paulo - SP, Brasil",
          address: "Avenida Paulista, Bela Vista, São Paulo - SP, Brasil",
          location_notes: "Encontro próximo ao vão livre do MASP.",
          scheduled_at: new Date(Date.now() + 86400000).toISOString(),
          route_coords: null,
          started_at: null,
          finished_at: null,
          created_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: "public-race-2",
          host_user_id: "user-2",
          name: "Maratona Verão Copacabana 🏃",
          modality: "running",
          mode: "live",
          status: "lobby",
          start_lat: -22.9710,
          start_lng: -43.1850,
          finish_lat: -22.9820,
          finish_lng: -43.2010,
          finish_radius_m: 35,
          invite_code: "COPACA",
          is_public: true,
          allow_spectators: true,
          city: "Rio de Janeiro",
          state: "RJ",
          country: "Brasil",
          neighborhood: "Copacabana",
          start_address: "Avenida Atlântica, Copacabana, Rio de Janeiro - RJ, Brasil",
          finish_address: "Posto 5, Copacabana, Rio de Janeiro - RJ, Brasil",
          address: "Avenida Atlântica, Copacabana, Rio de Janeiro - RJ, Brasil",
          location_notes: "Concentração no calçadão, próximo ao Posto 5.",
          scheduled_at: new Date(Date.now() + 172800000).toISOString(),
          route_coords: null,
          started_at: null,
          finished_at: null,
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      
      const newRacesList = [...races, ...seedRaces];
      setStored(STORAGE_KEYS.RACES, newRacesList);
      
      // Seed hosts into participants
      const participants = getStored<RaceParticipant[]>(STORAGE_KEYS.PARTICIPANTS, []);
      if (!participants.some(p => p.race_id === "public-race-1")) {
        participants.push({
          id: "part-public-1",
          race_id: "public-race-1",
          user_id: "user-3",
          display_name: "NeonPeddler 🚴",
          color: "#00E5FF",
          joined_at: new Date().toISOString(),
          started_at: null,
          finished_at: null,
          finish_time_ms: null,
          top_speed_kmh: 0,
          abandoned_at: null
        });
      }
      if (!participants.some(p => p.race_id === "public-race-2")) {
        participants.push({
          id: "part-public-2",
          race_id: "public-race-2",
          user_id: "user-2",
          display_name: "SprintQueen 👑",
          color: "#FF2BD6",
          joined_at: new Date().toISOString(),
          started_at: null,
          finished_at: null,
          finish_time_ms: null,
          top_speed_kmh: 0,
          abandoned_at: null
        });
      }
      setStored(STORAGE_KEYS.PARTICIPANTS, participants);
      
      return seedRaces;
    }
    
    return publicRaces;
  }

  if (!supabase) return [];

  const { data } = await supabase
    .from("races")
    .select("*")
    .eq("is_public", true)
    .in("status", ["lobby", "active"])
    .order("created_at", { ascending: false });

  return (data || []) as Race[];
}

export interface HallOfFameEntry {
  user_id: string;
  display_name: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  total_wins: number;
  wins_by_modality: Record<Race["modality"], number>;
  last_win_at: string | null;
}

export async function fetchHallOfFame(): Promise<HallOfFameEntry[]> {
  if (isUsingMock) {
    const races = getStored<Race[]>(STORAGE_KEYS.RACES, []);
    const participants = getStored<RaceParticipant[]>(STORAGE_KEYS.PARTICIPANTS, []);
    const profiles = getStored<Profile[]>(STORAGE_KEYS.PROFILES, defaultProfiles);
    const awards = getStored<RaceAward[]>(STORAGE_KEYS.AWARDS, []).filter(a => a.award_type === "winner");

    const entries = new Map<string, HallOfFameEntry>();

    awards.forEach((award) => {
      const participant = participants.find(p => p.id === award.participant_id);
      const race = races.find(r => r.id === award.race_id);
      if (!participant || !race) return;

      const profile = profiles.find(p => p.id === participant.user_id);
      const current = entries.get(participant.user_id) || {
        user_id: participant.user_id,
        display_name: participant.display_name,
        city: profile?.city || race.city,
        state: profile?.state || race.state,
        country: profile?.country || race.country || "Brasil",
        total_wins: 0,
        wins_by_modality: { running: 0, bike: 0, other: 0 },
        last_win_at: null,
      };

      current.total_wins += 1;
      current.wins_by_modality[race.modality] += 1;
      if (!current.last_win_at || new Date(award.created_at) > new Date(current.last_win_at)) {
        current.last_win_at = award.created_at;
      }
      entries.set(participant.user_id, current);
    });

    return [...entries.values()].sort((a, b) => b.total_wins - a.total_wins || new Date(b.last_win_at || 0).getTime() - new Date(a.last_win_at || 0).getTime());
  }

  if (!supabase) return [];

  const [{ data: awards }, { data: races }, { data: participants }, { data: profiles }] = await Promise.all([
    supabase.from("race_awards").select("*").eq("award_type", "winner"),
    supabase.from("races").select("*"),
    supabase.from("race_participants").select("*"),
    supabase.from("profiles").select("*"),
  ]);

  const raceList = (races || []) as Race[];
  const participantList = (participants || []) as RaceParticipant[];
  const profileList = (profiles || []) as Profile[];
  const entries = new Map<string, HallOfFameEntry>();

  ((awards || []) as RaceAward[]).forEach((award) => {
    const participant = participantList.find(p => p.id === award.participant_id);
    const race = raceList.find(r => r.id === award.race_id);
    if (!participant || !race) return;

    const profile = profileList.find(p => p.id === participant.user_id);
    const current = entries.get(participant.user_id) || {
      user_id: participant.user_id,
      display_name: participant.display_name,
      city: profile?.city || race.city,
      state: profile?.state || race.state,
      country: profile?.country || race.country || null,
      total_wins: 0,
      wins_by_modality: { running: 0, bike: 0, other: 0 },
      last_win_at: null,
    };

    current.total_wins += 1;
    current.wins_by_modality[race.modality] += 1;
    if (!current.last_win_at || new Date(award.created_at) > new Date(current.last_win_at)) {
      current.last_win_at = award.created_at;
    }
    entries.set(participant.user_id, current);
  });

  return [...entries.values()].sort((a, b) => b.total_wins - a.total_wins);
}

export async function fetchSocialFeed(currentUser?: Profile | null): Promise<SocialPost[]> {
  const user = requireSocialUser(currentUser) ?? await getCurrentUser();
  if (!user) return [];

  if (isUsingMock) {
    const posts = getStored<SocialPost[]>(STORAGE_KEYS.SOCIAL_POSTS, defaultSocialPosts);
    const follows = getStored<SocialFollow[]>(STORAGE_KEYS.SOCIAL_FOLLOWS, defaultSocialFollows);
    const likes = getStored<SocialLike[]>(STORAGE_KEYS.SOCIAL_LIKES, []);
    const comments = getStored<SocialComment[]>(STORAGE_KEYS.SOCIAL_COMMENTS, []);
    const commentLikes = getStored<SocialCommentLike[]>(STORAGE_KEYS.SOCIAL_COMMENT_LIKES, []);
    const profiles = getStored<Profile[]>(STORAGE_KEYS.PROFILES, defaultProfiles);
    const profileMap = new Map(profiles.map(p => [p.id, p]));
    const followingIds = new Set(follows.filter(f => f.follower_id === user.id).map(f => f.following_id));
    return posts
      .filter(post => post.user_id === user.id || followingIds.has(post.user_id))
      .map(post => {
        const authorProfile = profileMap.get(post.user_id);
        const postComments = comments
          .filter(comment => comment.post_id === post.id)
          .map(comment => {
            const commentAuthor = profileMap.get(comment.user_id);
            return {
              ...comment,
              display_name: commentAuthor?.display_name || comment.display_name,
              avatar_url: commentAuthor?.avatar_url || null,
              likes_count: commentLikes.filter(like => like.comment_id === comment.id).length,
              liked_by_current_user: commentLikes.some(like => like.comment_id === comment.id && like.user_id === user.id),
            };
          })
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        return {
          ...post,
          display_name: authorProfile?.display_name || post.display_name,
          avatar_url: authorProfile?.avatar_url || post.avatar_url,
          likes_count: likes.filter(like => like.post_id === post.id).length,
          comments_count: postComments.length,
          liked_by_current_user: likes.some(like => like.post_id === post.id && like.user_id === user.id),
          comments: postComments,
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  if (!supabase) return [];

  const { data: follows, error: followsError } = await withTimeout(
    supabase
      .from("social_follows")
      .select("following_id")
      .eq("follower_id", user.id),
    5000,
    "Social follows query timed out",
  );
  if (followsError) throw followsError;
  const ids = [user.id, ...((follows || []) as { following_id: string }[]).map(f => f.following_id)];
  let posts: SocialPost[] = [];
  const personalizedPostsResult = await withTimeout(
    supabase
      .from("social_posts")
      .select("*")
      .in("user_id", ids)
      .order("created_at", { ascending: false }),
    5000,
    "Social posts query timed out",
  );
  if (personalizedPostsResult.error) throw personalizedPostsResult.error;
  posts = (personalizedPostsResult.data || []) as SocialPost[];

  if (posts.length === 0) {
    const communityPostsResult = await withTimeout(
      supabase
        .from("social_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
      5000,
      "Community social posts query timed out",
    );
    if (communityPostsResult.error) throw communityPostsResult.error;
    posts = (communityPostsResult.data || []) as SocialPost[];
  }

  if (posts.length === 0) return [];

  const postIds = posts.map(post => post.id);

  const [
    { data: likes, error: likesError }, 
    { data: comments, error: commentsError }
  ] = await Promise.all([
    withTimeout(
      supabase.from("social_likes").select("*").in("post_id", postIds),
      5000,
      "Social likes query timed out",
    ),
    withTimeout(
      supabase.from("social_comments").select("*").in("post_id", postIds).order("created_at", { ascending: true }),
      5000,
      "Social comments query timed out",
    ),
  ]);
  if (likesError) throw likesError;
  if (commentsError) throw commentsError;

  const likeList = (likes || []) as SocialLike[];
  const commentList = (comments || []) as SocialComment[];

  // Collect all unique user IDs from posts and comments to fetch profiles
  const userIds = Array.from(new Set([
    ...posts.map(post => post.user_id),
    ...commentList.map(comment => comment.user_id)
  ]));

  let profileMap = new Map<string, { display_name: string; avatar_url: string | null }>();
  if (userIds.length > 0) {
    const { data: authorProfiles, error: authorProfilesError } = await withTimeout(
      supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds),
      5000,
      "Social feed author profiles query timed out",
    );
    if (authorProfilesError) throw authorProfilesError;
    (authorProfiles || []).forEach(p => {
      profileMap.set(p.id, p);
    });
  }

  const commentIds = commentList.map(comment => comment.id);
  const { data: commentLikes, error: commentLikesError } = commentIds.length > 0
    ? await withTimeout(
      supabase.from("social_comment_likes").select("*").in("comment_id", commentIds),
      5000,
      "Social comment likes query timed out",
    )
    : { data: [] };
  if (commentLikesError) throw commentLikesError;
  const commentLikeList = (commentLikes || []) as SocialCommentLike[];

  return posts.map(post => {
    const authorProfile = profileMap.get(post.user_id);
    const postComments = commentList
      .filter(comment => comment.post_id === post.id)
      .map(comment => {
        const commentAuthor = profileMap.get(comment.user_id);
        return {
          ...comment,
          display_name: commentAuthor?.display_name || comment.display_name,
          avatar_url: commentAuthor?.avatar_url || null,
          likes_count: commentLikeList.filter(like => like.comment_id === comment.id).length,
          liked_by_current_user: commentLikeList.some(like => like.comment_id === comment.id && like.user_id === user.id),
        };
      });
    return {
      ...post,
      display_name: authorProfile?.display_name || post.display_name,
      avatar_url: authorProfile?.avatar_url || post.avatar_url,
      likes_count: likeList.filter(like => like.post_id === post.id).length,
      comments_count: postComments.length,
      liked_by_current_user: likeList.some(like => like.post_id === post.id && like.user_id === user.id),
      comments: postComments,
    };
  });
}

export async function createSocialPost(content: string, currentUser?: Profile | null, imageUrl?: string | null): Promise<SocialPost> {
  const user = requireSocialUser(currentUser) ?? await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const trimmed = content.trim();
  if (trimmed.length < 1 && !imageUrl) throw new Error("Post content is required");

  if (isUsingMock) {
    const posts = getStored<SocialPost[]>(STORAGE_KEYS.SOCIAL_POSTS, defaultSocialPosts);
    const post: SocialPost = {
      id: `post-${Date.now()}`,
      user_id: user.id,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      content: trimmed,
      image_url: imageUrl || null,
      created_at: new Date().toISOString(),
    };
    posts.unshift(post);
    setStored(STORAGE_KEYS.SOCIAL_POSTS, posts);
    return post;
  }

  if (!supabase) throw new Error("Supabase is offline");
  const { data, error } = await supabase
    .from("social_posts")
    .insert([{ user_id: user.id, display_name: user.display_name, avatar_url: user.avatar_url, content: trimmed, image_url: imageUrl || null }])
    .select()
    .single();
  if (error) throw error;
  return data as SocialPost;
}

export async function toggleSocialLike(postId: string, currentUser?: Profile | null): Promise<void> {
  const user = requireSocialUser(currentUser) ?? await getCurrentUser();
  if (!user) return;

  if (isUsingMock) {
    const likes = getStored<SocialLike[]>(STORAGE_KEYS.SOCIAL_LIKES, []);
    const existing = likes.some(like => like.post_id === postId && like.user_id === user.id);
    const updated = existing
      ? likes.filter(like => !(like.post_id === postId && like.user_id === user.id))
      : [...likes, { post_id: postId, user_id: user.id, created_at: new Date().toISOString() }];
    setStored(STORAGE_KEYS.SOCIAL_LIKES, updated);
    if (!existing) {
      const post = getStored<SocialPost[]>(STORAGE_KEYS.SOCIAL_POSTS, defaultSocialPosts).find(item => item.id === postId);
      if (post?.user_id && post.user_id !== user.id) {
        await createNotification({
          user_id: post.user_id,
          actor_user_id: user.id,
          type: "social_like",
          title: `${user.display_name} curtiu sua postagem`,
          body: "Nova curtida na rede social.",
          target_url: "/social",
          read_at: null,
        });
      }
    }
    return;
  }

  if (!supabase) return;
  const { data: existing } = await supabase
    .from("social_likes")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    await supabase.from("social_likes").delete().eq("post_id", postId).eq("user_id", user.id);
  } else {
    const { data: post } = await supabase.from("social_posts").select("user_id, display_name").eq("id", postId).maybeSingle();
    await supabase.from("social_likes").insert([{ post_id: postId, user_id: user.id }]);
    if (post?.user_id && post.user_id !== user.id) {
      await createNotification({
        user_id: post.user_id,
        actor_user_id: user.id,
        type: "social_like",
        title: `${user.display_name} curtiu sua postagem`,
        body: post.display_name ? "Nova curtida na rede social." : null,
        target_url: "/social",
        read_at: null,
      });
    }
  }
}

export async function toggleSocialCommentLike(commentId: string, currentUser?: Profile | null): Promise<void> {
  const user = requireSocialUser(currentUser) ?? await getCurrentUser();
  if (!user) return;

  if (isUsingMock) {
    const likes = getStored<SocialCommentLike[]>(STORAGE_KEYS.SOCIAL_COMMENT_LIKES, []);
    const existing = likes.some(like => like.comment_id === commentId && like.user_id === user.id);
    const updated = existing
      ? likes.filter(like => !(like.comment_id === commentId && like.user_id === user.id))
      : [...likes, { comment_id: commentId, user_id: user.id, created_at: new Date().toISOString() }];
    setStored(STORAGE_KEYS.SOCIAL_COMMENT_LIKES, updated);
    if (!existing) {
      const comment = getStored<SocialComment[]>(STORAGE_KEYS.SOCIAL_COMMENTS, []).find(item => item.id === commentId);
      if (comment?.user_id && comment.user_id !== user.id) {
        await createNotification({
          user_id: comment.user_id,
          actor_user_id: user.id,
          type: "comment_like",
          title: `${user.display_name} curtiu seu comentário`,
          body: "Nova curtida em um comentário seu.",
          target_url: "/social",
          read_at: null,
        });
      }
    }
    return;
  }

  if (!supabase) return;
  const { data: existing } = await supabase
    .from("social_comment_likes")
    .select("*")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    await supabase.from("social_comment_likes").delete().eq("comment_id", commentId).eq("user_id", user.id);
  } else {
    const { data: comment } = await supabase.from("social_comments").select("user_id, post_id").eq("id", commentId).maybeSingle();
    await supabase.from("social_comment_likes").insert([{ comment_id: commentId, user_id: user.id }]);
    if (comment?.user_id && comment.user_id !== user.id) {
      await createNotification({
        user_id: comment.user_id,
        actor_user_id: user.id,
        type: "comment_like",
        title: `${user.display_name} curtiu seu comentário`,
        body: "Nova curtida em um comentário seu.",
        target_url: "/social",
        read_at: null,
      });
    }
  }
}

export async function createSocialComment(postId: string, content: string, currentUser?: Profile | null): Promise<SocialComment> {
  const user = requireSocialUser(currentUser) ?? await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Comment content is required");

  if (isUsingMock) {
    const comments = getStored<SocialComment[]>(STORAGE_KEYS.SOCIAL_COMMENTS, []);
    const comment: SocialComment = {
      id: `comment-${Date.now()}`,
      post_id: postId,
      user_id: user.id,
      display_name: user.display_name,
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    comments.push(comment);
    setStored(STORAGE_KEYS.SOCIAL_COMMENTS, comments);
    return comment;
  }

  if (!supabase) throw new Error("Supabase is offline");
  const { data, error } = await supabase
    .from("social_comments")
    .insert([{ post_id: postId, user_id: user.id, display_name: user.display_name, content: trimmed }])
    .select()
    .single();
  if (error) throw error;
  return data as SocialComment;
}

export async function fetchSocialProfiles(currentUser?: Profile | null): Promise<SocialProfile[]> {
  const user = requireSocialUser(currentUser) ?? await getCurrentUser();
  if (!user) return [];

  if (isUsingMock) {
    const profiles = getStored<Profile[]>(STORAGE_KEYS.PROFILES, defaultProfiles);
    const follows = getStored<SocialFollow[]>(STORAGE_KEYS.SOCIAL_FOLLOWS, defaultSocialFollows);
    return profiles
      .filter(profile => profile.id !== user.id && profile.is_public !== false)
      .map(profile => ({
        ...profile,
        is_following: follows.some(f => f.follower_id === user.id && f.following_id === profile.id),
        followers_count: follows.filter(f => f.following_id === profile.id).length,
        following_count: follows.filter(f => f.follower_id === profile.id).length,
      }));
  }

  if (!supabase) return [];
  const [{ data: profiles, error: profilesError }, { data: follows, error: followsError }] = await Promise.all([
    withTimeout(
      supabase.from("profiles").select("*").neq("id", user.id).eq("is_public", true),
      5000,
      "Social profiles query timed out",
    ),
    withTimeout(
      supabase.from("social_follows").select("*"),
      5000,
      "Social follows list query timed out",
    ),
  ]);
  if (profilesError) throw profilesError;
  if (followsError) throw followsError;
  const followList = (follows || []) as SocialFollow[];
  return ((profiles || []) as Profile[]).map(profile => ({
    ...profile,
    is_following: followList.some(f => f.follower_id === user.id && f.following_id === profile.id),
    followers_count: followList.filter(f => f.following_id === profile.id).length,
    following_count: followList.filter(f => f.follower_id === profile.id).length,
  }));
}

export async function fetchSocialProfile(profileIdOrUsername: string, currentUser?: Profile | null): Promise<SocialProfile | null> {
  const user = requireSocialUser(currentUser) ?? await getCurrentUser();
  if (!user) return null;

  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(profileIdOrUsername);

  if (isUsingMock) {
    const profiles = getStored<Profile[]>(STORAGE_KEYS.PROFILES, defaultProfiles);
    const follows = getStored<SocialFollow[]>(STORAGE_KEYS.SOCIAL_FOLLOWS, defaultSocialFollows);
    const posts = getStored<SocialPost[]>(STORAGE_KEYS.SOCIAL_POSTS, defaultSocialPosts);
    const profile = profiles.find(item => 
      (isUuid ? item.id === profileIdOrUsername : item.username.toLowerCase() === profileIdOrUsername.toLowerCase()) 
      && item.is_public !== false
    );
    if (!profile) return null;
    return {
      ...profile,
      is_following: follows.some(f => f.follower_id === user.id && f.following_id === profile.id),
      followers_count: follows.filter(f => f.following_id === profile.id).length,
      following_count: follows.filter(f => f.follower_id === profile.id).length,
      posts_count: posts.filter(post => post.user_id === profile.id).length,
    };
  }

  if (!supabase) return null;

  let profileQuery = supabase.from("profiles").select("*").eq("is_public", true);
  if (isUuid) {
    profileQuery = profileQuery.eq("id", profileIdOrUsername);
  } else {
    profileQuery = profileQuery.ilike("username", profileIdOrUsername);
  }

  const { data: profile } = await profileQuery.maybeSingle();
  if (!profile) return null;

  const targetId = profile.id;
  const [{ data: follows }, { count: postsCount }] = await Promise.all([
    supabase.from("social_follows").select("*"),
    supabase.from("social_posts").select("*", { count: "exact", head: true }).eq("user_id", targetId),
  ]);

  const followList = (follows || []) as SocialFollow[];
  return {
    ...(profile as Profile),
    is_following: followList.some(f => f.follower_id === user.id && f.following_id === targetId),
    followers_count: followList.filter(f => f.following_id === targetId).length,
    following_count: followList.filter(f => f.follower_id === targetId).length,
    posts_count: postsCount || 0,
  };
}

export async function followUser(profileId: string, currentUser?: Profile | null): Promise<void> {
  const user = requireSocialUser(currentUser) ?? await getCurrentUser();
  if (!user || user.id === profileId) return;

  if (isUsingMock) {
    const follows = getStored<SocialFollow[]>(STORAGE_KEYS.SOCIAL_FOLLOWS, defaultSocialFollows);
    if (!follows.some(f => f.follower_id === user.id && f.following_id === profileId)) {
      follows.push({ follower_id: user.id, following_id: profileId, created_at: new Date().toISOString() });
      setStored(STORAGE_KEYS.SOCIAL_FOLLOWS, follows);
    }
    return;
  }

  if (!supabase) return;
  await supabase.from("social_follows").insert([{ follower_id: user.id, following_id: profileId }]);
}

export async function unfollowUser(profileId: string, currentUser?: Profile | null): Promise<void> {
  const user = requireSocialUser(currentUser) ?? await getCurrentUser();
  if (!user) return;

  if (isUsingMock) {
    const follows = getStored<SocialFollow[]>(STORAGE_KEYS.SOCIAL_FOLLOWS, defaultSocialFollows)
      .filter(f => !(f.follower_id === user.id && f.following_id === profileId));
    setStored(STORAGE_KEYS.SOCIAL_FOLLOWS, follows);
    return;
  }

  if (!supabase) return;
  await supabase
    .from("social_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", profileId);
}

// -------------------------------------------------------------
// VOLTS AND EMAIL HELPER FUNCTIONS
// -------------------------------------------------------------

export function isActiveVolt(volt: ProfileVolt): boolean {
  return new Date(volt.expires_at).getTime() > Date.now();
}

export function getVoltExpiry(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

export async function resolveLoginEmail(username: string): Promise<string | null> {
  const cleaned = username.trim().toLowerCase();
  if (isUsingMock) {
    const profiles = getStored<Profile[]>(STORAGE_KEYS.PROFILES, defaultProfiles);
    const profile = profiles.find(p => p.username?.toLowerCase() === cleaned);
    return profile?.email || null;
  }
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("username", cleaned)
    .maybeSingle();
  if (error || !data) return null;
  return data.email || null;
}

export async function fetchProfileVolts(profileId: string): Promise<ProfileVolt[]> {
  const currentUser = await getCurrentUser().catch(() => null);

  if (isUsingMock) {
    const storedVolts = getStored<ProfileVolt[]>(STORAGE_KEYS.PROFILE_VOLTS, []);
    const activeVolts = storedVolts.filter(isActiveVolt);
    if (activeVolts.length !== storedVolts.length) {
      setStored(STORAGE_KEYS.PROFILE_VOLTS, activeVolts);
    }
    const likes = getStored<ProfileVoltLike[]>(STORAGE_KEYS.PROFILE_VOLT_LIKES, []);
    return activeVolts
      .filter(volt => volt.user_id === profileId)
      .map(volt => ({
        ...volt,
        likes_count: likes.filter(l => l.volt_id === volt.id).length,
        liked_by_current_user: currentUser ? likes.some(l => l.volt_id === volt.id && l.user_id === currentUser.id) : false
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  if (!supabase) return [];
  const { data, error } = await supabase
    .from("profile_volts")
    .select("*")
    .eq("user_id", profileId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;

  const volts = (data || []) as ProfileVolt[];
  if (volts.length > 0) {
    try {
      const voltIds = volts.map(v => v.id);
      const [likesRes, myLikeRes] = await Promise.all([
        supabase.from("profile_volt_likes").select("volt_id").in("volt_id", voltIds),
        currentUser ? supabase.from("profile_volt_likes").select("volt_id").in("volt_id", voltIds).eq("user_id", currentUser.id) : Promise.resolve({ data: [] })
      ]);
      const likesList = (likesRes.data || []) as ProfileVoltLike[];
      const myLikesList = (myLikeRes.data || []) as ProfileVoltLike[];
      return volts.map(volt => ({
        ...volt,
        likes_count: likesList.filter(l => l.volt_id === volt.id).length,
        liked_by_current_user: myLikesList.some(l => l.volt_id === volt.id)
      }));
    } catch (err) {
      console.warn("Erro ao carregar curtidas de Volts (a tabela pode não existir):", err);
      return volts.map(volt => ({
        ...volt,
        likes_count: 0,
        liked_by_current_user: false
      }));
    }
  }
  return volts;
}

export async function createProfileVolt(file: File, caption = ""): Promise<ProfileVolt> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado");
  const imageUrl = await uploadMediaImage(file, "social");
  const safeCaption = sanitizeOptionalText(caption, 120);
  const safeImageUrl = sanitizeImageUrl(imageUrl);
  const expiresAt = getVoltExpiry();

  if (isUsingMock) {
    const volts = getStored<ProfileVolt[]>(STORAGE_KEYS.PROFILE_VOLTS, []).filter(isActiveVolt);
    const volt: ProfileVolt = {
      id: `profile-volt-${Date.now()}`,
      user_id: user.id,
      image_url: safeImageUrl,
      caption: safeCaption,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
    };
    volts.unshift(volt);
    setStored(STORAGE_KEYS.PROFILE_VOLTS, volts);
    return volt;
  }

  if (!supabase) throw new Error("Supabase não configurado");
  const { data, error } = await supabase
    .from("profile_volts")
    .insert([{ user_id: user.id, image_url: safeImageUrl, caption: safeCaption, expires_at: expiresAt }])
    .select()
    .single();
  if (error) throw error;
  return data as ProfileVolt;
}

export async function toggleVoltLike(voltId: string, currentUser?: Profile | null): Promise<void> {
  const user = requireSocialUser(currentUser) ?? await getCurrentUser();
  if (!user) return;

  if (isUsingMock) {
    const likes = getStored<ProfileVoltLike[]>(STORAGE_KEYS.PROFILE_VOLT_LIKES, []);
    const existing = likes.some(l => l.volt_id === voltId && l.user_id === user.id);
    const updated = existing
      ? likes.filter(l => !(l.volt_id === voltId && l.user_id === user.id))
      : [...likes, { volt_id: voltId, user_id: user.id, created_at: new Date().toISOString() }];
    setStored(STORAGE_KEYS.PROFILE_VOLT_LIKES, updated);
    return;
  }

  if (!supabase) return;
  const { data: existing } = await supabase
    .from("profile_volt_likes")
    .select("*")
    .eq("volt_id", voltId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("profile_volt_likes").delete().eq("volt_id", voltId).eq("user_id", user.id);
  } else {
    await supabase.from("profile_volt_likes").insert([{ volt_id: voltId, user_id: user.id }]);
  }
}

export async function fetchFeedVolts(currentUser?: Profile | null): Promise<(ProfileVolt & { display_name: string; avatar_url: string | null })[]> {
  const user = requireSocialUser(currentUser) ?? await getCurrentUser();
  if (!user) return [];

  if (isUsingMock) {
    const volts = getStored<ProfileVolt[]>(STORAGE_KEYS.PROFILE_VOLTS, []).filter(isActiveVolt);
    const follows = getStored<SocialFollow[]>(STORAGE_KEYS.SOCIAL_FOLLOWS, defaultSocialFollows);
    const followingIds = new Set(follows.filter(f => f.follower_id === user.id).map(f => f.following_id));
    
    const profiles = getStored<Profile[]>(STORAGE_KEYS.PROFILES, defaultProfiles);
    const profileMap = new Map(profiles.map(p => [p.id, p]));
    const currentUserProfile = profileMap.get(user.id) || user;

    const feedVolts = volts.filter(v => v.user_id === user.id || followingIds.has(v.user_id));
    const likes = getStored<ProfileVoltLike[]>(STORAGE_KEYS.PROFILE_VOLT_LIKES, []);

    return feedVolts.map(volt => {
      const p = volt.user_id === user.id ? currentUserProfile : profileMap.get(volt.user_id);
      return {
        ...volt,
        display_name: p?.display_name || "Atleta",
        avatar_url: p?.avatar_url || null,
        likes_count: likes.filter(l => l.volt_id === volt.id).length,
        liked_by_current_user: likes.some(l => l.volt_id === volt.id && l.user_id === user.id)
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  if (!supabase) return [];

  // Fetch followed users
  const { data: follows, error: followsError } = await withTimeout(
    supabase
      .from("social_follows")
      .select("following_id")
      .eq("follower_id", user.id),
    5000,
    "Social follows query timed out",
  );
  if (followsError) throw followsError;

  const ids = [user.id, ...((follows || []) as { following_id: string }[]).map(f => f.following_id)];

  // Fetch volts
  const { data: voltsData, error } = await supabase
    .from("profile_volts")
    .select("*")
    .in("user_id", ids)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;

  const volts = (voltsData || []) as ProfileVolt[];
  if (volts.length === 0) return [];

  const distinctUserIds = Array.from(new Set(volts.map(v => v.user_id)));
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", distinctUserIds);

  const voltIds = volts.map(v => v.id);
  const [likesRes, myLikeRes] = await Promise.all([
    supabase.from("profile_volt_likes").select("volt_id").in("volt_id", voltIds),
    supabase.from("profile_volt_likes").select("volt_id").in("volt_id", voltIds).eq("user_id", user.id)
  ]);
  const likesList = (likesRes.data || []) as ProfileVoltLike[];
  const myLikesList = (myLikeRes.data || []) as ProfileVoltLike[];

  return volts.map(volt => {
    const p = (profilesData || []).find(profile => profile.id === volt.user_id);
    return {
      ...volt,
      display_name: p?.display_name || "Atleta",
      avatar_url: p?.avatar_url || null,
      likes_count: likesList.filter(l => l.volt_id === volt.id).length,
      liked_by_current_user: myLikesList.some(l => l.volt_id === volt.id)
    };
  });
}

export async function fetchActiveVoltsUsers(): Promise<string[]> {
  if (isUsingMock) {
    const volts = getStored<ProfileVolt[]>(STORAGE_KEYS.PROFILE_VOLTS, []).filter(isActiveVolt);
    return Array.from(new Set(volts.map(v => v.user_id)));
  }

  if (!supabase) return [];
  const { data, error } = await supabase
    .from("profile_volts")
    .select("user_id")
    .gt("expires_at", new Date().toISOString());
  if (error) throw error;
  return Array.from(new Set((data || []).map((item: any) => item.user_id)));
}

export interface AdminStats {
  users: number;
  races: number;
  posts: number;
  volts: number;
}

export async function adminFetchStats(): Promise<AdminStats> {
  if (isUsingMock) {
    const profiles = getStored<Profile[]>(STORAGE_KEYS.PROFILES, defaultProfiles);
    const races = getStored<Race[]>(STORAGE_KEYS.RACES, []);
    const posts = getStored<SocialPost[]>(STORAGE_KEYS.SOCIAL_POSTS, defaultSocialPosts);
    const volts = getStored<ProfileVolt[]>(STORAGE_KEYS.PROFILE_VOLTS, []);
    return {
      users: profiles.length,
      races: races.length,
      posts: posts.length,
      volts: volts.length
    };
  }

  if (!supabase) return { users: 0, races: 0, posts: 0, volts: 0 };
  const [usersRes, racesRes, postsRes, voltsRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("races").select("id", { count: "exact", head: true }),
    supabase.from("social_posts").select("id", { count: "exact", head: true }),
    supabase.from("profile_volts").select("id", { count: "exact", head: true })
  ]);

  return {
    users: usersRes.count || 0,
    races: racesRes.count || 0,
    posts: postsRes.count || 0,
    volts: voltsRes.count || 0
  };
}

export async function adminFetchUsers(): Promise<Profile[]> {
  if (isUsingMock) {
    return getStored<Profile[]>(STORAGE_KEYS.PROFILES, defaultProfiles);
  }
  if (!supabase) return [];
  const { data, error } = await supabase.from("profiles").select("*").order("display_name");
  if (error) throw error;
  return data as Profile[];
}

export async function adminUpdateUser(userId: string, data: Partial<Profile>): Promise<void> {
  if (isUsingMock) {
    const profiles = getStored<Profile[]>(STORAGE_KEYS.PROFILES, defaultProfiles);
    const idx = profiles.findIndex(p => p.id === userId);
    if (idx !== -1) {
      profiles[idx] = { ...profiles[idx], ...data };
      setStored(STORAGE_KEYS.PROFILES, profiles);
    }
    return;
  }
  if (!supabase) return;
  const { error } = await supabase.from("profiles").update(data).eq("id", userId);
  if (error) throw error;
}

export async function adminDeleteUser(userId: string): Promise<void> {
  if (isUsingMock) {
    const profiles = getStored<Profile[]>(STORAGE_KEYS.PROFILES, defaultProfiles).filter(p => p.id !== userId);
    setStored(STORAGE_KEYS.PROFILES, profiles);
    return;
  }
  if (!supabase) return;
  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  if (error) throw error;
}

export async function adminFetchAllPosts(): Promise<(SocialPost & { display_name: string; username: string })[]> {
  if (isUsingMock) {
    const posts = getStored<SocialPost[]>(STORAGE_KEYS.SOCIAL_POSTS, defaultSocialPosts);
    const profiles = getStored<Profile[]>(STORAGE_KEYS.PROFILES, defaultProfiles);
    const comments = getStored<SocialComment[]>(STORAGE_KEYS.SOCIAL_COMMENTS, []);
    const commentLikes = getStored<SocialCommentLike[]>(STORAGE_KEYS.SOCIAL_COMMENT_LIKES, []);
    const likes = getStored<SocialLike[]>(STORAGE_KEYS.SOCIAL_LIKES, []);
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    return posts.map(post => {
      const p = profileMap.get(post.user_id);
      const postComments = comments
        .filter(comment => comment.post_id === post.id)
        .map(comment => {
          const commentAuthor = profileMap.get(comment.user_id);
          return {
            ...comment,
            display_name: commentAuthor?.display_name || comment.display_name,
            avatar_url: commentAuthor?.avatar_url || null,
            likes_count: commentLikes.filter(like => like.comment_id === comment.id).length,
            liked_by_current_user: commentLikes.some(like => like.comment_id === comment.id && like.user_id === post.user_id),
          };
        })
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      return {
        ...post,
        display_name: p?.display_name || post.display_name || "Atleta",
        username: p?.username || "atleta",
        comments: postComments,
        comments_count: postComments.length,
        likes_count: likes.filter(like => like.post_id === post.id).length
      };
    });
  }

  if (!supabase) return [];
  const { data: posts, error: postsError } = await supabase.from("social_posts").select("*").order("created_at", { ascending: false });
  if (postsError) throw postsError;
  
  if (posts.length === 0) return [];
  const postIds = posts.map(post => post.id);

  const [{ data: comments }, { data: likes }, { data: commentLikes }] = await Promise.all([
    supabase.from("social_comments").select("*").in("post_id", postIds).order("created_at", { ascending: true }),
    supabase.from("social_likes").select("*").in("post_id", postIds),
    supabase.from("social_comment_likes").select("*")
  ]);

  const distinctUserIds = Array.from(new Set([
    ...posts.map(post => post.user_id),
    ...(comments || []).map(comment => comment.user_id)
  ]));

  const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id, display_name, username, avatar_url").in("id", distinctUserIds);
  if (profilesError) throw profilesError;

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));
  const likesList = (likes || []) as SocialLike[];
  const commentsList = (comments || []) as SocialComment[];
  const commentLikesList = (commentLikes || []) as SocialCommentLike[];

  return posts.map(post => {
    const p = profileMap.get(post.user_id);
    const postComments = commentsList
      .filter(c => c.post_id === post.id)
      .map(c => {
        const cAuthor = profileMap.get(c.user_id);
        return {
          ...c,
          display_name: cAuthor?.display_name || c.display_name,
          avatar_url: cAuthor?.avatar_url || null,
          likes_count: commentLikesList.filter(l => l.comment_id === c.id).length,
          liked_by_current_user: commentLikesList.some(l => l.comment_id === c.id && l.user_id === post.user_id)
        };
      });

    return {
      ...post,
      display_name: p?.display_name || "Atleta",
      username: p?.username || "atleta",
      comments: postComments,
      comments_count: postComments.length,
      likes_count: likesList.filter(l => l.post_id === post.id).length
    };
  });
}

export async function adminDeletePost(postId: string): Promise<void> {
  if (isUsingMock) {
    const posts = getStored<SocialPost[]>(STORAGE_KEYS.SOCIAL_POSTS, defaultSocialPosts).filter(p => p.id !== postId);
    setStored(STORAGE_KEYS.SOCIAL_POSTS, posts);
    return;
  }
  if (!supabase) return;
  const { error } = await supabase.from("social_posts").delete().eq("id", postId);
  if (error) throw error;
}

export async function adminDeleteComment(commentId: string): Promise<void> {
  if (isUsingMock) {
    const comments = getStored<SocialComment[]>(STORAGE_KEYS.SOCIAL_COMMENTS, []).filter(c => c.id !== commentId);
    setStored(STORAGE_KEYS.SOCIAL_COMMENTS, comments);
    return;
  }
  if (!supabase) return;
  const { error } = await supabase.from("social_comments").delete().eq("id", commentId);
  if (error) throw error;
}

export async function adminFetchAllRaces(): Promise<Race[]> {
  if (isUsingMock) {
    return getStored<Race[]>(STORAGE_KEYS.RACES, []);
  }
  if (!supabase) return [];
  const { data, error } = await supabase.from("races").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as Race[];
}

export async function adminCancelRace(raceId: string): Promise<void> {
  if (isUsingMock) {
    const races = getStored<Race[]>(STORAGE_KEYS.RACES, []);
    const idx = races.findIndex(r => r.id === raceId);
    if (idx !== -1) {
      races[idx] = { ...races[idx], status: "cancelled" };
      setStored(STORAGE_KEYS.RACES, races);
    }
    return;
  }
  if (!supabase) return;
  const { error } = await supabase.from("races").update({ status: "cancelled" }).eq("id", raceId);
  if (error) throw error;
}

// Routes administration functions deleted (Routes are integrated as part of Races GP model)

// -------------------------------------------------------------
// REPORTS AND ABUSE SYSTEM
// -------------------------------------------------------------
export async function submitReport(
  reporterId: string,
  targetType: "post" | "comment" | "volt" | "profile",
  targetId: string,
  reason: string
): Promise<AppReport> {
  const newReport: AppReport = {
    id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    reporter_id: reporterId,
    target_type: targetType,
    target_id: targetId,
    reason: reason,
    status: "pending",
    created_at: new Date().toISOString()
  };

  if (isUsingMock) {
    const reports = getStored<AppReport[]>(STORAGE_KEYS.SOCIAL_REPORTS, []);
    reports.unshift(newReport);
    setStored(STORAGE_KEYS.SOCIAL_REPORTS, reports);
    return newReport;
  }
  
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("social_reports").insert(newReport).select().single();
  if (error) throw error;
  return data as AppReport;
}

export async function adminFetchReports(): Promise<AppReport[]> {
  if (isUsingMock) {
    return getStored<AppReport[]>(STORAGE_KEYS.SOCIAL_REPORTS, []);
  }
  if (!supabase) return [];
  const { data, error } = await supabase.from("social_reports").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as AppReport[];
}

export async function adminResolveReport(reportId: string, action: "dismiss" | "act"): Promise<void> {
  const newStatus = action === "dismiss" ? "dismissed" : "acted";
  if (isUsingMock) {
    const reports = getStored<AppReport[]>(STORAGE_KEYS.SOCIAL_REPORTS, []);
    const idx = reports.findIndex(r => r.id === reportId);
    if (idx !== -1) {
      reports[idx].status = newStatus;
      setStored(STORAGE_KEYS.SOCIAL_REPORTS, reports);
    }
    return;
  }
  if (!supabase) return;
  const { error } = await supabase.from("social_reports").update({ status: newStatus }).eq("id", reportId);
  if (error) throw error;
}

// -------------------------------------------------------------
// ADVANCED ADMIN FUNCTIONS (Volts, Photos, Participants)
// -------------------------------------------------------------
export async function adminFetchAllVolts(): Promise<ProfileVolt[]> {
  if (isUsingMock) {
    return getStored<ProfileVolt[]>(STORAGE_KEYS.PROFILE_VOLTS, []);
  }
  if (!supabase) return [];
  const { data, error } = await supabase.from("profile_volts").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as ProfileVolt[];
}

export async function adminDeleteVolt(voltId: string): Promise<void> {
  if (isUsingMock) {
    const volts = getStored<ProfileVolt[]>(STORAGE_KEYS.PROFILE_VOLTS, []).filter(v => v.id !== voltId);
    setStored(STORAGE_KEYS.PROFILE_VOLTS, volts);
    return;
  }
  if (!supabase) return;
  const { error } = await supabase.from("profile_volts").delete().eq("id", voltId);
  if (error) throw error;
}

export async function adminFetchAllProfilePhotos(): Promise<ProfilePhoto[]> {
  if (isUsingMock) {
    return getStored<ProfilePhoto[]>(STORAGE_KEYS.PROFILE_PHOTOS, []);
  }
  if (!supabase) return [];
  const { data, error } = await supabase.from("profile_photos").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as ProfilePhoto[];
}

export async function adminDeleteProfilePhoto(photoId: string): Promise<void> {
  if (isUsingMock) {
    const photos = getStored<ProfilePhoto[]>(STORAGE_KEYS.PROFILE_PHOTOS, []).filter(p => p.id !== photoId);
    setStored(STORAGE_KEYS.PROFILE_PHOTOS, photos);
    return;
  }
  if (!supabase) return;
  const { error } = await supabase.from("profile_photos").delete().eq("id", photoId);
  if (error) throw error;
}

export async function adminFetchRaceParticipants(raceId: string): Promise<RaceParticipant[]> {
  if (isUsingMock) {
    const all = getStored<RaceParticipant[]>(STORAGE_KEYS.PARTICIPANTS, []);
    return all.filter(p => p.race_id === raceId);
  }
  if (!supabase) return [];
  const { data, error } = await supabase.from("race_participants").select("*").eq("race_id", raceId);
  if (error) throw error;
  return data as RaceParticipant[];
}

export async function adminKickParticipant(raceId: string, userId: string): Promise<void> {
  if (isUsingMock) {
    const participants = getStored<RaceParticipant[]>(STORAGE_KEYS.PARTICIPANTS, []);
    const filtered = participants.filter(p => !(p.race_id === raceId && p.user_id === userId));
    setStored(STORAGE_KEYS.PARTICIPANTS, filtered);
    return;
  }
  if (!supabase) return;
  const { error } = await supabase.from("race_participants").delete().eq("race_id", raceId).eq("user_id", userId);
  if (error) throw error;
}

export async function adminForceFinishRace(raceId: string): Promise<void> {
  if (isUsingMock) {
    const races = getStored<Race[]>(STORAGE_KEYS.RACES, []);
    const idx = races.findIndex(r => r.id === raceId);
    if (idx !== -1) {
      races[idx].status = "finished";
      setStored(STORAGE_KEYS.RACES, races);
    }
    return;
  }
  if (!supabase) return;
  const { error } = await supabase.from("races").update({ status: "finished" }).eq("id", raceId);
  if (error) throw error;
}
