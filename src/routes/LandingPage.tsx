import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../components/i18n/I18nProvider";
import { useTheme } from "../App";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { 
  Flame, 
  Gauge, 
  Zap, 
  Compass, 
  Trophy, 
  Users, 
  ShieldCheck, 
  ChevronDown, 
  Globe,
  Activity, 
  Heart, 
  Wifi, 
  ArrowRight, 
  Lock, 
  Crown, 
  Cpu,
  Moon,
  Sun
} from "lucide-react";

// Local translations to avoid bloating the central i18n.ts file
const translations = {
  pt: {
    heroBadge: "⚡ O JEITO MAIS LEGAL DE JUNTAR A GALERA",
    heroTitlePre: "PEDALE, CORRA E",
    heroTitleVolt: "DIVIRTA-SE",
    heroTitlePost: "COM SEUS AMIGOS",
    heroSubtitle: "O Velozty é a forma mais fácil e divertida de juntar sua turma para pedalar, correr ou caminhar. Acompanhe todo mundo ao vivo no mapa, dispute desafios amigáveis e veja quem chega primeiro, tudo direto no celular!",
    ctaStart: "Bora Começar!",
    ctaExplore: "Descobrir Grupos",
    activeRaces: "Grupos Ativos",
    pilotsOnline: "Amigos Conectados",
    avgSpeed: "Ritmo da Galera",
    simTitle: "Simulador de Rolê Velozty",
    simSubtitle: "Mantenha pressionado o botão para acelerar seu avatar no mapa!",
    simSpeed: "Sua Velocidade",
    simHr: "Coração",
    simGForce: "Diversão",
    simPressToAccelerate: "Pressione para Acelerar!",
    simLimitWarning: "UAU: VOCÊ ESTÁ VOANDO!",
    featuresTitle: "Tudo o que você e sua turma precisam",
    featuresSubtitle: "Ferramentas simples, leves e super legais para animar o seu final de semana.",
    feat1Title: "Todo Mundo no Mapa",
    feat1Desc: "Veja onde cada amigo está no mapa em tempo real. Perfeito para ninguém se perder no caminho!",
    feat2Title: "Leve e Sem Complicação",
    feat2Desc: "Funciona direto no navegador do celular, sem precisar instalar nada pesado. É só clicar e sair usando.",
    feat3Title: "Lobbies de Desafio",
    feat3Desc: "Crie um grupo de corrida ou pedal em segundos. Largadas sincronizadas com contagem regressiva para todo mundo.",
    feat4Title: "Ranking da Turma",
    feat4Desc: "Consagre-se o campeão do final de semana no Hall da Fama e lidere a pontuação geral da galera.",
    pricingTitle: "Acesso Livre para Todos",
    pricingSubtitle: "Escolha o melhor jeito de pedalar e correr com seus amigos.",
    plan1Name: "Amigos no Rolê",
    plan1Price: "Grátis",
    plan1Desc: "Perfeito para quem quer se divertir no fim de semana e encontrar a turma.",
    plan1Feat1: "Acompanhamento ao vivo no mapa",
    plan1Feat2: "Até 3 grupos ou desafios por semana",
    plan1Feat3: "Links de convites ilimitados para amigos",
    plan1Feat4: "GPS Padrão",
    plan2Name: "Super Atleta",
    plan2Price: "R$ 19,90",
    plan2Period: "/mês",
    plan2Desc: "Para quem quer levar a brincadeira um pouco mais a sério e ter dados extras.",
    plan2Feat1: "GPS de alta frequência e precisão",
    plan2Feat2: "Grupos e histórico de corridas ilimitados",
    plan2Feat3: "Treinador virtual por voz integrado",
    plan2Feat4: "Salva trajetos mesmo sem sinal de internet",
    plan2Badge: "Mais Popular",
    plan3Name: "Clubes & Turmas",
    plan3Price: "R$ 89,90",
    plan3Period: "/mês",
    plan3Desc: "Desenhado para organizadores de pedais, assessorias ou turmas gigantes.",
    plan3Feat1: "Sobreposição ao vivo para lives (OBS/Twitch)",
    plan3Feat2: "Painel de controle para grandes grupos",
    plan3Feat3: "Estatísticas avançadas de todo o clube",
    plan3Feat4: "Suporte prioritário e eventos públicos personalizados",
    pricingCta: "Garantir Minha Vaga no Grid",
    faqTitle: "Perguntas Frequentes",
    faqSubtitle: "Tudo o que você precisa saber para começar a usar com seus amigos.",
    faqQ1: "Como funciona o Velozty?",
    faqA1: "O aplicativo usa o GPS do seu próprio celular para marcar seu trajeto e velocidade. Ao criar ou entrar em um grupo, essas informações são compartilhadas de forma rápida e segura com seus amigos. Assim, todo mundo consegue ver a posição de todo mundo ao vivo em um lindo mapa interativo!",
    faqQ2: "Preciso comprar algum acessório ou sensor?",
    faqA2: "Não! O Velozty roda direto no navegador do seu smartphone (Chrome ou Safari). Não precisa comprar relógios caros ou sensores. Basta dar permissão de localização no celular e o jogo começa!",
    faqQ3: "Gasta muita bateria ou dados de internet?",
    faqA3: "O aplicativo foi super otimizado para ser o mais leve possível! Ele consome pouquíssima internet (menos de 5MB por hora de uso) e tem um modo especial de economia de tela para poupar bateria enquanto o celular está no seu bolso.",
    faqQ4: "Posso jogar apenas com meus amigos mais próximos?",
    faqA4: "Com certeza! Ao criar um grupo de desafio ou pedal, você pode deixá-lo no modo Privado. Assim, apenas quem receber o código de convite de 6 dígitos que você enviar poderá entrar no mapa e participar.",
    footerText: "Velozty. Criado com carinho para aproximar pessoas e espalhar diversão.",
    footerPrivacy: "Políticas de Privacidade",
    footerTerms: "Termos de Uso",
  },
  en: {
    heroBadge: "⚡ THE COOLEST APP TO GATHER YOUR FRIENDS",
    heroTitlePre: "RIDE, RUN AND",
    heroTitleVolt: "HAVE FUN",
    heroTitlePost: "WITH YOUR FRIENDS",
    heroSubtitle: "Velozty is the easiest way to gather your crew for cycling, running, or walking. Follow everyone live on the map, challenge your friends to friendly races, and see who arrives first—all straight from your phone!",
    ctaStart: "Let's Get Started!",
    ctaExplore: "Find Active Lobbies",
    activeRaces: "Active Groups",
    pilotsOnline: "Friends Online",
    avgSpeed: "Crew's Pace",
    simTitle: "Velozty Ride Simulator",
    simSubtitle: "Hold down the button to accelerate your avatar on the map!",
    simSpeed: "Your Speed",
    simHr: "Heart Rate",
    simGForce: "Fun Factor",
    simPressToAccelerate: "Press to Accelerate!",
    simLimitWarning: "WOW: YOU ARE FLYING!",
    featuresTitle: "Everything You and Your Crew Need",
    featuresSubtitle: "Simple, lightweight, and super fun tools for your weekend.",
    feat1Title: "Everyone on the Map",
    feat1Desc: "See where every friend is on the map in real time. Perfect for keeping the crew together!",
    feat2Title: "Light & Hassle-Free",
    feat2Desc: "Runs straight in your phone's browser, no heavy installations needed. Just click and go.",
    feat3Title: "Friendly Lobbies",
    feat3Desc: "Create a cycling or running group in seconds. Sychronized starts with live countdowns.",
    feat4Title: "Crew Leaderboards",
    feat4Desc: "Claim your weekend champion title on the Hall of Fame and lead the general crew scores.",
    pricingTitle: "Free Access for Everyone",
    pricingSubtitle: "Choose the best way to ride and run with your friends.",
    plan1Name: "Weekend Crew",
    plan1Price: "Free",
    plan1Desc: "Perfect for weekend fun rides and casual joggers looking to connect.",
    plan1Feat1: "Live real-time location sharing on map",
    plan1Feat2: "Up to 3 active lobbies per week",
    plan1Feat3: "Unlimited invite links for friends",
    plan1Feat4: "Standard GPS",
    plan2Name: "Super Athlete",
    plan2Price: "$ 4.90",
    plan2Period: "/month",
    plan2Desc: "For those looking to level up their stats and enjoy extra precision.",
    plan2Feat1: "High-frequency GPS tracking & precision",
    plan2Feat2: "Unlimited lobbies & full activity logs",
    plan2Feat3: "Integrated virtual voice coach",
    plan2Feat4: "Offline buffer (never lose route data)",
    plan2Badge: "Most Popular",
    plan3Name: "Clubs & Teams",
    plan3Price: "$ 19.90",
    plan3Period: "/month",
    plan3Desc: "Designed for cycling club organizers, trainers, or huge crowds.",
    plan3Feat1: "Live stream overlays (OBS/Twitch support)",
    plan3Feat2: "Management panel for large groups",
    plan3Feat3: "Advanced comparative telemetry for the club",
    plan3Feat4: "Priority support & custom public events",
    pricingCta: "Claim My Grid Spot",
    faqTitle: "Frequently Asked Questions",
    faqSubtitle: "Everything you need to know to start riding with friends.",
    faqQ1: "How does Velozty work?",
    faqA1: "The app uses your phone's built-in GPS to track your route and speed. When you join or create a group, this info is securely shared with your friends. Everyone can track each other's live location on a beautiful interactive map!",
    faqQ2: "Do I need to buy any smartwatch or special sensor?",
    faqA2: "No! Velozty runs straight in your smartphone's browser (Chrome or Safari). No expensive gear needed. Just enable location permissions and let the fun begin!",
    faqQ3: "Does it drain battery or use too much internet?",
    faqA3: "Our app is highly optimized to be as lightweight as possible. It uses minimal data (less than 5MB per hour of continuous use) and includes a special screensaver mode to save battery while in your pocket.",
    faqQ4: "Can I make private groups just for my close friends?",
    faqA4: "Yes! When creating a challenge or ride lobby, you can select Private mode. Only friends who enter your specific 6-digit invite code can join your map.",
    footerText: "Velozty. Built with love to connect people and spread joy.",
    footerPrivacy: "Privacy Policy",
    footerTerms: "Terms of Use",
  },
  es: {
    heroBadge: "⚡ LA APP MÁS DIVERTIDA PARA JUNTAR A TUS AMIGOS",
    heroTitlePre: "PEDALEA, CORRE Y",
    heroTitleVolt: "DIVIÉRTETE",
    heroTitlePost: "CON TUS AMIGOS",
    heroSubtitle: "Velozty es la forma más fácil y divertida de juntar a tu grupo para pedalear, correr o caminar. ¡Sigue a todos en vivo en el mapa, compite en retos amistosos y mira quién llega primero, todo directo en tu móvil!",
    ctaStart: "¡Vamos a Empezar!",
    ctaExplore: "Ver Grupos Activos",
    activeRaces: "Grupos Activos",
    pilotsOnline: "Amigos Online",
    avgSpeed: "Ritmo del Grupo",
    simTitle: "Simulador de Paseo Velozty",
    simSubtitle: "¡Mantén presionado el botón para acelerar tu avatar en el mapa!",
    simSpeed: "Tu Velocidad",
    simHr: "Pulsaciones",
    simGForce: "Fuerza G",
    simPressToAccelerate: "¡Mantén para Acelerar!",
    simLimitWarning: "¡GUAU: ESTÁS VOLANDO!",
    featuresTitle: "Todo lo que tú y tu grupo necesitan",
    featuresSubtitle: "Herramientas sencillas, ligeras y muy divertidas para tu fin de semana.",
    feat1Title: "Todos en el Mapa",
    feat1Desc: "Mira dónde está cada amigo en el mapa en tiempo real. ¡Perfecto para mantener al grupo unido!",
    feat2Title: "Ligero y Sin Complicaciones",
    feat2Desc: "Funciona directamente en el navegador del móvil, sin instalar apps pesadas. Clic y listo.",
    feat3Title: "Lobbies de Retos",
    feat3Desc: "Crea un grupo de ciclismo o running en segundos. Salidas sincronizadas con cuenta atrás para todos.",
    feat4Title: "Clasificación del Grupo",
    feat4Desc: "Conságrate campeón del fin de semana en el Salón de la Fama y lidera las puntuaciones del grupo.",
    pricingTitle: "Acceso Libre para Todos",
    pricingSubtitle: "Elige la mejor manera de rodar y correr con tus amigos.",
    plan1Name: "Grupo del Finde",
    plan1Price: "Gratis",
    plan1Desc: "Perfecto para divertirse los fines de semana y conectar con el grupo.",
    plan1Feat1: "Ubicación compartida en vivo en el mapa",
    plan1Feat2: "Hasta 3 grupos o retos activos por semana",
    plan1Feat3: "Enlaces de invitación ilimitados para amigos",
    plan1Feat4: "GPS Estándar",
    plan2Name: "Super Atleta",
    plan2Price: "$ 4.90",
    plan2Period: "/mes",
    plan2Desc: "Para quienes quieren llevar el juego un paso más allá con datos extras.",
    plan2Feat1: "Rastreo GPS de alta frecuencia y precisión",
    plan2Feat2: "Grupos e historial de actividades ilimitados",
    plan2Feat3: "Entrenador virtual por voz integrado",
    plan2Feat4: "Buffer offline (nunca pierdas datos del mapa)",
    plan2Badge: "Más Popular",
    plan3Name: "Clubes y Equipos",
    plan3Price: "$ 19.90",
    plan3Period: "/mes",
    plan3Desc: "Diseñado para organizadores de rutas ciclistas, entrenadores o grupos grandes.",
    plan3Feat1: "Sobreposiciones en vivo para transmisiones (OBS/Twitch)",
    plan3Feat2: "Panel de control para grupos numerosos",
    plan3Feat3: "Análisis comparativo de telemetría para el club",
    plan3Feat4: "Soporte VIP y hospedaje de eventos personalizados",
    pricingCta: "Asegurar Mi Lugar en la Parrilla",
    faqTitle: "Preguntas Frecuentes",
    faqSubtitle: "Todo lo que necesitas saber para empezar a jugar con amigos.",
    faqQ1: "¿Cómo funciona Velozty?",
    faqA1: "La app usa el GPS integrado de tu móvil para medir tu ruta y velocidad. Al unirte o crear un grupo, esa información se comparte de forma rápida y segura con tus amigos. ¡Así todos pueden ver la ubicación del grupo al instante en un hermoso mapa interactivo!",
    faqQ2: "¿Necesito comprar algún reloj inteligente o sensor especial?",
    faqA2: "¡No! Velozty funciona directo en el navegador de tu móvil (Chrome o Safari). No necesitas relojes caros. Concede permisos de ubicación y ¡que empiece la diversión!",
    faqQ3: "¿Consume mucha batería o datos móviles?",
    faqA3: "¡Nuestra app está súper optimizada! Consume muy pocos datos móviles (menos de 5MB por hora de uso continuo) e incluye un salvapantallas especial para ahorrar batería en el bolsillo.",
    faqQ4: "¿Puedo crear grupos privados solo para mis amigos?",
    faqA4: "¡Sí! Al crear un reto o grupo ciclista, puedes elegir el modo Privado. Así, solo quienes introduzcan tu código específico de 6 dígitos podrán unirse a tu mapa.",
    footerText: "Velozty. Creado con amor para conectar personas y compartir risas.",
    footerPrivacy: "Políticas de Privacidad",
    footerTerms: "Términos de Uso",
  }
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { locale, setLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();

  // Get active translation based on active locale
  const t = translations[locale as "pt" | "en" | "es"] || translations.pt;

  // Simulator Telemetry States
  const [speed, setSpeed] = useState(0);
  const [heartRate, setHeartRate] = useState(72);
  const [gForce, setGForce] = useState(1.0);
  const [isAccelerating, setIsAccelerating] = useState(false);
  const [simPoints, setSimPoints] = useState<{ x: number; y: number }[]>([]);

  // FAQ states (independent opening states)
  const [faqOpen, setFaqOpen] = useState([false, false, false, false]);

  const toggleFaq = (index: number) => {
    setFaqOpen(prev => {
      const copy = [...prev];
      copy[index] = !copy[index];
      return copy;
    });
  };

  const accelerateInterval = useRef<any>(null);
  const chartInterval = useRef<any>(null);
  const pointCounter = useRef(0);

  // Handle acceleration physics
  useEffect(() => {
    if (isAccelerating) {
      accelerateInterval.current = setInterval(() => {
        setSpeed(prev => Math.min(prev + (Math.random() * 6 + 4), 142.4));
        setHeartRate(prev => Math.min(prev + Math.round(Math.random() * 3 + 1), 165));
        setGForce(prev => Math.min(prev + (Math.random() * 0.15 + 0.05), 3.4));
      }, 50);
    } else {
      accelerateInterval.current = setInterval(() => {
        setSpeed(prev => Math.max(prev - (Math.random() * 8 + 6), 0));
        setHeartRate(prev => Math.max(prev - Math.round(Math.random() * 2 + 1), 72));
        setGForce(prev => Math.max(prev - 0.25, 1.0));
      }, 50);
    }

    return () => {
      if (accelerateInterval.current) clearInterval(accelerateInterval.current);
    };
  }, [isAccelerating]);

  // Feed simulation chart points
  useEffect(() => {
    chartInterval.current = setInterval(() => {
      setSimPoints(prev => {
        const nextX = pointCounter.current++;
        const nextY = 80 - (speed * 0.45 + (Math.random() * 10 - 5));
        const updated = [...prev, { x: nextX, y: Math.max(Math.min(nextY, 80), 5) }];
        if (updated.length > 20) {
          updated.shift();
        }
        return updated;
      });
    }, 150);

    return () => {
      if (chartInterval.current) clearInterval(chartInterval.current);
    };
  }, [speed]);

  const startAcceleration = () => setIsAccelerating(true);
  const stopAcceleration = () => setIsAccelerating(false);

  return (
    <div className="min-h-screen bg-darkbg text-white font-sans relative overflow-x-hidden selection:bg-volt selection:text-black">
      
      {/* Background Cyber Mesh Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-volt/5 filter blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[450px] h-[450px] rounded-full bg-hyperpink/5 filter blur-[100px] pointer-events-none" />

      {/* 1. STUNNING Cyber Header */}
      <header className="relative z-50 max-w-7xl mx-auto px-4 md:px-8 py-6 flex items-center justify-between border-b border-white/5 bg-darkbg/40 backdrop-blur-md">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2 select-none group cursor-pointer" onClick={() => navigate("/")}>
          <div className="bg-volt/10 border border-volt/30 p-2 rounded-2xl shadow-glow-volt transition-transform group-hover:scale-105">
            <Flame className="h-6 w-6 text-volt animate-pulse fill-current" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white uppercase italic">
            VELO<span className="text-volt drop-shadow-[0_0_8px_#C6FF00]">ZTY</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-wider text-mutedgray">
          <a href="#features" className="hover:text-volt transition-colors">{t.featuresTitle.split(" ").slice(0,2).join(" ")}</a>
          <a href="#pricing" className="hover:text-volt transition-colors">{t.pricingTitle.split(" ").slice(0,2).join(" ")}</a>
          <a href="#faq" className="hover:text-volt transition-colors">FAQ</a>
        </nav>

        {/* Global Controls & Call Actions */}
        <div className="flex items-center gap-4">
          
          {/* Theme Toggler */}
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-white/10 bg-white/3 hover:bg-white/8 text-mutedgray hover:text-white transition-all focus:outline-none"
            title="Toggle Theme"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-volt" />}
          </button>

          {/* Locale Picker */}
          <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 focus-within:border-volt/30 transition-all hover:bg-white/8">
            <Globe className="h-3.5 w-3.5 text-mutedgray mr-1.5 pointer-events-none" />
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as any)}
              className="lang-select focus:ring-0 focus:outline-none"
            >
              <option value="pt">PT</option>
              <option value="en">EN</option>
              <option value="es">ES</option>
            </select>
            <ChevronDown className="h-3 w-3 text-mutedgray absolute right-2.5 pointer-events-none" />
          </div>

          {/* Login Action CTA */}
          <button 
            onClick={() => navigate("/app/login")}
            className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-volt/30 bg-volt/10 text-volt hover:bg-volt hover:text-black transition-all text-xs font-black uppercase tracking-widest hover:shadow-glow-volt active:scale-95"
          >
            {t.ctaStart.split(" ")[0]} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-20 flex flex-col lg:grid lg:grid-cols-12 gap-12 items-center">
        
        {/* Hero Left Content */}
        <div className="lg:col-span-6 flex flex-col items-start gap-6 text-left">
          
          {/* Tech Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-volt/20 bg-volt/5 text-volt text-[9px] font-black uppercase tracking-wider shadow-[0_0_15px_rgba(198,255,0,0.1)]">
            <span className="w-1.5 h-1.5 rounded-full bg-volt animate-ping" />
            {t.heroBadge}
          </div>

          {/* Giant Title */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase italic text-white leading-none">
            {t.heroTitlePre} <br className="hidden sm:block" />
            <span className="text-volt drop-shadow-[0_0_15px_rgba(198,255,0,0.3)]">{t.heroTitleVolt}</span> <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40">{t.heroTitlePost}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm font-semibold text-mutedgray uppercase tracking-wide leading-relaxed max-w-xl">
            {t.heroSubtitle}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-4">
            <Button
              variant="volt"
              size="lg"
              onClick={() => navigate("/app/login")}
              className="text-xs tracking-widest font-black uppercase py-4 px-8 flex items-center justify-center gap-2 group"
            >
              {t.ctaStart}
              <Zap className="h-4 w-4 fill-current group-hover:scale-110 transition-transform" />
            </Button>
            
            <Button
              variant="glass"
              size="lg"
              onClick={() => navigate("/app/races/public")}
              className="text-xs tracking-widest font-black uppercase py-4 px-8 border border-white/10 hover:border-volt/30 flex items-center justify-center gap-2"
            >
              <Compass className="h-4 w-4" />
              {t.ctaExplore}
            </Button>
          </div>

          {/* Micro badges count statistics */}
          <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-white/5 w-full">
            <div>
              <span className="text-2xl font-black text-white font-mono tracking-tight block">12</span>
              <span className="text-[9px] font-black uppercase tracking-wider text-mutedgray">{t.activeRaces}</span>
            </div>
            <div>
              <span className="text-2xl font-black text-volt font-mono tracking-tight block">247</span>
              <span className="text-[9px] font-black uppercase tracking-wider text-mutedgray">{t.pilotsOnline}</span>
            </div>
            <div>
              <span className="text-2xl font-black text-hyperpink font-mono tracking-tight block">34.6 km/h</span>
              <span className="text-[9px] font-black uppercase tracking-wider text-mutedgray">{t.avgSpeed}</span>
            </div>
          </div>
        </div>

        {/* Hero Right Widget (WOW Interactive Telemetry Simulator) */}
        <div className="lg:col-span-6 w-full max-w-md lg:max-w-none relative">
          
          {/* Behind glowing elements */}
          <div className="absolute inset-0 bg-gradient-to-tr from-volt/10 to-hyperpink/5 rounded-3xl filter blur-xl opacity-30 pointer-events-none" />
          
          <Card glow={speed > 110 ? "pink" : "volt"} className="relative z-10 border border-white/15 p-6 backdrop-blur-2xl">
            
            {/* Header simulation bar */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5 select-none">
              <div className="flex items-center gap-2">
                <Cpu className="h-4.5 w-4.5 text-volt" />
                <span className="text-[10px] font-black uppercase tracking-wider text-white">{t.simTitle}</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-mutedgray">
                <Wifi className="h-3.5 w-3.5 text-volt animate-pulse" />
                <span>99ms</span>
              </div>
            </div>

            {/* Radar Circular Gauge Dial */}
            <div className="relative w-52 h-52 mx-auto mb-6 flex flex-col items-center justify-center">
              
              {/* Outer rotating dial ring */}
              <div 
                className="absolute inset-0 rounded-full border border-dashed border-white/10 transition-transform duration-300"
                style={{ transform: `rotate(${speed * 2}deg)` }}
              />
              
              {/* Colored meter arc glow overlay */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle
                  cx="104"
                  cy="104"
                  r="92"
                  className="stroke-black/50 fill-transparent"
                  strokeWidth="6"
                />
                <circle
                  cx="104"
                  cy="104"
                  r="92"
                  className="transition-all duration-75 fill-transparent"
                  style={{
                    stroke: speed > 110 ? "#FF2BD6" : "#C6FF00",
                    strokeDasharray: 578,
                    strokeDashoffset: 578 - (578 * (speed / 150)),
                    filter: `drop-shadow(0 0 6px ${speed > 110 ? "#FF2BD6" : "#C6FF00"})`
                  }}
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </svg>

              {/* Speed Center Text */}
              <div className="relative text-center select-none">
                <span className="text-xs font-black uppercase tracking-widest text-mutedgray block">{t.simSpeed}</span>
                <span className="text-5xl font-black italic tracking-tighter text-white font-mono block transition-all duration-75">
                  {speed.toFixed(1)}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-volt">KM/H</span>
              </div>
            </div>

            {/* Telemetry sensor metrics grid */}
            <div className="grid grid-cols-2 gap-4 border-t border-b border-white/5 py-4 mb-6">
              
              {/* Heart rate widget */}
              <div className="flex items-center gap-3">
                <div className="bg-hyperpink/10 p-2.5 rounded-xl border border-hyperpink/20">
                  <Heart className={`h-4.5 w-4.5 text-hyperpink ${speed > 80 ? "animate-ping" : "animate-pulse"}`} />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-mutedgray block">{t.simHr}</span>
                  <span className="text-base font-black text-white font-mono">{heartRate} BPM</span>
                </div>
              </div>

              {/* G-Force widget */}
              <div className="flex items-center gap-3">
                <div className="bg-volt/10 p-2.5 rounded-xl border border-volt/20">
                  <Activity className="h-4.5 w-4.5 text-volt animate-pulse" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-mutedgray block">{t.simGForce}</span>
                  <span className="text-base font-black text-white font-mono">{gForce.toFixed(2)} G</span>
                </div>
              </div>
            </div>

            {/* Dynamic Telemetry Real-time line graph rendering using inline SVG */}
            <div className="w-full h-16 bg-black/40 border border-white/5 rounded-xl p-2 relative overflow-hidden mb-6">
              <svg className="w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
                {/* SVG Grid lines */}
                <line x1="0" y1="40" x2="200" y2="40" className="stroke-white/5 stroke-1 stroke-dasharray-[2]" />
                <line x1="0" y1="20" x2="200" y2="20" className="stroke-white/5 stroke-1 stroke-dasharray-[2]" />
                <line x1="0" y1="60" x2="200" y2="60" className="stroke-white/5 stroke-1 stroke-dasharray-[2]" />

                {/* Graph Path */}
                {simPoints.length > 1 && (
                  <path
                    d={`M ${simPoints.map(p => `${p.x * 10.5},${p.y}`).join(" L ")}`}
                    fill="none"
                    stroke={speed > 110 ? "#FF2BD6" : "#C6FF00"}
                    strokeWidth="2"
                    className="transition-all duration-100"
                  />
                )}
              </svg>
              <div className="absolute top-2 left-2 text-[8px] font-black uppercase tracking-wider text-mutedgray/60 font-mono">SENSOR_STREAM.DAT</div>
            </div>

            {/* Limit Warning banner if high speed reached */}
            {speed > 120 && (
              <div className="mb-4 py-2 px-3 bg-hyperpink/10 border border-hyperpink/20 text-hyperpink rounded-xl text-center text-[10px] font-black tracking-widest uppercase animate-pulse">
                {t.simLimitWarning}
              </div>
            )}

            {/* Interactive Boost Trigger button */}
            <button
              onMouseDown={startAcceleration}
              onMouseUp={stopAcceleration}
              onMouseLeave={stopAcceleration}
              onTouchStart={startAcceleration}
              onTouchEnd={stopAcceleration}
              className={`w-full py-4 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-lg select-none active:scale-[0.98] ${
                isAccelerating 
                  ? "bg-hyperpink border-transparent text-white shadow-glow-pink-lg animate-pulse" 
                  : "bg-volt border-transparent text-black shadow-glow-volt hover:bg-volt/95"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Gauge className={`h-4 w-4 ${isAccelerating ? "animate-spin" : ""}`} />
                {isAccelerating ? "BOOST ACTIVE" : t.simPressToAccelerate}
              </div>
            </button>
            <p className="text-[9px] font-black text-center text-mutedgray/50 uppercase tracking-widest mt-2">{t.simSubtitle}</p>
          </Card>
        </div>
      </section>

      {/* 3. KEY FEATURES GRID */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-20 border-t border-white/5">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 select-none">
          <span className="text-[9px] font-black tracking-[0.25em] text-volt uppercase block mb-2">FEATURES PACK</span>
          <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight">{t.featuresTitle}</h2>
          <p className="text-xs font-black uppercase text-mutedgray mt-2 tracking-wide leading-relaxed">{t.featuresSubtitle}</p>
        </div>

        {/* Feature Grid Chassis */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card Feature 1 */}
          <Card glow="volt" className="p-6 border border-white/10 hover:bg-white/5 transition-colors group">
            <div className="bg-volt/10 border border-volt/20 p-3 rounded-2xl w-fit mb-4 group-hover:scale-105 transition-transform">
              <Zap className="h-5 w-5 text-volt fill-volt/10" />
            </div>
            <h3 className="text-base font-black uppercase tracking-wider text-white mb-2">{t.feat1Title}</h3>
            <p className="text-xs font-semibold text-mutedgray leading-relaxed uppercase">{t.feat1Desc}</p>
          </Card>

          {/* Card Feature 2 */}
          <Card glow="pink" className="p-6 border border-white/10 hover:bg-white/5 transition-colors group">
            <div className="bg-hyperpink/10 border border-hyperpink/20 p-3 rounded-2xl w-fit mb-4 group-hover:scale-105 transition-transform">
              <Compass className="h-5 w-5 text-hyperpink" />
            </div>
            <h3 className="text-base font-black uppercase tracking-wider text-white mb-2">{t.feat2Title}</h3>
            <p className="text-xs font-semibold text-mutedgray leading-relaxed uppercase">{t.feat2Desc}</p>
          </Card>

          {/* Card Feature 3 */}
          <Card glow="volt" className="p-6 border border-white/10 hover:bg-white/5 transition-colors group">
            <div className="bg-volt/10 border border-volt/20 p-3 rounded-2xl w-fit mb-4 group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5 text-volt" />
            </div>
            <h3 className="text-base font-black uppercase tracking-wider text-white mb-2">{t.feat3Title}</h3>
            <p className="text-xs font-semibold text-mutedgray leading-relaxed uppercase">{t.feat3Desc}</p>
          </Card>

          {/* Card Feature 4 */}
          <Card glow="pink" className="p-6 border border-white/10 hover:bg-white/5 transition-colors group">
            <div className="bg-hyperpink/10 border border-hyperpink/20 p-3 rounded-2xl w-fit mb-4 group-hover:scale-105 transition-transform">
              <Trophy className="h-5 w-5 text-hyperpink" />
            </div>
            <h3 className="text-base font-black uppercase tracking-wider text-white mb-2">{t.feat4Title}</h3>
            <p className="text-xs font-semibold text-mutedgray leading-relaxed uppercase">{t.feat4Desc}</p>
          </Card>
        </div>
      </section>

      {/* 4. HIGH-CONVERTING PRICING SECTION */}
      <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-20 border-t border-white/5">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 select-none">
          <span className="text-[9px] font-black tracking-[0.25em] text-hyperpink uppercase block mb-2">GRID MEMBERSHIP</span>
          <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight">{t.pricingTitle}</h2>
          <p className="text-xs font-black uppercase text-mutedgray mt-2 tracking-wide leading-relaxed">{t.pricingSubtitle}</p>
        </div>

        {/* Pricing Cards Layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          
          {/* Plan 1: Pilot Standard */}
          <Card className="flex flex-col justify-between border border-white/10 p-8 bg-black/40 hover:scale-[1.01] transition-transform duration-300 relative">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4.5 w-4.5 text-mutedgray" />
                <span className="text-sm font-black uppercase tracking-widest text-mutedgray">{t.plan1Name}</span>
              </div>
              <p className="text-[10px] text-mutedgray uppercase font-bold leading-normal mb-6">{t.plan1Desc}</p>
              
              <div className="flex items-baseline gap-1 mb-8 select-none">
                <span className="text-4xl font-black text-white italic tracking-tighter">{t.plan1Price}</span>
              </div>

              {/* Feature List */}
              <ul className="flex flex-col gap-4 text-xs font-bold uppercase tracking-wide text-white/80">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-volt shrink-0" />
                  <span>{t.plan1Feat1}</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-volt shrink-0" />
                  <span>{t.plan1Feat2}</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-volt shrink-0" />
                  <span>{t.plan1Feat3}</span>
                </li>
                <li className="flex items-center gap-2 text-white/40">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span>{t.plan1Feat4}</span>
                </li>
              </ul>
            </div>

            <Button
              variant="glass"
              fullWidth
              onClick={() => navigate("/app/login")}
              className="mt-8 py-3.5 text-xs font-black uppercase tracking-wider"
            >
              {t.pricingCta}
            </Button>
          </Card>

          {/* Plan 2: Pro Elite (Featured Card) */}
          <Card glow="volt" className="flex flex-col justify-between border border-volt/30 p-8 bg-black/70 hover:scale-[1.02] transition-transform duration-300 relative">
            
            {/* Absolute Featured Ribbon/Badge */}
            <div className="absolute top-4 right-4 bg-volt text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-glow-volt">
              {t.plan2Badge}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4.5 w-4.5 text-volt fill-volt/10" />
                <span className="text-sm font-black uppercase tracking-widest text-volt">{t.plan2Name}</span>
              </div>
              <p className="text-[10px] text-mutedgray uppercase font-bold leading-normal mb-6">{t.plan2Desc}</p>
              
              <div className="flex items-baseline gap-1 mb-8 select-none">
                <span className="text-4xl font-black text-white italic tracking-tighter">{t.plan2Price}</span>
                {t.plan2Period && <span className="text-[11px] font-black uppercase tracking-wider text-mutedgray">{t.plan2Period}</span>}
              </div>

              {/* Feature List */}
              <ul className="flex flex-col gap-4 text-xs font-bold uppercase tracking-wide text-white/90">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-volt shrink-0" />
                  <span>{t.plan2Feat1}</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-volt shrink-0" />
                  <span>{t.plan2Feat2}</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-volt shrink-0" />
                  <span>{t.plan2Feat3}</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-volt shrink-0" />
                  <span>{t.plan2Feat4}</span>
                </li>
              </ul>
            </div>

            <Button
              variant="volt"
              fullWidth
              onClick={() => navigate("/app/login")}
              className="mt-8 py-4 text-xs font-black uppercase tracking-wider shadow-glow-volt"
            >
              {t.pricingCta}
            </Button>
          </Card>

          {/* Plan 3: Team Escuderia */}
          <Card className="flex flex-col justify-between border border-white/10 p-8 bg-black/40 hover:scale-[1.01] transition-transform duration-300 relative">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-4.5 w-4.5 text-hyperpink" />
                <span className="text-sm font-black uppercase tracking-widest text-hyperpink">{t.plan3Name}</span>
              </div>
              <p className="text-[10px] text-mutedgray uppercase font-bold leading-normal mb-6">{t.plan3Desc}</p>
              
              <div className="flex items-baseline gap-1 mb-8 select-none">
                <span className="text-4xl font-black text-white italic tracking-tighter">{t.plan3Price}</span>
                {t.plan3Period && <span className="text-[11px] font-black uppercase tracking-wider text-mutedgray">{t.plan3Period}</span>}
              </div>

              {/* Feature List */}
              <ul className="flex flex-col gap-4 text-xs font-bold uppercase tracking-wide text-white/80">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-volt shrink-0" />
                  <span>{t.plan3Feat1}</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-volt shrink-0" />
                  <span>{t.plan3Feat2}</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-volt shrink-0" />
                  <span>{t.plan3Feat3}</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-volt shrink-0" />
                  <span>{t.plan3Feat4}</span>
                </li>
              </ul>
            </div>

            <Button
              variant="glass"
              fullWidth
              onClick={() => navigate("/app/login")}
              className="mt-8 py-3.5 text-xs font-black uppercase tracking-wider hover:border-hyperpink/40"
            >
              {t.pricingCta}
            </Button>
          </Card>
        </div>
      </section>

      {/* 5. INTERACTIVE FAQ ACCORDION SECTION */}
      <section id="faq" className="relative z-10 max-w-4xl mx-auto px-4 py-20 border-t border-white/5">
        
        {/* Section Header */}
        <div className="text-center mb-16 select-none">
          <span className="text-[9px] font-black tracking-[0.25em] text-volt uppercase block mb-2">KNOWLEDGE BASE</span>
          <h2 className="text-3xl font-black uppercase italic tracking-tight">{t.faqTitle}</h2>
          <p className="text-xs font-black uppercase text-mutedgray mt-2 tracking-wide">{t.faqSubtitle}</p>
        </div>

        {/* Accordions chassis */}
        <div className="flex flex-col gap-4">
          
          {/* FAQ Item 1 */}
          <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/3 backdrop-blur-md transition-all">
            <button
              onClick={() => toggleFaq(0)}
              className={`w-full flex items-center justify-between p-5 text-left text-xs md:text-sm font-black uppercase tracking-wide hover:bg-white/5 transition-colors focus:outline-none select-none ${
                theme === "light" ? "text-slate-900" : "text-white"
              }`}
            >
              <span>{t.faqQ1}</span>
              <ChevronDown className={`h-4.5 w-4.5 text-volt transition-transform duration-300 ${faqOpen[0] ? "rotate-180" : ""}`} />
            </button>
            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                faqOpen[0] ? "max-h-96 border-t border-white/5 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p className="p-5 text-xs font-semibold leading-relaxed text-mutedgray uppercase tracking-wider">
                {t.faqA1}
              </p>
            </div>
          </div>

          {/* FAQ Item 2 */}
          <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/3 backdrop-blur-md transition-all">
            <button
              onClick={() => toggleFaq(1)}
              className={`w-full flex items-center justify-between p-5 text-left text-xs md:text-sm font-black uppercase tracking-wide hover:bg-white/5 transition-colors focus:outline-none select-none ${
                theme === "light" ? "text-slate-900" : "text-white"
              }`}
            >
              <span>{t.faqQ2}</span>
              <ChevronDown className={`h-4.5 w-4.5 text-volt transition-transform duration-300 ${faqOpen[1] ? "rotate-180" : ""}`} />
            </button>
            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                faqOpen[1] ? "max-h-96 border-t border-white/5 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p className="p-5 text-xs font-semibold leading-relaxed text-mutedgray uppercase tracking-wider">
                {t.faqA2}
              </p>
            </div>
          </div>

          {/* FAQ Item 3 */}
          <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/3 backdrop-blur-md transition-all">
            <button
              onClick={() => toggleFaq(2)}
              className={`w-full flex items-center justify-between p-5 text-left text-xs md:text-sm font-black uppercase tracking-wide hover:bg-white/5 transition-colors focus:outline-none select-none ${
                theme === "light" ? "text-slate-900" : "text-white"
              }`}
            >
              <span>{t.faqQ3}</span>
              <ChevronDown className={`h-4.5 w-4.5 text-volt transition-transform duration-300 ${faqOpen[2] ? "rotate-180" : ""}`} />
            </button>
            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                faqOpen[2] ? "max-h-96 border-t border-white/5 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p className="p-5 text-xs font-semibold leading-relaxed text-mutedgray uppercase tracking-wider">
                {t.faqA3}
              </p>
            </div>
          </div>

          {/* FAQ Item 4 */}
          <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/3 backdrop-blur-md transition-all">
            <button
              onClick={() => toggleFaq(3)}
              className={`w-full flex items-center justify-between p-5 text-left text-xs md:text-sm font-black uppercase tracking-wide hover:bg-white/5 transition-colors focus:outline-none select-none ${
                theme === "light" ? "text-slate-900" : "text-white"
              }`}
            >
              <span>{t.faqQ4}</span>
              <ChevronDown className={`h-4.5 w-4.5 text-volt transition-transform duration-300 ${faqOpen[3] ? "rotate-180" : ""}`} />
            </button>
            <div 
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                faqOpen[3] ? "max-h-96 border-t border-white/5 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p className="p-5 text-xs font-semibold leading-relaxed text-mutedgray uppercase tracking-wider">
                {t.faqA4}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 6. CLEAN PREMIUM FOOTER */}
      <footer className={`relative z-10 border-t py-12 transition-all duration-300 ${
        theme === "light" 
          ? "bg-white border-slate-200/80 shadow-[0_-8px_30px_rgba(0,0,0,0.02)]" 
          : "bg-[#030305] border-white/5"
      }`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Logo footer */}
          <div className="flex items-center gap-2 select-none">
            <div className="bg-volt/10 border border-volt/20 p-1.5 rounded-xl">
              <Flame className="h-4.5 w-4.5 text-volt" />
            </div>
            <span className={`text-sm font-black tracking-tight uppercase italic ${
              theme === "light" ? "text-slate-900" : "text-white"
            }`}>
              VELO<span className="text-volt">ZTY</span>
            </span>
          </div>

          {/* Copy statement */}
          <p className={`text-[10px] font-black uppercase tracking-widest text-center md:text-left ${
            theme === "light" ? "text-slate-500/80" : "text-mutedgray/50"
          }`}>
            &copy; {new Date().getFullYear()} {t.footerText}
          </p>

          {/* Footer absolute text links */}
          <div className={`flex gap-4 text-[9px] font-black uppercase tracking-wider ${
            theme === "light" ? "text-slate-600" : "text-mutedgray/60"
          }`}>
            <span 
              onClick={() => navigate("/privacy")}
              className="hover:text-volt cursor-pointer transition-colors"
            >
              {t.footerPrivacy}
            </span>
            <span>•</span>
            <span 
              onClick={() => navigate("/terms")}
              className="hover:text-volt cursor-pointer transition-colors"
            >
              {t.footerTerms}
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
