import React from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../components/i18n/I18nProvider";
import { useTheme } from "../App";
import { Card } from "../components/ui/Card";
import { ArrowLeft, Shield, Key } from "lucide-react";

const translations = {
  pt: {
    title: "Política de Privacidade",
    subtitle: "Sua privacidade é sagrada: como cuidamos dos seus dados.",
    back: "Voltar para o Início",
    intro: "Sua confiança é a coisa mais valiosa que temos. No Velozty, cuidamos dos seus dados com o maior carinho e transparência. Aqui explicamos exatamente quais dados coletamos e para que os usamos, sem termos jurídicos difíceis.",
    sec1Title: "1. Quais Dados Coletamos?",
    sec1Text: "Para o app funcionar, coletamos informações básicas como seu apelido (display name), e-mail de cadastro, foto de perfil (se você colocar) e as coordenadas de GPS enviadas pelo seu celular enquanto você está participando ativamente de um grupo ou corrida.",
    sec2Title: "2. Como Usamos o Seu GPS?",
    sec2Text: "Seu GPS só é ativado e transmitido quando você clica em iniciar uma corrida ou entra no mapa de um grupo ativamente. Não rastreamos você em segundo plano quando o aplicativo está fechado ou inativo. A localização serve apenas para desenhar seu trajeto ao vivo para seus amigos e calcular sua velocidade.",
    sec3Title: "3. Quem Pode Ver Seus Dados?",
    sec3Text: "Ao criar um grupo público ou deixar seu perfil público, outros usuários poderão ver seu apelido, foto de perfil e seu trajeto no mapa. Se preferir privacidade total, você pode configurar perfis privados e lobbies com senha, garantindo que somente seus amigos convidados tenham acesso.",
    sec4Title: "4. Seus Direitos de Privacidade (LGPD)",
    sec4Text: "Você é o dono dos seus dados! A qualquer momento você pode acessar o Painel de Configurações no aplicativo e: 1) Exportar todos os dados guardados em sua conta em formato legível, ou 2) Apagar definitivamente sua conta e todos os trajetos, registros e posts salvos.",
    sec5Title: "5. Segurança e Armazenamento",
    sec5Text: "Seus dados de acesso e localização são armazenados de forma criptografada na infraestrutura de nuvem segura do Supabase. Nós nunca vendemos seus dados para terceiros e não exibimos anúncios chatos no app.",
  },
  en: {
    title: "Privacy Policy",
    subtitle: "Your privacy is sacred: how we protect your data.",
    back: "Back to Home",
    intro: "Your trust is the most valuable thing we have. At Velozty, we care for your data with the highest safety and absolute transparency. Here we explain exactly what data we collect and how we use it, entirely without complex jargon.",
    sec1Title: "1. What Data Do We Collect?",
    sec1Text: "For the app to work, we collect basic details like your nickname (display name), registration email, profile avatar (if uploaded), and the real-time GPS coordinates sent by your phone while actively participating in a group or race.",
    sec2Title: "2. How Do We Use Your GPS?",
    sec2Text: "Your GPS location is only active and streamed when you click to start a workout or actively join a group ride. We never track you in the background when the app is closed or inactive. Location is exclusively used to draw your live trail for friends and calculate speed metrics.",
    sec3Title: "3. Who Can See Your Information?",
    sec3Text: "When creating a public lobby or keeping a public profile, other users can see your nickname, avatar, and live map trails. For absolute privacy, you can configure private profiles and password-secured lobbies so only invited friends gain access.",
    sec4Title: "4. Your Privacy Rights (GDPR/LGPD)",
    sec4Text: "You own your data! At any time, you can visit the App Settings panel and: 1) Export all data stored on your account in a clean readable file, or 2) Permanently delete your account and all associated trails, logs, and social posts.",
    sec5Title: "5. Safety & Secure Storage",
    sec5Text: "Your credentials and location records are securely encrypted and stored within Supabase's safe cloud infrastructure. We never sell your data to third parties and we host zero annoying ads.",
  },
  es: {
    title: "Política de Privacidad",
    subtitle: "Tu privacidad es sagrada: cómo cuidamos tus datos.",
    back: "Volver al Inicio",
    intro: "Tu confianza es lo más valioso que tenemos. En Velozty, cuidamos tus datos con el mayor cariño y absoluta transparencia. Aquí te explicamos exactamente qué datos recopilamos y para qué los usamos, sin términos legales confusos.",
    sec1Title: "1. ¿Qué Datos Recopilamos?",
    sec1Text: "Para que la aplicación funcione, recopilamos información básica como tu apodo (display name), correo electrónico de registro, foto de perfil (si decides subirla) y las coordenadas de GPS enviadas por tu móvil mientras participas activamente en un grupo o carrera.",
    sec2Title: "2. ¿Cómo Usamos Tu GPS?",
    sec2Text: "Tu GPS solo se activa y transmite cuando haces clic en iniciar una carrera o te unes activamente al mapa de un grupo. Nunca te rastreamos en segundo plano cuando la aplicación está cerrada o inactiva. La ubicación sirve únicamente para dibujar tu trayecto en vivo para tus amigos y calcular tu velocidad.",
    sec3Title: "3. ¿Quién Puede Ver Tus Datos?",
    sec3Text: "Al crear un grupo público o mantener tu perfil público, otros usuarios podrán ver tu apodo, foto de perfil y tu trayecto en el mapa. Si prefieres privacidad total, puedes configurar perfiles privados y lobbies con contraseña, asegurando que solo tus amigos invitados tengan acceso.",
    sec4Title: "4. Tus Derechos de Privacidad (GDPR/LGPD)",
    sec4Text: "¡Tú eres el dueño de tus datos! En cualquier momento puedes acceder al Panel de Configuración en la aplicación y: 1) Exportar todos los datos guardados en tu cuenta en un formato legible, o 2) Eliminar definitivamente tu cuenta y todos los trayectos, registros y publicaciones guardadas.",
    sec5Title: "5. Seguridad y Almacenamiento",
    sec5Text: "Tus datos de acceso y ubicación se almacenan de forma encriptada en la infraestructura segura en la nube de Supabase. Nunca vendemos tus datos a terceros y no mostramos anuncios molestos en la aplicación.",
  }
};

