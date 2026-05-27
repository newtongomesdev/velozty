import React from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../components/i18n/I18nProvider";
import { useTheme } from "../App";
import { Card } from "../components/ui/Card";
import { ArrowLeft, Scale, ShieldAlert } from "lucide-react";

const translations = {
  pt: {
    title: "Termos de Uso",
    subtitle: "Regras do jogo: como funciona o uso do Velozty.",
    back: "Voltar para o Início",
    intro: "Bem-vindo ao Velozty! Nossos termos são simples, diretos e escritos sem juridiquês complicado para que todo mundo entenda as regras de convivência e uso do aplicativo.",
    sec1Title: "1. O Objetivo do Velozty",
    sec1Text: "O Velozty é um aplicativo desenvolvido para aproximar pessoas através de atividades físicas (como pedalar, correr ou caminhar). Nosso objetivo é fornecer compartilhamento de localização em tempo real de forma divertida e amigável.",
    sec2Title: "2. Cadastro e Segurança",
    sec2Text: "Para participar dos grupos e desafios, você precisará criar uma conta com um apelido e e-mail. Você é responsável por manter sua senha segura e por todas as atividades realizadas na sua conta.",
    sec3Title: "3. Uso Responsável e Respeito",
    sec3Text: "Queremos uma comunidade amigável e segura. É estritamente proibido publicar conteúdos ofensivos, ameaças, spam ou praticar qualquer tipo de assédio em nosso feed social ou lobbies. Lembre-se: o respeito vem sempre em primeiro lugar.",
    sec4Title: "4. Segurança Física e GPS",
    sec4Text: "Sua segurança física é prioridade absoluta! Nunca use o aplicativo enquanto estiver ativamente manobrando em situações de trânsito perigosas. O Velozty não se responsabiliza por acidentes, lesões ou qualquer dano físico ocorrido durante a prática de suas atividades.",
    sec5Title: "5. Alterações nos Termos",
    sec5Text: "Podemos atualizar estes termos de tempos em tempos para refletir melhorias no app. Sempre avisaremos você sobre mudanças importantes por e-mail ou no dashboard.",
  },
  en: {
    title: "Terms of Use",
    subtitle: "Game rules: how using Velozty works.",
    back: "Back to Home",
    intro: "Welcome to Velozty! Our terms are simple, direct, and written without complicated legalese so everyone can easily understand the rules of using the application.",
    sec1Title: "1. Velozty's Objective",
    sec1Text: "Velozty is an application built to connect people through physical activities (like cycling, running, or walking). Our goal is to provide real-time location sharing in a fun and friendly way.",
    sec2Title: "2. Account & Security",
    sec2Text: "To join groups and challenges, you will create an account with a nickname and email. You are responsible for keeping your password secure and for all activities that occur under your account.",
    sec3Title: "3. Responsible Use & Respect",
    sec3Text: "We want a friendly and safe community. It is strictly forbidden to post offensive content, threats, spam, or practice any kind of harassment in our social feeds or lobbies. Remember: respect always comes first.",
    sec4Title: "4. Physical Safety & GPS",
    sec4Text: "Your physical safety is our absolute priority! Never interact with the application while actively navigating dangerous traffic. Velozty is not liable for any accidents, injuries, or physical damages occurred during your workouts.",
    sec5Title: "5. Changes to Terms",
    sec5Text: "We may update these terms occasionally to reflect app improvements. We will always notify you of important changes via email or on your dashboard.",
  },
  es: {
    title: "Términos de Uso",
    subtitle: "Reglas del juego: cómo funciona el uso de Velozty.",
    back: "Volver al Inicio",
    intro: "¡Bienvenido a Velozty! Nuestros términos son sencillos, directos y escritos sin tecnicismos legales complicados para que todos entiendan las reglas de convivencia y uso de la aplicación.",
    sec1Title: "1. El Objetivo de Velozty",
    sec1Text: "Velozty es una aplicación desarrollada para conectar a las personas a través de actividades físicas (como pedalear, correr o caminar). Nuestro objetivo es proporcionar el intercambio de ubicación en tiempo real de forma divertida y amistosa.",
    sec2Title: "2. Registro y Seguridad",
    sec2Text: "Para participar en grupos y retos, deberás crear una cuenta con un apodo y correo electrónico. Eres responsable de mantener tu contraseña segura y de todas las actividades realizadas en tu cuenta.",
    sec3Title: "3. Uso Responsable y Respeto",
    sec3Text: "Queremos una comunidad amistosa y segura. Está estrictamente prohibido publicar contenido ofensivo, amenazas, spam o practicar cualquier tipo de acoso en nuestro canal social o lobbies. Recuerda: el respeto siempre es lo primero.",
    sec4Title: "4. Seguridad Física y GPS",
    sec4Text: "¡Tu seguridad física es prioridad absoluta! Nunca interactúes con la aplicación mientras te encuentres en situaciones de tráfico peligroso. Velozty no se hace responsable de accidentes, lesiones o cualquier daño físico ocurrido durante tus actividades.",
    sec5Title: "5. Cambios en los Términos",
    sec5Text: "Podemos actualizar estos términos de vez en cuando para reflejar mejoras en la aplicación. Siempre te notificaremos sobre cambios importantes por correo electrónico o en tu panel de control.",
  }
};

