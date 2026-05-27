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
    heroBadge: "⚡ TELEMETRIA DE PRÓXIMA GERAÇÃO v2.0",
    heroTitlePre: "SINTA A",
    heroTitleVolt: "VELOCIDADE",
    heroTitlePost: "EM TEMPO REAL",
    heroSubtitle: "A plataforma definitiva de telemetria GPS em tempo real para ciclistas, corredores e entusiastas de velocidade. Monitore, dispute e domine o asfalto com seus amigos.",
    ctaStart: "Começar Agora",
    ctaExplore: "Descobrir Corridas",
    activeRaces: "Corridas Ativas",
    pilotsOnline: "Pilotos Conectados",
    avgSpeed: "Média Global",
    simTitle: "Simulador de Telemetria Velozty",
    simSubtitle: "Mantenha pressionado o botão para acelerar o sensor de telemetria!",
    simSpeed: "Velocidade",
    simHr: "Batimentos",
    simGForce: "Força G",
    simPressToAccelerate: "Pressione para Acelerar",
    simLimitWarning: "ALERTA: LIMITE EXCEDIDO!",
    featuresTitle: "Recursos Desenvolvidos para Pilotos de Elite",
    featuresSubtitle: "Equipado com a mais alta tecnologia de processamento e precisão geográfica.",
    feat1Title: "Telemetria Instantânea",
    feat1Desc: "Transmissão contínua com latência abaixo de 200ms. Seus amigos acompanham cada metro percorrido no mapa.",
    feat2Title: "Precisão Geográfica",
    feat2Desc: "Algoritmos inteligentes de suavização de GPS e auto-pause garantem métricas precisas mesmo sob túneis.",
    feat3Title: "Lobbies de Corrida",
    feat3Desc: "Crie ou participe de corridas em segundos. Sistema de largadas sincronizadas e apuração imediata no grid.",
    feat4Title: "Hall da Fama",
    feat4Desc: "Consagre-se o piloto mais vitorioso da sua região e lidere os rankings gerais por modalidade.",
    pricingTitle: "Acesso Ilimitado à Velocidade",
    pricingSubtitle: "Escolha o plano ideal para suas ambições no asfalto.",
    plan1Name: "Piloto",
    plan1Price: "Grátis",
    plan1Desc: "Ideal para atletas individuais em treinamento ou corredores recreativos.",
    plan1Feat1: "Telemetria em Tempo Real básica",
    plan1Feat2: "Até 3 corridas salvas por semana",
    plan1Feat3: "1 canal de espectador ativo",
    plan1Feat4: "GPS Standard (1Hz)",
    plan2Name: "Velozty Pro",
    plan2Price: "R$ 19,90",
    plan2Period: "/mês",
    plan2Desc: "Perfeito para ciclistas e atletas focados em alta performance.",
    plan2Feat1: "Telemetria Pro (Frequência de 5Hz)",
    plan2Feat2: "Corridas ilimitadas & Histórico completo",
    plan2Feat3: "Áudio Coach por Voz integrado",
    plan2Feat4: "Buffer GPS Offline (nunca perca dados)",
    plan2Badge: "Mais Vendido",
    plan3Name: "Escuderia",
    plan3Price: "R$ 89,90",
    plan3Period: "/mês",
    plan3Desc: "Desenhado para equipes de corrida, treinadores e criadores de conteúdo.",
    plan3Feat1: "Sobreposição de Transmissão (OBS/Twitch)",
    plan3Feat2: "Painel de controle para múltiplos pilotos",
    plan3Feat3: "Análise avançada de telemetria comparativa",
    plan3Feat4: "Suporte VIP & Hospedagem de Eventos Públicos",
    pricingCta: "Garantir Meu Lugar no Grid",
    faqTitle: "Perguntas Frequentes",
    faqSubtitle: "Tudo o que você precisa saber sobre a telemetria do Velozty.",
    faqQ1: "Como funciona a telemetria em tempo real?",
    faqA1: "O aplicativo utiliza a API de geolocalização do seu dispositivo móvel para capturar sua posição, velocidade e altitude. Esses dados são transmitidos instantaneamente para a nuvem através de WebSockets do Supabase, permitindo que qualquer pessoa com seu link de espectador veja seu progresso ao vivo em um mapa interativo.",
    faqQ2: "Eu preciso de um hardware ou sensor dedicado?",
    faqA2: "Não! O Velozty foi desenvolvido para rodar diretamente no navegador do seu smartphone. Basta dar a permissão de GPS e você estará pronto para transmitir. Ele também é compatível com os sensores nativos de smartwatches caso integrados ao seu navegador.",
    faqQ3: "O aplicativo consome muita bateria ou internet?",
    faqA3: "Nossos algoritmos são otimizados de forma extrema! A transmissão de dados consome menos de 5MB por hora de uso contínuo, e o modo economia de tela ajuda a poupar sua bateria desligando renderizações pesadas quando o celular está no bolso.",
    faqQ4: "Posso criar corridas privadas apenas para meus amigos?",
    faqA4: "Com certeza. Ao configurar uma corrida, você pode deixá-la em modo Privado. Somente quem possuir o código de convite de 6 dígitos poderá ingressar no grid de largada ou assistir como espectador (caso habilitado).",
    footerText: "Velozty Telemetry Systems Inc. Desenvolvido para entusiastas de adrenalina.",
    footerPrivacy: "Política de Privacidade",
    footerTerms: "Termos de Serviço",
  },
  en: {
    heroBadge: "⚡ NEXT-GEN TELEMETRY v2.0",
    heroTitlePre: "FEEL THE",
    heroTitleVolt: "SPEED",
    heroTitlePost: "IN REAL TIME",
    heroSubtitle: "The ultimate real-time GPS telemetry platform for cyclists, runners, and speed enthusiasts. Track, compete, and dominate the asphalt with your friends.",
    ctaStart: "Get Started Now",
    ctaExplore: "Explore Races",
    activeRaces: "Active Races",
    pilotsOnline: "Connected Pilots",
    avgSpeed: "Global Average",
    simTitle: "Velozty Telemetry Simulator",
    simSubtitle: "Hold down the button to accelerate the telemetry sensor!",
    simSpeed: "Speed",
    simHr: "Heart Rate",
    simGForce: "G-Force",
    simPressToAccelerate: "Press to Accelerate",
    simLimitWarning: "WARNING: LIMIT EXCEEDED!",
    featuresTitle: "Features Engineered for Elite Pilots",
    featuresSubtitle: "Equipped with the highest processing tech and geographical precision.",
    feat1Title: "Instant Telemetry",
    feat1Desc: "Continuous transmission with sub-200ms latency. Friends follow every single meter of your route live.",
    feat2Title: "Geographical Accuracy",
    feat2Desc: "Smart GPS smoothing algorithms and auto-pause guarantee precise metrics even under tunnels.",
    feat3Title: "Race Lobbies",
    feat3Desc: "Create or join race rooms in seconds. Sychronized starts and instant leaderboard calculation.",
    feat4Title: "Hall of Fame",
    feat4Desc: "Establish yourself as the most victorious racer in your region and lead the absolute modality charts.",
    pricingTitle: "Unlimited Access to Speed",
    pricingSubtitle: "Choose the perfect plan for your asphalt ambitions.",
    plan1Name: "Pilot",
    plan1Price: "Free",
    plan1Desc: "Ideal for individual training or recreational runners.",
    plan1Feat1: "Basic Real-Time Telemetry",
    plan1Feat2: "Up to 3 saved races per week",
    plan1Feat3: "1 active spectator channel",
    plan1Feat4: "Standard GPS (1Hz)",
    plan2Name: "Velozty Pro",
    plan2Price: "$ 4.90",
    plan2Period: "/month",
    plan2Desc: "Perfect for high-performance cyclists and dedicated athletes.",
    plan2Feat1: "Pro Telemetry (5Hz update frequency)",
    plan2Feat2: "Unlimited races & full history logs",
    plan2Feat3: "Integrated Audio Voice Coach",
    plan2Feat4: "Offline GPS Buffer (never lose telemetry)",
    plan2Badge: "Best Seller",
    plan3Name: "Squad",
    plan3Price: "$ 19.90",
    plan3Period: "/month",
    plan3Desc: "Designed for race teams, professional coaches, and content creators.",
    plan3Feat1: "Live Stream Overlay (OBS/Twitch support)",
    plan3Feat2: "Dashboard control for multiple pilots",
    plan3Feat3: "Advanced comparative telemetry analysis",
    plan3Feat4: "VIP support & public event hosting privileges",
    pricingCta: "Claim My Grid Spot",
    faqTitle: "Frequently Asked Questions",
    faqSubtitle: "Everything you need to know about Velozty telemetry.",
    faqQ1: "How does real-time telemetry work?",
    faqA1: "The app utilizes your device's built-in GPS sensor to capture position, speed, and elevation. This data is instantly streamed to our cloud via Supabase WebSockets, enabling anyone with your spectator link to track your progress live on a dynamic web map.",
    faqQ2: "Do I need any dedicated hardware or sensors?",
    faqA2: "No! Velozty is designed to run directly in your smartphone's web browser. Just grant GPS location access and you are ready to broadcast. It also works with built-in smartwatch sensors if supported by your browser.",
    faqQ3: "Does it drain battery or consume too much mobile data?",
    faqA3: "Our algorithms are highly optimized. Continuous data stream uses less than 5MB of mobile data per hour, and our screen-saver mode prevents heavy render battery drain when your phone is placed in your pocket.",
    faqQ4: "Can I host private races only for my friends?",
    faqA4: "Absolutely. When building a race lobby, you can select Private mode. Only users who enter your specific 6-digit invite code can join the grid or spectate your real-time telemetry dashboard.",
    footerText: "Velozty Telemetry Systems Inc. Built for adrenaline enthusiasts.",
    footerPrivacy: "Privacy Policy",
    footerTerms: "Terms of Service",
  },
  es: {
    heroBadge: "⚡ TELEMETRÍA DE PRÓXIMA GENERACIÓN v2.0",
    heroTitlePre: "SIENTE LA",
    heroTitleVolt: "VELOCIDAD",
    heroTitlePost: "EN TIEMPO REAL",
    heroSubtitle: "La plataforma definitiva de telemetría GPS en tiempo real para ciclistas, corredores y entusiastas de la velocidad. Monitorea, compite y domina el asfalto con tus amigos.",
    ctaStart: "Empezar Ahora",
    ctaExplore: "Descubrir Carreras",
    activeRaces: "Carreras Activas",
    pilotsOnline: "Pilotos Conectados",
    avgSpeed: "Media Global",
    simTitle: "Simulador de Telemetría Velozty",
    simSubtitle: "¡Mantén presionado el botón para acelerar el sensor de telemetría!",
    simSpeed: "Velocidad",
    simHr: "Pulsaciones",
    simGForce: "Fuerza G",
    simPressToAccelerate: "Mantén para Acelerar",
    simLimitWarning: "ALERTA: ¡LÍMITE EXCEDIDO!",
    featuresTitle: "Recursos Diseñados para Pilotos de Elite",
    featuresSubtitle: "Equipado con la más alta tecnología de procesamiento y precisión geográfica.",
    feat1Title: "Telemetría Instantánea",
    feat1Desc: "Transmisión continua con latencia inferior a 200ms. Tus amigos siguen cada metro recorrido en vivo.",
    feat2Title: "Precisión Geográfica",
    feat2Desc: "Algoritmos inteligentes de suavizado de GPS y auto-pause garantizan métricas exactas incluso en túneles.",
    feat3Title: "Lobbies de Carrera",
    feat3Desc: "Crea o únete a salas de carrera en segundos. Largadas sincronizadas y cálculo de clasificación al instante.",
    feat4Title: "Salón de la Fama",
    feat4Desc: "Conságrate como el piloto más victorioso de tu región y lidera los rankings generales por modalidad.",
    pricingTitle: "Acceso Ilimitado a la Velocidad",
    pricingSubtitle: "Elige el plan ideal para tus ambiciones en el asfalto.",
    plan1Name: "Piloto",
    plan1Price: "Gratis",
    plan1Desc: "Ideal para atletas individuales en entrenamiento o corredores recreativos.",
    plan1Feat1: "Telemetría en tiempo real básica",
    plan1Feat2: "Hasta 3 carreras guardadas por semana",
    plan1Feat3: "1 canal de espectador activo",
    plan1Feat4: "GPS Estándar (1Hz)",
    plan2Name: "Velozty Pro",
    plan2Price: "$ 4.90",
    plan2Period: "/mes",
    plan2Desc: "Perfecto para ciclistas y atletas enfocados en alto rendimiento.",
    plan2Feat1: "Telemetría Pro (Frecuencia de 5Hz)",
    plan2Feat2: "Carreras ilimitadas e Historial completo",
    plan2Feat3: "Audio Coach por Voz integrado",
    plan2Feat4: "Buffer GPS Offline (nunca pierdas datos)",
    plan2Badge: "Más Vendido",
    plan3Name: "Escudería",
    plan3Price: "$ 19.90",
    plan3Period: "/mes",
    plan3Desc: "Diseñado para equipos de carrera, entrenadores profesionales y creadores de contenido.",
    plan3Feat1: "Superposición de Transmisión (OBS/Twitch)",
    plan3Feat2: "Panel de control para múltiples pilotos",
    plan3Feat3: "Análisis avanzado de telemetría comparativa",
    plan3Feat4: "Soporte VIP y hospedaje de eventos públicos",
    pricingCta: "Asegurar Mi Lugar en la Parrilla",
    faqTitle: "Preguntas Frecuentes",
    faqSubtitle: "Todo lo que necesitas saber sobre la telemetría de Velozty.",
    faqQ1: "¿Cómo funciona la telemetría en tiempo real?",
    faqA1: "La aplicación utiliza el sensor GPS incorporado de tu dispositivo móvil para capturar posición, velocidad y altitud. Estos datos se transmiten instantáneamente a nuestra nube mediante WebSockets de Supabase, lo que permite que cualquiera con tu enlace de espectador siga tu progreso en vivo en un mapa interactivo.",
    faqQ2: "¿Necesito algún hardware o sensor dedicado?",
    faqA2: "¡No! Velozty está diseñado para funcionar directamente en el navegador web de tu smartphone. Solo concede acceso a la ubicación y estarás listo para transmitir. También es compatible con los sensores integrados de relojes inteligentes si son compatibles con tu navegador.",
    faqQ3: "¿Consume mucha batería o datos móviles?",
    faqA3: "Nuestros algoritmos están altamente optimizados. La transmisión continua de datos consume menos de 5MB por hora de uso y nuestro protector de pantalla ayuda a prevenir el consumo de batería al desactivar renderizados cuando tienes el móvil guardado.",
    faqQ4: "¿Puedo crear carreras privadas solo para mis amigos?",
    faqA4: "Por supuesto. Al configurar una carrera, puedes elegir el modo Privado. Solo los usuarios que tengan tu código de invitación específico de 6 dígitos podrán unirse a la carrera o seguir la telemetría en vivo.",
    footerText: "Velozty Telemetry Systems Inc. Desarrollado para los amantes de la adrenalina.",
    footerPrivacy: "Política de Privacidad",
    footerTerms: "Términos de Servicio",
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
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
            {(["pt", "en", "es"] as const).map(lang => (
              <button
                key={lang}
                onClick={() => setLocale(lang)}
                className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg transition-all focus:outline-none ${
                  locale === lang 
                    ? "bg-volt text-black shadow-glow-volt" 
                    : "text-mutedgray hover:text-white hover:bg-white/5"
                }`}
              >
                {lang}
              </button>
            ))}
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
              className="w-full flex items-center justify-between p-5 text-left text-xs md:text-sm font-black uppercase tracking-wide text-white hover:bg-white/5 transition-colors focus:outline-none select-none"
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
              className="w-full flex items-center justify-between p-5 text-left text-xs md:text-sm font-black uppercase tracking-wide text-white hover:bg-white/5 transition-colors focus:outline-none select-none"
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
              className="w-full flex items-center justify-between p-5 text-left text-xs md:text-sm font-black uppercase tracking-wide text-white hover:bg-white/5 transition-colors focus:outline-none select-none"
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
              className="w-full flex items-center justify-between p-5 text-left text-xs md:text-sm font-black uppercase tracking-wide text-white hover:bg-white/5 transition-colors focus:outline-none select-none"
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
      <footer className="relative z-10 border-t border-white/5 bg-[#030305] py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Logo footer */}
          <div className="flex items-center gap-2 select-none">
            <div className="bg-volt/10 border border-volt/20 p-1.5 rounded-xl">
              <Flame className="h-4.5 w-4.5 text-volt" />
            </div>
            <span className="text-sm font-black tracking-tight text-white uppercase italic">
              VELO<span className="text-volt">ZTY</span>
            </span>
          </div>

          {/* Copy statement */}
          <p className="text-[10px] font-black uppercase tracking-widest text-mutedgray/50 text-center md:text-left">
            &copy; {new Date().getFullYear()} {t.footerText}
          </p>

          {/* Footer absolute text links */}
          <div className="flex gap-4 text-[9px] font-black uppercase tracking-wider text-mutedgray/60">
            <span className="hover:text-volt cursor-pointer transition-colors">{t.footerPrivacy}</span>
            <span>•</span>
            <span className="hover:text-volt cursor-pointer transition-colors">{t.footerTerms}</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
