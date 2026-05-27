import React from "react";
import { Crown, Zap, Flame, Target } from "lucide-react";
import type { RaceAward } from "../../lib/supabase";
import { useI18n } from "../i18n/I18nProvider";

interface AwardCardProps {
  award: RaceAward;
  recipientName: string;
  recipientColor: string;
}

export const AwardCard: React.FC<AwardCardProps> = ({
  award,
  recipientName,
  recipientColor,
}) => {
  const { t } = useI18n();
  
  // Custom styles for each award type
  const config = {
    winner: {
      title: t("awards.winnerTitle"),
      subtitle: t("awards.winnerSubtitle"),
      bgClass: "bg-volt/5 border-volt/30 shadow-[0_0_20px_rgba(198,255,0,0.15)]",
      glowColor: "#C6FF00",
      accentText: "text-volt",
      icon: <Crown className="h-8 w-8 text-volt drop-shadow-[0_0_8px_#C6FF00]" />,
    },
    top_speed: {
      title: t("awards.topSpeedTitle"),
      subtitle: t("awards.topSpeedSubtitle"),
      bgClass: "bg-hyperpink/5 border-hyperpink/30 shadow-[0_0_20px_rgba(255,43,214,0.15)]",
      glowColor: "#FF2BD6",
      accentText: "text-hyperpink",
      icon: <Zap className="h-8 w-8 text-hyperpink drop-shadow-[0_0_8px_#FF2BD6]" />,
    },
    pace_setter: {
      title: t("awards.paceSetterTitle"),
      subtitle: t("awards.paceSetterSubtitle"),
      bgClass: "bg-white/5 border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.15)]",
      glowColor: "#FFFFFF",
      accentText: "text-white",
      icon: <Flame className="h-8 w-8 text-white drop-shadow-[0_0_8px_#FFFFFF]" />,
    },
    personal_best: {
      title: t("awards.personalBestTitle"),
      subtitle: t("awards.personalBestSubtitle"),
      bgClass: "bg-cyan-500/5 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]",
      glowColor: "#06B6D4",
      accentText: "text-cyan-400",
      icon: <Target className="h-8 w-8 text-cyan-400 drop-shadow-[0_0_8px_#06B6D4]" />,
    },
  };

  const style = config[award.award_type] || config.winner;

  return (
    <div
      className={`relative flex flex-col items-center text-center p-6 border rounded-3xl backdrop-blur-md overflow-hidden transition-all duration-500 hover:scale-[1.03] ${style.bgClass}`}
    >
      {/* Decorative ambient background blur */}
      <div 
        className="absolute -top-12 -right-12 w-24 h-24 rounded-full filter blur-[40px] opacity-20 pointer-events-none"
        style={{ backgroundColor: style.glowColor }}
      />
      
      {/* Icon socket */}
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        {style.icon}
      </div>

      {/* Recipient racer badge */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-2">
        <span 
          className="w-2.5 h-2.5 rounded-full" 
          style={{ 
            backgroundColor: recipientColor,
            boxShadow: `0 0 6px ${recipientColor}` 
          }} 
        />
        <span className="text-[10px] font-black text-white uppercase tracking-widest">{recipientName}</span>
      </div>

      {/* Title */}
      <h4 className="text-base font-black text-white uppercase tracking-wider mt-1">{style.title}</h4>
      <span className="text-[10px] font-bold text-mutedgray uppercase tracking-widest mt-0.5">{style.subtitle}</span>

      {/* Achievement stats */}
      <div className={`mt-4 text-sm font-black uppercase tracking-wider font-mono px-4 py-2 bg-black/40 border border-white/5 rounded-2xl ${style.accentText}`}>
        {award.value_text}
      </div>
    </div>
  );
};
