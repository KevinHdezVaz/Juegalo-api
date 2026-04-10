export const metadata = {
  title: 'Política de Privacidad — JUEGALO',
  description: 'Política de privacidad de JUEGALO - Gana Dinero Real.',
};

const LAST_UPDATED = '5 de abril de 2025';
const APP_NAME     = 'JUEGALO - Gana Dinero Real';
const CONTACT      = 'soporte@juegalo.app';
const WEBSITE      = 'https://juegalo.app';

export default function Privacidad() {
  return (
    <main style={s.main}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          <span style={s.icon}>🎮</span>
          <h1 style={s.appName}>{APP_NAME}</h1>
          <h2 style={s.pageTitle}>Política de Privacidad</h2>
          <p style={s.updated}>Última actualización: {LAST_UPDATED}</p>
        </div>

        <Section title="1. Introducción">
          <p>
            Bienvenido a <strong>{APP_NAME}</strong> ("nosotros", "nuestra" o "la
            aplicación"). Nos comprometemos a proteger tu información personal. Esta
            Política de Privacidad explica qué datos recopilamos, cómo los usamos y
            cuáles son tus derechos.
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
              <li><strong>Nombre y foto de perfil</strong> — si inicias sesión con Google</li>
              <li><strong>Nombre de usuario</strong> — elegido durante el registro</li>
              <li><strong>Código de referido</strong> — si utilizas o compartes uno</li>
              <li><strong>Información de cobro</strong> — cuenta PayPal, MercadoPago u otro método al solicitar un retiro</li>
            </ul>
          </Subsection>
          <Subsection title="2.2 Información recopilada automáticamente">
            <ul>
              <li><strong>Identificador de dispositivo</strong> — para envío de notificaciones push</li>
              <li><strong>Datos de uso</strong> — encuestas completadas, videos vistos, ofertas realizadas, monedas ganadas</li>
              <li><strong>Dirección IP y país</strong> — para cumplimiento legal y detección de fraude</li>
              <li><strong>Datos de anuncios</strong> — Google Advertising ID (GAID) usado por redes de anuncios</li>
            </ul>
          </Subsection>
          <Subsection title="2.3 Información de terceros">
            <p>
              Cuando completas encuestas, ofertas o ves anuncios, las redes de terceros
              (CPX Research, AdGem, Google AdMob) pueden recopilar datos adicionales
              según sus propias políticas de privacidad.
            </p>
          </Subsection>
        </Section>

        <Section title="3. Cómo usamos tu información">
          <Table
            headers={['Finalidad', 'Base legal']}
            rows={[
              ['Crear y gestionar tu cuenta', 'Ejecución del contrato'],
              ['Acreditar monedas y procesar retiros', 'Ejecución del contrato'],
              ['Enviar notificaciones push (bonos, rachas)', 'Consentimiento'],
              ['Mostrar anuncios personalizados', 'Consentimiento / interés legítimo'],
              ['Detectar fraude y garantizar la seguridad', 'Interés legítimo'],
              ['Cumplir obligaciones legales y fiscales', 'Obligación legal'],
              ['Mejorar la aplicación mediante análisis de uso', 'Interés legítimo'],
              ['Sistema de referidos y ranking', 'Ejecución del contrato'],
            ]}
          />
        </Section>

        <Section title="4. Compartición de datos con terceros">
          <p>No vendemos tu información personal. Compartimos datos únicamente con:</p>
          <Table
            headers={['Tercero', 'Propósito']}
            rows={[
              ['Supabase', 'Base de datos y autenticación'],
              ['Google (Firebase / AdMob)', 'Notificaciones push y anuncios'],
              ['CPX Research', 'Red de encuestas remuneradas'],
              ['AdGem', 'Red de ofertas remuneradas'],
              ['PayPal / MercadoPago', 'Procesamiento de pagos (retiros)'],
              ['Vercel', 'Alojamiento del backend'],
            ]}
          />
          <p style={{ marginTop: 12 }}>
            Cada uno de estos terceros tiene sus propias políticas de privacidad y
            cumple con la normativa aplicable.
          </p>
        </Section>

        <Section title="5. Retención de datos">
          <Table
            headers={['Tipo de dato', 'Período de retención']}
            rows={[
              ['Datos de cuenta (email, username)', 'Hasta que elimines tu cuenta'],
              ['Saldo de monedas e historial de ganancias', 'Hasta que elimines tu cuenta'],
              ['Registros de transacciones y cobros', '90 días tras eliminar la cuenta (obligación legal)'],
              ['Datos de anuncios (GAID)', 'Según política del proveedor de anuncios'],
              ['Logs del servidor', '30 días'],
            ]}
          />
        </Section>

        <Section title="6. Seguridad">
          <p>
            Implementamos medidas técnicas y organizativas para proteger tu información:
          </p>
          <ul>
            <li>Cifrado en tránsito mediante HTTPS/TLS</li>
            <li>Contraseñas almacenadas con hash bcrypt</li>
            <li>Acceso a la base de datos restringido por Row Level Security (RLS)</li>
            <li>Autenticación mediante tokens JWT de corta duración</li>
            <li>Claves de servicio almacenadas como variables de entorno cifradas</li>
          </ul>
        </Section>

        <Section title="7. Tus derechos">
          <p>Dependiendo de tu jurisdicción, tienes derecho a:</p>
          <ul>
            <li><strong>Acceso</strong> — solicitar una copia de tus datos personales</li>
            <li><strong>Rectificación</strong> — corregir datos inexactos</li>
            <li><strong>Eliminación</strong> — solicitar el borrado de tu cuenta y datos</li>
            <li><strong>Portabilidad</strong> — recibir tus datos en formato legible</li>
            <li><strong>Oposición</strong> — oponerte al uso de tus datos para marketing</li>
            <li><strong>Revocación del consentimiento</strong> — para notificaciones push desde ajustes del dispositivo</li>
          </ul>
          <p>
            Para ejercer cualquiera de estos derechos, escríbenos a{' '}
            <a href={`mailto:${CONTACT}`} style={s.link}>{CONTACT}</a>.
            Respondemos en un plazo máximo de <strong>15 días hábiles</strong>.
          </p>
          <p>
            Para eliminar tu cuenta directamente desde la app, ve a{' '}
            <strong>Perfil → Eliminar mi cuenta</strong>, o visita{' '}
            <a href={`${WEBSITE}/eliminar-cuenta`} style={s.link}>
              {WEBSITE}/eliminar-cuenta
            </a>.
          </p>
        </Section>

        <Section title="8. Privacidad de menores">
          <p>
            JUEGALO no está dirigido a menores de <strong>18 años</strong>. No
            recopilamos conscientemente datos de menores. Si descubres que un menor
            ha creado una cuenta, contáctanos a{' '}
            <a href={`mailto:${CONTACT}`} style={s.link}>{CONTACT}</a> para
            eliminarla de inmediato.
          </p>
        </Section>

        <Section title="9. Notificaciones push">
          <p>
            Enviamos notificaciones push para informarte de bonos diarios, rachas,
            premios del ranking semanal y actualizaciones de tu cuenta. Puedes
            desactivarlas en cualquier momento desde los ajustes de tu dispositivo.
          </p>
        </Section>

        <Section title="10. Transferencias internacionales">
          <p>
            Tus datos pueden ser procesados en servidores ubicados fuera de tu país
            (principalmente en Estados Unidos), donde están alojados Supabase y
            Vercel. Estos proveedores cumplen con estándares internacionales de
            protección de datos.
          </p>
        </Section>

        <Section title="11. Cambios a esta política">
          <p>
            Podemos actualizar esta Política de Privacidad ocasionalmente. Te
            notificaremos mediante una notificación en la app o por correo electrónico
            si los cambios son significativos. La fecha de última actualización
            siempre estará visible al inicio de este documento.
          </p>
        </Section>

        <Section title="12. Contacto">
          <p>Si tienes preguntas sobre esta política, contáctanos:</p>
          <div style={s.contactBox}>
            <p style={s.contactLine}><strong>App:</strong> {APP_NAME}</p>
            <p style={s.contactLine}><strong>Email:</strong>{' '}
              <a href={`mailto:${CONTACT}`} style={s.link}>{CONTACT}</a>
            </p>
            <p style={s.contactLine}><strong>Web:</strong>{' '}
              <a href={WEBSITE} style={s.link}>{WEBSITE}</a>
            </p>
          </div>
        </Section>

        <p style={s.footer}>
          © 2025 {APP_NAME} · <a href="/eliminar-cuenta" style={s.link}>Eliminar cuenta</a>
        </p>
      </div>
    </main>
  );
}

// ── Componentes auxiliares ────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={s.section}>
      <h3 style={s.sectionTitle}>{title}</h3>
      <div style={s.sectionBody}>{children}</div>
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h4 style={s.subsectionTitle}>{title}</h4>
      {children}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table style={s.table}>
      <thead>
        <tr>
          {headers.map((h, i) => <th key={i} style={s.th}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} style={{ ...s.td, background: i % 2 === 0 ? '#fff' : '#fafbff' }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    background: '#f0f4ff',
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: '20px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '36px 32px',
    maxWidth: '760px',
    width: '100%',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  icon: { fontSize: '48px' },
  appName: {
    margin: '8px 0 4px',
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
  },
  pageTitle: {
    margin: '0 0 6px',
    fontSize: '28px',
    fontWeight: '700',
    color: '#2563eb',
  },
  updated: {
    margin: 0,
    fontSize: '13px',
    color: '#94a3b8',
  },
  section: {
    marginBottom: '28px',
    paddingBottom: '28px',
    borderBottom: '1px solid #f1f5f9',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 12px',
  },
  subsectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155',
    margin: '0 0 6px',
  },
  sectionBody: {
    fontSize: '14px',
    color: '#334155',
    lineHeight: '1.7',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    background: '#f1f5f9',
    color: '#475569',
    fontWeight: '600',
    padding: '10px 12px',
    textAlign: 'left',
    borderBottom: '2px solid #e2e8f0',
  },
  td: {
    padding: '10px 12px',
    color: '#334155',
    borderBottom: '1px solid #f1f5f9',
    verticalAlign: 'top',
  },
  contactBox: {
    background: '#f8faff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px 20px',
    marginTop: '8px',
  },
  contactLine: {
    margin: '4px 0',
    fontSize: '14px',
    color: '#334155',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '8px',
  },
};
