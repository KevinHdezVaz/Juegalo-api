export const metadata = {
  title: 'Soporte — MusicMeet',
  description:
    'Centro de ayuda de MusicMeet. Preguntas frecuentes y contacto con el equipo de soporte.',
};

const SUPPORT_EMAIL = 'kevinv.contacto@gmail.com';
const APP_NAME = 'MusicMeet';

export default function Soporte() {
  return (
    <main style={s.main}>
      {/* ── HEADER ── */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <a href="/musicmeet" style={s.backLink}>
            ← Volver
          </a>
          <div style={s.headerContent}>
            <span style={s.headerIcon}>🎵</span>
            <h1 style={s.headerTitle}>{APP_NAME}</h1>
            <p style={s.headerSub}>Centro de Soporte</p>
          </div>
        </div>
      </header>

      <div style={s.body}>
        {/* ── CONTACT CARD ── */}
        <div style={s.contactCard}>
          <div style={s.contactIcon}>✉️</div>
          <div>
            <p style={s.contactLabel}>¿Necesitas ayuda directa?</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} style={s.contactEmail}>
              {SUPPORT_EMAIL}
            </a>
            <p style={s.contactHint}>Respondemos en menos de 48 horas</p>
          </div>
        </div>

        {/* ── FAQ ── */}
        <h2 style={s.faqTitle}>Preguntas frecuentes</h2>

        {faqSections.map((section) => (
          <div key={section.title} style={s.faqSection}>
            <div style={s.faqSectionHeader}>
              <span style={s.faqSectionIcon}>{section.icon}</span>
              <h3 style={s.faqSectionTitle}>{section.title}</h3>
            </div>
            <div style={s.faqList}>
              {section.items.map((item, i) => (
                <div key={i} style={s.faqItem}>
                  <p style={s.faqQ}>
                    <span style={s.faqQIcon}>❓</span> {item.q}
                  </p>
                  <p style={s.faqA}>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* ── REPORT PROBLEM ── */}
        <div style={s.reportCard}>
          <h3 style={s.reportTitle}>¿No encontraste tu respuesta?</h3>
          <p style={s.reportSub}>
            Escríbenos directamente y te ayudamos a resolverlo.
          </p>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=Soporte MusicMeet`} style={s.reportBtn}>
            Enviar mensaje
          </a>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <p style={s.footerText}>
          © {new Date().getFullYear()} MusicMeet · Todos los derechos reservados
        </p>
        <div style={s.footerLinks}>
          <a href="/musicmeet" style={s.footerLink}>
            Inicio
          </a>
          <span style={s.footerDot}>·</span>
          <a href="/privacidad" style={s.footerLink}>
            Privacidad
          </a>
        </div>
      </footer>
    </main>
  );
}

// ── DATA ──────────────────────────────────────────────────────────────────────

const faqSections = [
  {
    icon: '👤',
    title: 'Cuenta y registro',
    items: [
      {
        q: '¿Cómo creo una cuenta?',
        a: 'Descarga la app en el App Store y regístrate con tu correo electrónico o con tu cuenta de Google o Apple. Solo necesitas unos segundos.',
      },
      {
        q: '¿Olvidé mi contraseña, ¿qué hago?',
        a: 'En la pantalla de inicio de sesión, toca "¿Olvidaste tu contraseña?" e ingresa tu correo. Te enviaremos un enlace para restablecerla.',
      },
      {
        q: '¿Cómo cambio mi foto o nombre de perfil?',
        a: 'Ve a tu perfil desde el menú inferior, toca el ícono de edición y actualiza tu información.',
      },
      {
        q: '¿Puedo tener más de una cuenta?',
        a: 'Cada persona debe usar una sola cuenta. Usar múltiples cuentas puede resultar en la suspensión de todas ellas.',
      },
    ],
  },
  {
    icon: '✅',
    title: 'Verificación',
    items: [
      {
        q: '¿Por qué necesito verificar mi rostro?',
        a: 'La verificación de rostro nos ayuda a garantizar que cada perfil pertenece a una persona real, creando una comunidad más segura y auténtica.',
      },
      {
        q: '¿Mis datos biométricos se almacenan?',
        a: 'No. La captura de rostro solo se usa para verificar que eres una persona real durante el proceso de registro. No guardamos imágenes ni datos biométricos en nuestros servidores.',
      },
      {
        q: '¿Qué hago si la verificación no funciona?',
        a: 'Asegúrate de estar en un lugar bien iluminado, con el rostro centrado en la cámara y sin objetos que lo cubran. Si el problema persiste, contáctanos.',
      },
    ],
  },
  {
    icon: '📱',
    title: 'Uso de la app',
    items: [
      {
        q: '¿Cómo publico contenido?',
        a: 'Toca el botón "+" en la barra inferior para crear una nueva publicación. Puedes agregar texto, fotos y más.',
      },
      {
        q: '¿Cómo encuentro personas con gustos similares?',
        a: 'Usa la sección de Explorar para descubrir perfiles y publicaciones. Puedes filtrar por género musical, instrumentos y más.',
      },
      {
        q: '¿Cómo activo las notificaciones?',
        a: 'Ve a Configuración de tu teléfono → MusicMeet → Notificaciones y actívalas. También puedes gestionarlas desde dentro de la app en tu perfil.',
      },
      {
        q: '¿La app consume muchos datos móviles?',
        a: 'El consumo depende del uso. Puedes conectarte a Wi-Fi para reducir el uso de datos móviles. Actualmente no hay opción de modo de bajo consumo de datos.',
      },
    ],
  },
  {
    icon: '🛡️',
    title: 'Seguridad y privacidad',
    items: [
      {
        q: '¿Cómo reporto un usuario o contenido inapropiado?',
        a: 'Toca los tres puntos (⋯) en cualquier publicación o perfil y selecciona "Reportar". Nuestro equipo revisará el reporte en 24–48 horas.',
      },
      {
        q: '¿Cómo bloqueo a alguien?',
        a: 'Ve al perfil del usuario, toca los tres puntos (⋯) y selecciona "Bloquear". El usuario bloqueado no podrá ver tu perfil ni contactarte.',
      },
      {
        q: '¿Mis datos personales están seguros?',
        a: 'Sí. Usamos Supabase con cifrado en tránsito y en reposo. No vendemos ni compartimos tu información personal con terceros. Consulta nuestra Política de Privacidad para más detalles.',
      },
    ],
  },
  {
    icon: '🗑️',
    title: 'Eliminar cuenta',
    items: [
      {
        q: '¿Cómo elimino mi cuenta?',
        a: 'Puedes solicitar la eliminación de tu cuenta desde la app en Configuración → Cuenta → Eliminar cuenta, o enviando un correo a soporte@musicmeet.app con el asunto "Eliminar cuenta".',
      },
      {
        q: '¿Qué pasa con mis datos al eliminar la cuenta?',
        a: 'Al eliminar tu cuenta, todos tus datos personales, publicaciones y mensajes serán eliminados permanentemente de nuestros servidores en un plazo de 30 días.',
      },
    ],
  },
];

// ── STYLES ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  main: {
    fontFamily: '-apple-system, "Inter", "Segoe UI", sans-serif',
    background: '#F0F4FF',
    color: '#0F172A',
    minHeight: '100vh',
  },

  /* Header */
  header: {
    background: 'linear-gradient(135deg, #1a0533 0%, #0d1a3a 100%)',
    padding: '32px 24px 48px',
  },
  headerInner: { maxWidth: 720, margin: '0 auto' },
  backLink: {
    color: '#C084FC',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
    display: 'inline-block',
    marginBottom: 24,
  },
  headerContent: { textAlign: 'center' as const },
  headerIcon: { fontSize: 48, display: 'block', marginBottom: 12 },
  headerTitle: {
    fontSize: 32,
    fontWeight: 800,
    color: '#fff',
    marginBottom: 8,
  },
  headerSub: { fontSize: 16, color: '#94A3B8' },

  /* Body */
  body: { maxWidth: 720, margin: '0 auto', padding: '32px 24px 60px' },

  /* Contact card */
  contactCard: {
    background: '#fff',
    borderRadius: 20,
    padding: '24px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
    marginBottom: 40,
    border: '1px solid #E2E8F0',
  },
  contactIcon: { fontSize: 36, flexShrink: 0 },
  contactLabel: { fontSize: 13, color: '#64748B', marginBottom: 4 },
  contactEmail: {
    fontSize: 17,
    fontWeight: 700,
    color: '#7C3AED',
    textDecoration: 'none',
    display: 'block',
    marginBottom: 4,
  },
  contactHint: { fontSize: 12, color: '#94A3B8' },

  /* FAQ */
  faqTitle: {
    fontSize: 22,
    fontWeight: 800,
    marginBottom: 24,
    color: '#0F172A',
  },
  faqSection: {
    background: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    border: '1px solid #E2E8F0',
  },
  faqSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '18px 24px',
    background: 'linear-gradient(90deg, rgba(124,58,237,0.05), transparent)',
    borderBottom: '1px solid #F1F5F9',
  },
  faqSectionIcon: { fontSize: 22 },
  faqSectionTitle: { fontSize: 16, fontWeight: 700, color: '#1E1B4B' },
  faqList: { padding: '4px 0' },
  faqItem: {
    padding: '16px 24px',
    borderBottom: '1px solid #F8FAFC',
  },
  faqQ: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1E293B',
    marginBottom: 6,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  },
  faqQIcon: { flexShrink: 0 },
  faqA: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 1.65,
    paddingLeft: 26,
  },

  /* Report card */
  reportCard: {
    background: 'linear-gradient(135deg, #1a0533 0%, #0d1a3a 100%)',
    borderRadius: 20,
    padding: '36px 28px',
    textAlign: 'center' as const,
    marginTop: 40,
  },
  reportTitle: { fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10 },
  reportSub: { fontSize: 14, color: '#94A3B8', marginBottom: 24, lineHeight: 1.6 },
  reportBtn: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #C084FC, #818CF8)',
    color: '#fff',
    padding: '14px 32px',
    borderRadius: 14,
    fontWeight: 700,
    fontSize: 15,
    textDecoration: 'none',
  },

  /* Footer */
  footer: {
    background: '#0A0A0A',
    padding: '28px 24px',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 10,
  },
  footerText: { color: '#4B5563', fontSize: 12 },
  footerLinks: { display: 'flex', gap: 12, alignItems: 'center' },
  footerLink: { color: '#9CA3AF', fontSize: 12, textDecoration: 'none' },
  footerDot: { color: '#4B5563', fontSize: 12 },
};
