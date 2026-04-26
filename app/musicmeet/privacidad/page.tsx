export const metadata = {
  title: 'Política de Privacidad — MusicMeet',
  description: 'Política de privacidad de MusicMeet — Conecta por la música.',
};

const LAST_UPDATED = '26 de abril de 2025';
const APP_NAME = 'MusicMeet';
const CONTACT = 'soporte@musicmeet.app';
const BUNDLE_ID = 'com.musicapp.appMusicComunidad';

export default function Privacidad() {
  return (
    <main style={s.main}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          <span style={s.icon}>🎵</span>
          <h1 style={s.appName}>{APP_NAME}</h1>
          <h2 style={s.pageTitle}>Política de Privacidad</h2>
          <p style={s.updated}>Última actualización: {LAST_UPDATED}</p>
        </div>

        <Section title="1. Introducción">
          <p>
            Bienvenido a <strong>{APP_NAME}</strong> ("nosotros", "nuestra" o "la aplicación").
            Nos comprometemos a proteger tu información personal. Esta Política de Privacidad
            explica qué datos recopilamos, cómo los usamos y cuáles son tus derechos.
          </p>
          <p>
            Al usar la aplicación, aceptas las prácticas descritas en este documento.
            Si no estás de acuerdo, por favor no uses la aplicación.
          </p>
        </Section>

        <Section title="2. Información que recopilamos">
          <Subsection title="2.1 Información que nos proporcionas">
            <ul>
              <li><strong>Correo electrónico</strong> — al registrarte con email/contraseña</li>
              <li><strong>Nombre y foto de perfil</strong> — si inicias sesión con Google o Apple</li>
              <li><strong>Nombre de usuario</strong> — elegido durante el registro</li>
              <li><strong>Géneros musicales e instrumentos</strong> — para personalizar tu perfil</li>
              <li><strong>Publicaciones y comentarios</strong> — contenido que compartes en la app</li>
              <li><strong>Mensajes de chat</strong> — conversaciones con otros usuarios</li>
              <li><strong>Foto de perfil</strong> — imagen que subes voluntariamente</li>
            </ul>
          </Subsection>
          <Subsection title="2.2 Información recopilada automáticamente">
            <ul>
              <li><strong>Identificador de dispositivo</strong> — para envío de notificaciones push</li>
              <li><strong>Ubicación aproximada</strong> — para mostrar eventos y personas cerca de ti (solo con tu permiso)</li>
              <li><strong>Datos de uso</strong> — publicaciones vistas, interacciones y actividad general</li>
              <li><strong>Datos de anuncios</strong> — Google Advertising ID usado por Google Mobile Ads</li>
            </ul>
          </Subsection>
          <Subsection title="2.3 Verificación de rostro">
            <p>
              Durante el proceso de registro, la app puede solicitar acceso a la cámara para verificar
              que eres una persona real. <strong>No almacenamos imágenes de tu rostro ni datos
              biométricos</strong> en nuestros servidores. El proceso de detección ocurre localmente
              en tu dispositivo y solo se usa para confirmar la presencia de un rostro humano.
            </p>
          </Subsection>
          <Subsection title="2.4 Inicio de sesión con terceros">
            <p>
              Si usas Google Sign-In o Sign in with Apple, recibimos información básica de perfil
              (nombre, correo, foto) según los permisos que otorgues. No recibimos tus contraseñas
              de esos servicios.
            </p>
          </Subsection>
        </Section>

        <Section title="3. Cómo usamos tu información">
          <ul>
            <li>Crear y gestionar tu cuenta</li>
            <li>Mostrarte contenido relevante en el feed</li>
            <li>Permitir la comunicación entre usuarios (chat)</li>
            <li>Enviarte notificaciones push sobre actividad en tu perfil</li>
            <li>Mostrar anuncios a través de Google Mobile Ads</li>
            <li>Detectar y prevenir actividades fraudulentas o abusivas</li>
            <li>Mejorar y desarrollar nuevas funcionalidades de la app</li>
            <li>Cumplir con obligaciones legales aplicables</li>
          </ul>
        </Section>

        <Section title="4. Compartir información con terceros">
          <p>No vendemos tu información personal. Podemos compartirla con:</p>
          <ul>
            <li>
              <strong>Supabase</strong> — proveedor de base de datos y autenticación. Tus datos
              se almacenan cifrados en tránsito y en reposo.
            </li>
            <li>
              <strong>Google (Firebase / AdMob)</strong> — notificaciones push y publicidad.
            </li>
            <li>
              <strong>Apple</strong> — autenticación con Sign in with Apple.
            </li>
            <li>
              <strong>Autoridades legales</strong> — cuando sea requerido por ley o para proteger
              derechos legales.
            </li>
          </ul>
        </Section>

        <Section title="5. Almacenamiento y seguridad">
          <p>
            Tus datos se almacenan en servidores seguros proporcionados por Supabase, con cifrado
            TLS en tránsito y cifrado en reposo. Implementamos medidas técnicas y organizativas
            razonables para proteger tu información contra acceso no autorizado, pérdida o alteración.
          </p>
          <p>
            Sin embargo, ningún sistema de seguridad es 100% infalible. Te recomendamos usar una
            contraseña segura y no compartir tus credenciales.
          </p>
        </Section>

        <Section title="6. Permisos de la app">
          <p>La app puede solicitar los siguientes permisos en tu dispositivo:</p>
          <ul>
            <li><strong>Cámara</strong> — para verificación de rostro y subir fotos al perfil</li>
            <li><strong>Galería de fotos</strong> — para seleccionar fotos de perfil o publicaciones</li>
            <li><strong>Ubicación</strong> — para mostrar eventos y personas cerca de ti</li>
            <li><strong>Notificaciones</strong> — para enviarte alertas de actividad</li>
            <li><strong>Micrófono</strong> — si se implementan funciones de audio en el futuro</li>
          </ul>
          <p>
            Puedes revocar cualquier permiso en cualquier momento desde Configuración de tu
            dispositivo → {APP_NAME}.
          </p>
        </Section>

        <Section title="7. Retención de datos">
          <p>
            Conservamos tu información mientras tu cuenta esté activa. Si eliminas tu cuenta,
            procederemos a eliminar tus datos personales de nuestros servidores en un plazo
            máximo de <strong>30 días</strong>, salvo que la ley requiera conservarlos por
            un período mayor.
          </p>
        </Section>

        <Section title="8. Tus derechos">
          <p>Tienes derecho a:</p>
          <ul>
            <li><strong>Acceder</strong> a los datos personales que tenemos sobre ti</li>
            <li><strong>Corregir</strong> información inexacta o incompleta</li>
            <li><strong>Eliminar</strong> tu cuenta y datos personales</li>
            <li><strong>Oponerte</strong> al procesamiento de tus datos para ciertos fines</li>
            <li><strong>Portabilidad</strong> de tus datos en formato legible</li>
          </ul>
          <p>
            Para ejercer cualquiera de estos derechos, contáctanos en{' '}
            <a href={`mailto:${CONTACT}`} style={s.link}>{CONTACT}</a>.
          </p>
        </Section>

        <Section title="9. Privacidad de menores">
          <p>
            {APP_NAME} no está dirigido a menores de 13 años. No recopilamos intencionalmente
            información de menores de 13 años. Si detectamos que un menor ha creado una cuenta,
            la eliminaremos de inmediato. Si eres padre/madre y crees que tu hijo ha registrado
            una cuenta, contáctanos.
          </p>
        </Section>

        <Section title="10. Cambios a esta política">
          <p>
            Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos
            dentro de la app y/o por correo electrónico cuando realicemos cambios significativos.
            La fecha de última actualización siempre estará indicada en la parte superior de
            este documento.
          </p>
        </Section>

        <Section title="11. Contacto">
          <p>Si tienes preguntas o inquietudes sobre esta política, contáctanos:</p>
          <ul>
            <li><strong>Email:</strong>{' '}
              <a href={`mailto:${CONTACT}`} style={s.link}>{CONTACT}</a>
            </li>
            <li><strong>App:</strong> {APP_NAME} ({BUNDLE_ID})</li>
            <li><strong>Soporte:</strong>{' '}
              <a href="/musicmeet/soporte" style={s.link}>musicmeet/soporte</a>
            </li>
          </ul>
        </Section>

        {/* Footer */}
        <div style={s.footer}>
          <p>© {new Date().getFullYear()} {APP_NAME} · Todos los derechos reservados</p>
          <div style={s.footerLinks}>
            <a href="/musicmeet" style={s.footerLink}>Inicio</a>
            <span>·</span>
            <a href="/musicmeet/soporte" style={s.footerLink}>Soporte</a>
          </div>
        </div>
      </div>
    </main>
  );
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={sc.section}>
      <h2 style={sc.sectionTitle}>{title}</h2>
      <div style={sc.sectionBody}>{children}</div>
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={sc.subsection}>
      <h3 style={sc.subsectionTitle}>{title}</h3>
      {children}
    </div>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  main: {
    fontFamily: '-apple-system, "Inter", "Segoe UI", sans-serif',
    background: 'linear-gradient(135deg, #1a0533 0%, #0d1a3a 50%, #0a0f1e 100%)',
    minHeight: '100vh',
    padding: '40px 16px',
  },
  card: {
    maxWidth: 760,
    margin: '0 auto',
    background: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
  },
  header: {
    background: 'linear-gradient(135deg, #1a0533 0%, #0d1a3a 100%)',
    padding: '48px 40px 40px',
    textAlign: 'center' as const,
  },
  icon: { fontSize: 52, display: 'block', marginBottom: 16 },
  appName: { fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8 },
  pageTitle: { fontSize: 18, fontWeight: 600, color: '#C084FC', marginBottom: 12 },
  updated: { fontSize: 13, color: '#64748B', background: 'rgba(255,255,255,0.07)', display: 'inline-block', padding: '4px 14px', borderRadius: 100 },
  link: { color: '#7C3AED', textDecoration: 'none', fontWeight: 600 },
  footer: {
    background: '#0A0A0A',
    padding: '24px 40px',
    textAlign: 'center' as const,
    color: '#4B5563',
    fontSize: 13,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 10,
  },
  footerLinks: { display: 'flex', gap: 12, alignItems: 'center', color: '#4B5563' },
  footerLink: { color: '#9CA3AF', fontSize: 13, textDecoration: 'none' },
};

const sc: Record<string, React.CSSProperties> = {
  section: {
    padding: '28px 40px',
    borderBottom: '1px solid #F1F5F9',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 800,
    color: '#1E1B4B',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: '2px solid #EDE9FE',
  },
  sectionBody: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 1.75,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },
  subsection: { marginTop: 12 },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#334155',
    marginBottom: 8,
  },
};
