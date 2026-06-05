import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthGuard, AuthProvider } from "../components/auth/AuthGuard";

const Login = lazy(() => import("./Login"));
const Dashboard = lazy(() => import("./Dashboard"));
const CreateRace = lazy(() => import("./CreateRace"));
const JoinRace = lazy(() => import("./JoinRace"));
const LiveRace = lazy(() => import("./LiveRace"));
const Results = lazy(() => import("./Results"));
const PublicRaces = lazy(() => import("./PublicRaces"));
const WatchRace = lazy(() => import("./WatchRace"));
const HallOfFame = lazy(() => import("./HallOfFame"));
const Social = lazy(() => import("./Social"));
const PublicProfile = lazy(() => import("./PublicProfile"));
const StravaCallback = lazy(() => import("./StravaCallback"));
const Admin = lazy(() => import("./Admin"));

const AppFallback = () => (
  <div className="flex min-h-[100dvh] items-center justify-center bg-darkbg text-xs font-black uppercase tracking-widest text-mutedgray">
    Carregando Velozty...
  </div>
);

const Protected = ({ children }: { children: React.ReactNode }) => (
  <AuthGuard>{children}</AuthGuard>
);

const AppBoundary: React.FC = () => {
  return (
    <AuthProvider>
      <Suspense fallback={<AppFallback />}>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="login" element={<Login />} />
          <Route path="dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="races/new" element={<Protected><CreateRace /></Protected>} />
          <Route path="races/public" element={<Protected><PublicRaces /></Protected>} />
          <Route path="hall-of-fame" element={<Protected><HallOfFame /></Protected>} />
          <Route path="social" element={<Protected><Social /></Protected>} />
          <Route path="profile/:id" element={<Protected><PublicProfile /></Protected>} />
          <Route path="strava/callback" element={<Protected><StravaCallback /></Protected>} />
          <Route path="watch/:id" element={<WatchRace />} />
          <Route path="join/:code" element={<Protected><JoinRace /></Protected>} />
          <Route path="races/:id/edit" element={<Protected><CreateRace /></Protected>} />
          <Route path="races/:id" element={<Protected><LiveRace /></Protected>} />
          <Route path="races/:id/results" element={<Protected><Results /></Protected>} />
          
          {/* Admin panel */}
          <Route path="admin" element={<Protected><Admin /></Protected>} />

          {/* Profile by Username or direct slug */}
          <Route path=":id" element={<Protected><PublicProfile /></Protected>} />
          
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
};

export default AppBoundary;

