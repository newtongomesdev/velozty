import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, mockLogin, mockLogout, isUsingMock, supabase, mockEmitter } from "../../lib/supabase";
import type { Profile } from "../../lib/supabase";
import { useI18n } from "../i18n/I18nProvider";

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  signInUser: (email: string, password: string) => Promise<void>;
  signUpUser: (email: string, password: string, displayName: string) => Promise<{ needsEmailConfirmation: boolean }>;
  loginWithProvider: (provider: "google" | "apple") => Promise<void>;
  logoutUser: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize and subscribe
  useEffect(() => {
    let active = true;

    async function checkSession() {
      console.log("DEBUG [checkSession] Running initial session check...");
      try {
        const currentUser = await getCurrentUser();
        console.log("DEBUG [checkSession] Finished checking session. User:", currentUser?.id || "None");
        if (active) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error("DEBUG [checkSession] Error verifying authentication state:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    checkSession();

    // Subscribe to changes
    if (isUsingMock) {
      console.log("DEBUG [AuthGuard] Initializing with Local Mock Mode");
      const unsub = mockEmitter.subscribe("auth_change", (newUser: Profile | null) => {
        console.log("DEBUG [AuthGuard] auth_change event (MOCK):", newUser?.id || "None");
        setUser(newUser);
      });
      return () => {
        active = false;
        unsub();
      };
    } else if (supabase) {
      console.log("DEBUG [AuthGuard] Initializing with Real Supabase Mode");
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("DEBUG [onAuthStateChange] Event:", event, "User ID in session:", session?.user?.id || "None");
        if (session?.user) {
          console.log("DEBUG [onAuthStateChange] Session user detected. Loading profile...");
          const u = await getCurrentUser();
          console.log("DEBUG [onAuthStateChange] Profile loaded:", u?.id || "None");
          setUser(u);
        } else {
          console.log("DEBUG [onAuthStateChange] No session user. Setting user to null.");
          setUser(null);
        }
        console.log("DEBUG [onAuthStateChange] Setting auth loading state to false.");
        setLoading(false);
      });

      return () => {
        active = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      active = false;
    };
  }, []);

  const signInUser = async (email: string, password: string) => {
    console.log("DEBUG [signInUser] Starting login for email:", email);
    setLoading(true);
    try {
      if (isUsingMock) {
        console.log("DEBUG [signInUser] Logging in with Mock Mode...");
        const u = await mockLogin(email);
        setUser(u);
      } else if (supabase) {
        console.log("DEBUG [signInUser] Sending auth.signInWithPassword to Supabase...");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          console.error("DEBUG [signInUser] Supabase signInWithPassword returned error:", error);
          throw error;
        }
        console.log("DEBUG [signInUser] Supabase signInWithPassword completed successfully!");
      }
    } finally {
      console.log("DEBUG [signInUser] Setting loading state to false in finally block.");
      setLoading(false);
    }
  };

  const signUpUser = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      if (isUsingMock) {
        const u = await mockLogin(email, displayName);
        setUser(u);
        return { needsEmailConfirmation: false };
      } else if (supabase) {
        const redirectTo = `${window.location.origin}/app/login`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: { display_name: displayName.trim() || email.split("@")[0] }
          }
        });
        if (error) throw error;
        return { needsEmailConfirmation: !data.session };
      }
      return { needsEmailConfirmation: false };
    } finally {
      setLoading(false);
    }
  };

  const loginWithProvider = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      if (isUsingMock) {
        const mockName = provider === "google" ? "Atleta Google" : "Atleta Apple";
        const mockEmail = `${provider}-athlete@velozty.com`;
        const u = await mockLogin(mockEmail, mockName);
        setUser(u);
      } else if (supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/app/dashboard`,
          },
        });
        if (error) throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    setLoading(true);
    try {
      if (isUsingMock) {
        await mockLogout();
        setUser(null);
      } else if (supabase) {
        await supabase.auth.signOut();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    if (isUsingMock) {
      return;
    }

    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/app/login`,
      });
      if (error) throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInUser, signUpUser, loginWithProvider, logoutUser, requestPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/app/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100vh] bg-darkbg text-white">
        <div className="relative flex items-center justify-center w-16 h-16 mb-4">
          <span className="absolute inline-flex h-full w-full rounded-full bg-volt opacity-25 animate-ping"></span>
          <div className="relative w-8 h-8 rounded-full border-t-2 border-volt animate-spin"></div>
        </div>
        <h2 className="text-sm font-black tracking-widest text-volt uppercase animate-pulse">
          {t("app.telemetry")}
        </h2>
        <span className="text-[9px] font-bold text-mutedgray uppercase tracking-widest mt-1">
          {t("common.loading")}
        </span>
      </div>
    );
  }

  return user ? <>{children}</> : null;
};
