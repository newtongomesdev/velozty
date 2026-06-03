import React, { Suspense, lazy, useCallback, useMemo, useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/ui/Toast";
import { I18nProvider } from "./components/i18n/I18nProvider";

// Route View screens loaded on demand
const LandingPage = lazy(() => import("./routes/LandingPage"));
const Terms = lazy(() => import("./routes/Terms"));
const Privacy = lazy(() => import("./routes/Privacy"));
const RaceOverlay = lazy(() => import("./routes/RaceOverlay"));
const AppBoundary = lazy(() => import("./routes/AppBoundary"));

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

const RouteFallback = () => (
  <div className="flex min-h-[100dvh] items-center justify-center bg-darkbg text-xs font-black uppercase tracking-widest text-mutedgray">
    Carregando Velozty...
  </div>
);

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

  const toggleTheme = useCallback(() => {
    localStorage.setItem(themePreferenceKey, "true");
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  }, []);

  const themeContextValue = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <I18nProvider>
        <BrowserRouter>
          <ToastProvider>
              <div className="relative min-h-screen">
                <Suspense fallback={<RouteFallback />}>
                <Routes>
                
                {/* PUBLIC LANDING PAGE */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/transmissao/:id" element={<RaceOverlay />} />
                <Route path="/overlay/:id" element={<RaceOverlay />} />
                
                <Route path="/app/*" element={<AppBoundary />} />

                {/* DEFAULT FALLBACK REDIRECT */}
                <Route path="*" element={<Navigate to="/" replace />} />
                
                </Routes>
                </Suspense>
              </div>
          </ToastProvider>
        </BrowserRouter>
      </I18nProvider>
    </ThemeContext.Provider>
  );
};

export default App;