export const Terms: React.FC = () => {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const { theme } = useTheme();

  const t = translations[locale as "pt" | "en" | "es"] || translations.pt;

  return (
    <div className="min-h-screen bg-darkbg text-white font-sans relative overflow-x-hidden pb-16 selection:bg-volt selection:text-black">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-volt/5 filter blur-[120px] pointer-events-none" />

      {/* Header Container */}
      <header className="max-w-4xl mx-auto px-4 pt-10 pb-6 flex items-center justify-between z-10 relative">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 transition-all font-black text-[10px] uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-volt" />
          {t.back}
        </button>
      </header>

      {/* Content Container */}
      <main className="max-w-3xl mx-auto px-4 z-10 relative flex flex-col gap-6">
        
        {/* Title Card */}
        <Card glow="volt" className="p-8 text-center flex flex-col items-center gap-4">
          <div className="bg-volt/10 border border-volt/30 p-3 rounded-2xl shadow-glow-volt">
            <Scale className="h-8 w-8 text-volt" />
          </div>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-black uppercase tracking-wide leading-tight ${theme === "light" ? "text-slate-900" : "text-white"}`}>
              {t.title}
            </h1>
            <p className="text-xs font-black uppercase text-hyperpink tracking-widest mt-1">
              {t.subtitle}
            </p>
          </div>
        </Card>

        {/* Legal Text Cards */}
        <Card glow="pink" className="p-8 flex flex-col gap-6">
          <p className={`text-sm font-semibold uppercase tracking-wide leading-relaxed ${theme === "light" ? "text-slate-700" : "text-white/80"}`}>
            {t.intro}
          </p>

          <div className="flex flex-col gap-6 border-t border-white/5 pt-6">
            
            {/* Section 1 */}
            <div className="flex flex-col gap-2">
              <h3 className={`text-sm font-black uppercase tracking-wider ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                {t.sec1Title}
              </h3>
              <p className={`text-xs font-semibold leading-relaxed uppercase ${theme === "light" ? "text-slate-500" : "text-mutedgray"}`}>
                {t.sec1Text}
              </p>
            </div>

            {/* Section 2 */}
            <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
              <h3 className={`text-sm font-black uppercase tracking-wider ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                {t.sec2Title}
              </h3>
              <p className={`text-xs font-semibold leading-relaxed uppercase ${theme === "light" ? "text-slate-500" : "text-mutedgray"}`}>
                {t.sec2Text}
              </p>
            </div>

            {/* Section 3 */}
            <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
              <h3 className={`text-sm font-black uppercase tracking-wider ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                {t.sec3Title}
              </h3>
              <p className={`text-xs font-semibold leading-relaxed uppercase ${theme === "light" ? "text-slate-500" : "text-mutedgray"}`}>
                {t.sec3Text}
              </p>
            </div>

            {/* Section 4 */}
            <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-hyperpink flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5" />
                {t.sec4Title}
              </h3>
              <p className={`text-xs font-semibold leading-relaxed uppercase ${theme === "light" ? "text-slate-500" : "text-mutedgray"}`}>
                {t.sec4Text}
              </p>
            </div>

            {/* Section 5 */}
            <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
              <h3 className={`text-sm font-black uppercase tracking-wider ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                {t.sec5Title}
              </h3>
              <p className={`text-xs font-semibold leading-relaxed uppercase ${theme === "light" ? "text-slate-500" : "text-mutedgray"}`}>
                {t.sec5Text}
              </p>
            </div>

          </div>
        </Card>

      </main>
    </div>
  );
};

export default Terms;
