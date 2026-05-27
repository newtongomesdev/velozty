import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bike, Footprints, Globe2, Search, Trophy } from "lucide-react";
import { Card, CardTitle } from "../components/ui/Card";
import { useI18n } from "../components/i18n/I18nProvider";
import { fetchHallOfFame, type HallOfFameEntry } from "../lib/supabase";

const HallOfFame: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHallOfFame().then(setEntries).finally(() => setLoading(false));
  }, []);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((entry) => [
      entry.display_name,
      entry.city,
      entry.state,
      entry.country,
    ].some((value) => value?.toLowerCase().includes(query)));
  }, [entries, search]);

  return (
    <div className="min-h-[100dvh] bg-darkbg text-white p-4 md:p-8 flex flex-col gap-4">
      <header className="max-w-4xl mx-auto w-full flex items-center gap-3">
        <button onClick={() => navigate("/app/races/public")} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[9px] font-black tracking-widest text-hyperpink uppercase">{t("hallOfFame.subtitle")}</span>
          <h1 className="text-xl font-black uppercase tracking-wide">{t("hallOfFame.title")}</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full flex flex-col gap-4">
        <Card glow="volt" className="relative">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-mutedgray" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("hallOfFame.searchPlaceholder")}
            className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-volt placeholder-white/20"
          />
        </Card>

        {loading ? (
          <div className="py-16 text-center text-xs font-black text-mutedgray uppercase tracking-widest">{t("common.loading")}</div>
        ) : filteredEntries.length === 0 ? (
          <Card glow="pink" className="text-center py-12">
            <Trophy className="h-10 w-10 text-mutedgray/40 mx-auto mb-3" />
            <p className="text-xs font-black uppercase text-mutedgray">{t("hallOfFame.empty")}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredEntries.map((entry, index) => (
              <Card key={entry.user_id} glow={index === 0 ? "volt" : "pink"} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-volt text-black flex items-center justify-center font-black text-lg">#{index + 1}</div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm truncate">{entry.display_name}</CardTitle>
                    <p className="text-[10px] text-mutedgray uppercase flex items-center gap-1 mt-1">
                      <Globe2 className="h-3 w-3 text-volt" />
                      {[entry.city, entry.state, entry.country].filter(Boolean).join(", ") || t("publicRaces.unmappedRegion")}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-volt">{entry.total_wins}x</div>
                  <div className="flex gap-2 text-[9px] font-black uppercase text-mutedgray">
                    <span className="flex items-center gap-1"><Footprints className="h-3 w-3" />{entry.wins_by_modality.running}</span>
                    <span className="flex items-center gap-1"><Bike className="h-3 w-3" />{entry.wins_by_modality.bike}</span>
                    <span>🏁 {entry.wins_by_modality.other}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default HallOfFame;
