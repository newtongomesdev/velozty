import React from "react";
import { ExternalLink } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, CardTitle } from "../components/ui/Card";
import { useI18n } from "../components/i18n/I18nProvider";

const StravaCallback: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const code = params.get("code");
  const error = params.get("error");

  return (
    <div className="min-h-[100dvh] bg-darkbg p-4 text-white md:p-8">
      <main className="mx-auto flex w-full max-w-lg flex-col gap-4">
        <Card glow={error ? "pink" : "volt"} className="flex flex-col gap-4 text-center">
          <ExternalLink className="mx-auto h-8 w-8 text-volt" />
          <CardTitle className="justify-center text-base">
            {t("strava.title")}
          </CardTitle>
          <p className="text-sm font-semibold leading-relaxed text-mutedgray">
            {error ? t("strava.denied") : code ? t("strava.pending") : t("strava.missingCode")}
          </p>
          <Button type="button" variant="volt" onClick={() => navigate("/dashboard")}>
            {t("strava.back")}
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default StravaCallback;

