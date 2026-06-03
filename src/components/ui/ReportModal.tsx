import { useState } from "react";
import { useI18n } from "../i18n/I18nProvider";
import { submitReport } from "../../lib/supabase";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporterId: string;
  targetType: "post" | "comment" | "volt" | "profile";
  targetId: string;
  onSuccess?: () => void;
}

export function ReportModal({
  isOpen,
  onClose,
  reporterId,
  targetType,
  targetId,
  onSuccess
}: ReportModalProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const reasons = [
    { id: "spam", label: t("report.reasonSpam") },
    { id: "inappropriate", label: t("report.reasonInappropriate") },
    { id: "hate", label: t("report.reasonHate") },
    { id: "fake", label: t("report.reasonFake") },
    { id: "other", label: t("report.reasonOther") }
  ];

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setLoading(true);
    setError(null);
    try {
      await submitReport(reporterId, targetType, targetId, selectedReason);
      setLoading(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Error reporting:", err);
      setError(t("report.error"));
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/50 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-auto animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-black italic text-slate-100 tracking-tight uppercase mb-4">
          {t("report.reportTitle")}
        </h2>
        
        <div className="space-y-2 mb-6">
          {reasons.map(r => (
            <label
              key={r.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedReason === r.id
                  ? "bg-rose-500/10 border-rose-500 text-rose-500"
                  : "bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <input
                type="radio"
                name="reportReason"
                value={r.id}
                checked={selectedReason === r.id}
                onChange={() => setSelectedReason(r.id)}
                className="hidden"
              />
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                selectedReason === r.id ? "border-rose-500" : "border-slate-500"
              }`}>
                {selectedReason === r.id && <div className="w-2 h-2 rounded-full bg-rose-500" />}
              </div>
              <span className="font-medium text-sm">{r.label}</span>
            </label>
          ))}
        </div>

        {error && <p className="text-rose-400 text-sm mb-4 text-center">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            disabled={loading}
          >
            {t("common.back") || "Cancel"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || loading}
            className="flex-1 py-3 px-4 rounded-xl font-black italic tracking-wide uppercase bg-rose-600 text-white hover:bg-rose-500 transition-colors disabled:opacity-50"
          >
            {loading ? "..." : t("report.reportAction")}
          </button>
        </div>
      </div>
    </div>
  );
}