export const Privacy: React.FC = () => {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const { theme } = useTheme();

  const t = translations[locale as "pt" | "en" | "es"] || translations.pt;

  return (
    <div className="min-h-screen bg-darkbg text-white font-sans relative overflow-x-hidden pb-16 selection:bg-volt selection:text-black">
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-[-10%] right-[20%] w-[500px] h-[500px] rounded-full bg-hyperpink/5 filter blur-[120px] pointer-events-none" />

      {/* Header Container */}
      <header className="max-w-4xl mx-auto px-4 pt-10 pb-6 flex items-center justify-between z-10 relative">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 transition-all font-black text-[10px] uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-hyperpink" />
          {t.back}
        </button>
      </header>

      {/* Content Container */}
      <main className="max-w-3xl mx-auto px-4 z-10 relative flex flex-col gap-6">
        
        {/* Title Card */}
        <Card glow="pink" className="p-8 text-center flex flex-col items-center gap-4">
          <div className="bg-hyperpink/10 border border-hyperpink/30 p-3 rounded-2xl shadow-glow-pink">
            <Shield className="h-8 w-8 text-hyperpink" />
          </div>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-black uppercase tracking-wide leading-tight ${theme === "light" ? "text-slate-900" : "text-white"}`}>
              {t.title}
            </h1>
            <p className="text-xs font-black uppercase text-volt tracking-widest mt-1">
              {t.subtitle}
            </p>
          </div>
        </Card>

        {/* Legal Text Cards */}
        <Card glow="volt" className="p-8 flex flex-col gap-6">
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
              <h3 className="text-sm font-black uppercase tracking-wider text-volt flex items-center gap-2">
                <Key className="h-4.5 w-4.5" />
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

export default Privacy;
