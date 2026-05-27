import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/Toast";
import { Button } from "../components/ui/Button";
import { Card, CardTitle } from "../components/ui/Card";
import { useI18n } from "../components/i18n/I18nProvider";
import { joinRace, fetchRaceParticipants } from "../lib/supabase";
import type { Race } from "../lib/supabase";
import { Flame, Users, Trophy } from "lucide-react";
import dayjs from "dayjs";

export const JoinRace: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useI18n();
  
  const [race, setRace] = useState<Race | null>(null);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [resolving, setResolving] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const inviteCode = code;
    if (!inviteCode) return;
    
    let isMounted = true;
    
    async function resolveInvite() {
      if (!inviteCode) return;
      setResolving(true);
      try {
        let matchedRace: Race | null = null;
        
        if (window.localStorage.getItem("velozty_mock_races")) {
          const mockRaces: Race[] = JSON.parse(window.localStorage.getItem("velozty_mock_races") || "[]");
          matchedRace = mockRaces.find(r => r.invite_code === inviteCode.toUpperCase()) || null;
        }
        
        // If not found in mock or we are using real Supabase
        if (!matchedRace && (import.meta.env.NEXT_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL)) {
          const { data, error } = await (window as any).supabaseClient
            ? (window as any).supabaseClient.from("races").select("*").eq("invite_code", inviteCode.toUpperCase()).single()
            : { data: null, error: new Error("Offline") };
          if (!error && data) matchedRace = data as Race;
        }

        // Standard fallback to find matching race if above checks are constrained
        if (!matchedRace) {
          // Let's call joinRace directly in a try-catch to see if it succeeds, or search local storage
          const mockRaces: Race[] = JSON.parse(localStorage.getItem("velozty_mock_races") || "[]");
          matchedRace = mockRaces.find(r => r.invite_code === inviteCode.toUpperCase()) || null;
          
          if (!matchedRace && (window as any).supabaseClient) {
            const { data } = await (window as any).supabaseClient.from("races").select("*").eq("invite_code", inviteCode.toUpperCase()).single();
            matchedRace = data;
          }
        }

        if (!matchedRace) {
          throw new Error(t("invite.raceNotFound"));
        }

        if (isMounted) {
          setRace(matchedRace);
          // Get current participant head count
          const parts = await fetchRaceParticipants(matchedRace.id);
          setParticipantsCount(parts.length);
        }
      } catch (err: any) {
        console.error("Resolve invite error:", err);
        showToast(err.message || t("invite.invalidCode"), "error");
        navigate("/app/dashboard");
      } finally {
        if (isMounted) {
          setResolving(false);
        }
      }
    }

    resolveInvite();

    return () => {
      isMounted = false;
    };
  }, [code, navigate]);

  const handleJoin = async () => {
    const inviteCode = code;
    if (!inviteCode || !race) return;
    setJoining(true);
    try {
      await joinRace(inviteCode);
      showToast(t("invite.joinedRace", { race: race.name }), "success");
      navigate(`/app/races/${race.id}`);
    } catch (err: any) {
      console.error("Join race error:", err);
      showToast(err.message || t("invite.joinError"), "error");
    } finally {
      setJoining(false);
    }
  };

  const getModalityText = (mod: Race["modality"]) => {
    switch (mod) {
      case "running": return t("invite.running");
      case "bike": return t("invite.bike");
      default: return t("invite.custom");
    }
  };

  if (resolving) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-darkbg text-white">
        <Flame className="h-10 w-10 text-hyperpink animate-bounce mb-3" />
        <span className="text-xs font-black tracking-widest text-mutedgray uppercase animate-pulse">
          {t("invite.validatingCode")}
        </span>
      </div>
    );
  }

  if (!race) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-darkbg text-white p-4 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full filter blur-[120px] bg-hyperpink/10 pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full filter blur-[120px] bg-volt/10 pointer-events-none" />

      {/* Cyber header */}
      <div className="flex flex-col items-center gap-1 mb-8 text-center select-none z-10">
        <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
          {t("invite.title")}
        </h1>
        <span className="text-[9px] font-black tracking-[0.25em] text-mutedgray uppercase mt-1">
          {t("invite.subtitle")}
        </span>
      </div>

      <Card glow="pink" className="w-full max-w-sm z-10 p-7 flex flex-col gap-6">
        
        {/* Race visual header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-hyperpink/10 border border-hyperpink/30 mb-3 shadow-[0_0_12px_rgba(255,43,214,0.15)]">
            <Trophy className="h-7 w-7 text-hyperpink" />
          </div>
          <CardTitle className="text-lg leading-snug">{race.name}</CardTitle>
          <span className="inline-block mt-1 text-[10px] font-black tracking-widest text-volt uppercase bg-black/40 border border-white/5 px-2.5 py-1 rounded">
            {t("invite.code")}: {code?.toUpperCase()}
          </span>
        </div>

        {/* Details list */}
        <div className="flex flex-col gap-3.5 border-t border-b border-white/5 py-5 text-sm font-semibold">
          
          {/* Modality */}
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-mutedgray uppercase tracking-wider">{t("invite.sport")}</span>
            <span className="text-white uppercase text-xs font-black">{getModalityText(race.modality)}</span>
          </div>

          {/* Mode */}
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-mutedgray uppercase tracking-wider">{t("invite.format")}</span>
            <span className="text-white uppercase text-xs font-black">
              {race.mode === "live" ? t("invite.live") : t("invite.timeTrial")}
            </span>
          </div>

          {/* Connected Count */}
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-mutedgray uppercase tracking-wider">{t("invite.participants")}</span>
            <span className="text-volt uppercase text-xs font-black flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {participantsCount} {t("invite.connected")}
            </span>
          </div>

          {/* Date Created */}
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-mutedgray uppercase tracking-wider">{t("invite.launchedAt")}</span>
            <span className="text-white text-xs font-mono font-bold">
              {dayjs(race.created_at).format("DD/MM/YYYY [às] HH:mm")}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col gap-2.5">
          <Button
            onClick={handleJoin}
            variant="pink"
            fullWidth
            isLoading={joining}
            className="py-3.5 text-xs font-black tracking-widest"
          >
            {t("invite.joinRace")}
          </Button>

          <button
            onClick={() => navigate("/app/dashboard")}
            className="w-full text-center text-xs font-bold text-mutedgray hover:text-white uppercase tracking-wider transition-colors py-2"
          >
            {t("invite.backToDashboard")}
          </button>
        </div>
      </Card>
      
      {/* Warning tracker */}
      <div className="mt-8 flex items-center gap-1.5 opacity-30 select-none max-w-xs text-center">
        <span className="text-[8px] font-bold text-mutedgray uppercase leading-relaxed">
          {t("invite.gpsWatchWarning")}
        </span>
      </div>
    </div>
  );
};
export default JoinRace;
