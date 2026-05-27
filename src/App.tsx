import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast";
import { AuthProvider, AuthGuard } from "./components/auth/AuthGuard";
import { I18nProvider } from "./components/i18n/I18nProvider";

// Route View screens
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

// ---------- Theme Context ----------
interface ThemeContextValue {
  theme: "dark" | "light";
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);
// -----------------------------------

export const App: React.FC = () => {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("velocity_theme");
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
    localStorage.setItem("velocity_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
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
                
                {/* PUBLIC GATE */}
                <Route path="/login" element={<Login />} />
                
                {/* PROTECTED TELEMETRY TERMINALS */}
                <Route
                  path="/dashboard"
                  element={
                    <AuthGuard>
                      <Dashboard />
                    </AuthGuard>
                  }
                />
                
                <Route
                  path="/races/new"
                  element={
                    <AuthGuard>
                      <CreateRace />
                    </AuthGuard>
                  }
                />

                <Route
                  path="/races/public"
                  element={
                    <AuthGuard>
                      <PublicRaces />
                    </AuthGuard>
                  }
                />

                <Route
                  path="/hall-of-fame"
                  element={
                    <AuthGuard>
                      <HallOfFame />
                    </AuthGuard>
                  }
                />

                <Route
                  path="/social"
                  element={
                    <AuthGuard>
                      <Social />
                    </AuthGuard>
                  }
                />

                <Route
                  path="/profile/:id"
                  element={
                    <AuthGuard>
                      <PublicProfile />
                    </AuthGuard>
                  }
                />

                <Route path="/watch/:id" element={<WatchRace />} />
                
                <Route
                  path="/join/:code"
                  element={
                    <AuthGuard>
                      <JoinRace />
                    </AuthGuard>
                  }
                />
                
                <Route
                  path="/races/:id"
                  element={
                    <AuthGuard>
                      <LiveRace />
                    </AuthGuard>
                  }
                />
                
                <Route
                  path="/races/:id/results"
                  element={
                    <AuthGuard>
                      <Results />
                    </AuthGuard>
                  }
                />

                {/* DEFAULT FALLBACK REDIRECT */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
                
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
