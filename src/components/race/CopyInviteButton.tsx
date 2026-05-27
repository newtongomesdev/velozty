import React, { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";
import { useToast } from "../ui/Toast";
import { useI18n } from "../i18n/I18nProvider";

interface CopyInviteButtonProps {
  inviteCode: string;
}

export const CopyInviteButton: React.FC<CopyInviteButtonProps> = ({ inviteCode }) => {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();
  const { t } = useI18n();

  const getJoinLink = () => {
    return `${window.location.origin}/join/${inviteCode.toUpperCase()}`;
  };

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  const handleShare = async () => {
    try {
      await navigator.share({
        title: t("share.title"),
        text: t("share.inviteText", { code: inviteCode.toUpperCase() }),
        url: getJoinLink(),
      });
    } catch (err) {
      console.log("User cancelled or share failed", err);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getJoinLink());
      setCopied(true);
      showToast(t("share.copied"), "success");
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link:", err);
      showToast(t("share.copyError"), "error");
    }
  };

  return (
    <div className="w-full p-4 border border-white/5 bg-white/5 rounded-2xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share2 className="h-4.5 w-4.5 text-hyperpink drop-shadow-[0_0_5px_rgba(255,43,214,0.4)]" />
          <span className="text-xs font-black text-white uppercase tracking-wider">{t("share.inviteFriends")}</span>
        </div>
        <span className="text-[10px] font-bold text-mutedgray uppercase tracking-widest">{t("share.code")}: {inviteCode.toUpperCase()}</span>
      </div>

      <div className="flex gap-2 w-full">
        {/* Glowing URL preview bar */}
        <div className="flex-1 px-3 py-2.5 bg-black/45 border border-white/5 rounded-xl text-xs font-semibold text-mutedgray font-mono overflow-x-auto whitespace-nowrap select-all scrollbar-hide">
          {getJoinLink()}
        </div>

        {canShare && (
          <button
            onClick={handleShare}
            className="px-4 py-2.5 rounded-xl border bg-hyperpink/10 border-hyperpink/20 hover:bg-hyperpink/20 hover:border-hyperpink/30 text-hyperpink flex items-center justify-center transition-all duration-300 active:scale-95 focus:outline-none shadow-[0_0_10px_rgba(255,43,214,0.1)] cursor-pointer"
            title={t("common.share")}
          >
            <Share2 className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={handleCopy}
          className={`px-4 py-2.5 rounded-xl border flex items-center justify-center transition-all duration-300 active:scale-95 focus:outline-none cursor-pointer ${
            copied
              ? "bg-volt/15 border-volt text-volt shadow-[0_0_10px_rgba(198,255,0,0.2)]"
              : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
          }`}
          title={t("common.copy")}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};
export default CopyInviteButton;
