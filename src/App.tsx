import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast";
import { AuthProvider, AuthGuard } from "./components/auth/AuthGuard";
import { I18nProvider } from "./components/i18n/I18nProvider";

// Route View screens
import LandingPage from "./routes/LandingPage";
import Terms from "./routes/Terms";
import Privacy from "./routes/Privacy";
import Login from "./routes/Login";
import Dashboard from "./routes/Dashboard";
import CreateRace from "./routes/CreateRace";
import JoinRace from "./routes/JoinRace";
import LiveRace from "./routes/LiveRace";
import Results from "./routes/Results";
import PublicRaces from "./routes/PublicRaces";
import WatchRace from "./routes/WatchRace";
import HallOfFame from "./routes/HallOfFame";
import Social from "./routes/Social";
import PublicProfile from "./routes/PublicProfile";
import StravaCallback from "./routes/StravaCallback";

// ---------- Theme Context ----------
interface ThemeContextValue {
  theme: "dark" | "light";
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);
// -----------------------------------

export const App: React.FC = () => {
  const themeStorageKey = "velocity_theme";
  const themePreferenceKey = "velozty_theme_preference_set";
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem(themeStorageKey);
    const hasExplicitPreference = localStorage.getItem(themePreferenceKey) === "true";
    return hasExplicitPreference && saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
    localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  const toggleTheme = () => {
    localStorage.setItem(themePreferenceKey, "true");
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <I18nProvider>
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <div className="relative min-h-screen">
                <Routes>
                
                {/* PUBLIC LANDING PAGE */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                
                {/* APPLICATION ROUTE BOUNDARY */}
                <Route path="/app">
                  <Route index element={<Navigate to="/app/dashboard" replace />} />
                  <Route path="login" element={<Login />} />
                  <Route
                    path="dashboard"
                    element={
                      <AuthGuard>
                        <Dashboard />
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="races/new"
                    element={
                      <AuthGuard>
                        <CreateRace />
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="races/public"
                    element={
                      <AuthGuard>
                        <PublicRaces />
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="hall-of-fame"
                    element={
                      <AuthGuard>
                        <HallOfFame />
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="social"
                    element={
                      <AuthGuard>
                        <Social />
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="profile/:id"
                    element={
                      <AuthGuard>
                        <PublicProfile />
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="strava/callback"
                    element={
                      <AuthGuard>
                        <StravaCallback />
                      </AuthGuard>
                    }
                  />
                  <Route path="watch/:id" element={<WatchRace />} />
                  <Route
                    path="join/:code"
                    element={
                      <AuthGuard>
                        <JoinRace />
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="races/:id/edit"
                    element={
                      <AuthGuard>
                        <CreateRace />
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="races/:id"
                    element={
                      <AuthGuard>
                        <LiveRace />
                      </AuthGuard>
                    }
                  />
                  <Route
                    path="races/:id/results"
                    element={
                      <AuthGuard>
                        <Results />
                      </AuthGuard>
                    }
                  />
                </Route>

                {/* DEFAULT FALLBACK REDIRECT */}
                <Route path="*" element={<Navigate to="/" replace />} />
                
                </Routes>
              </div>
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </I18nProvider>
    </ThemeContext.Provider>
  );
};

export default App;
