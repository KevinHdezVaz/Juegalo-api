export const metadata = {
  title: 'Eliminar cuenta — JUEGALO',
  description: 'Solicita la eliminación de tu cuenta y datos personales en JUEGALO - Gana Dinero Real.',
};

export default function EliminarCuenta() {
  return (
    <main style={styles.main}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconWrap}>
            <span style={styles.icon}>🎮</span>
          </div>
          <h1 style={styles.title}>JUEGALO</h1>
          <p style={styles.subtitle}>Gana Dinero Real</p>
        </div>

        <hr style={styles.divider} />

        <h2 style={styles.heading}>Eliminación de cuenta</h2>
        <p style={styles.body}>
          Si deseas eliminar tu cuenta y todos tus datos personales de JUEGALO,
          tienes dos opciones:
        </p>

        {/* Opción 1 — Desde la app */}
        <div style={styles.optionBox}>
          <h3 style={styles.optionTitle}>📱 Opción 1 — Desde la app</h3>
          <ol style={styles.list}>
            <li>Abre JUEGALO en tu dispositivo</li>
            <li>Ve a <strong>Perfil → Configuración</strong></li>
            <li>Toca <strong>"Eliminar mi cuenta"</strong></li>
            <li>Confirma la acción</li>
          </ol>
          <p style={styles.note}>
            Tu cuenta se eliminará de forma inmediata y permanente.
          </p>
        </div>

        {/* Opción 2 — Por correo */}
        <div style={styles.optionBox}>
          <h3 style={styles.optionTitle}>✉️ Opción 2 — Por correo electrónico</h3>
          <p style={styles.body}>
            Envía un correo a{' '}
            <a href="mailto:soporte@juegalo.app" style={styles.link}>
              soporte@juegalo.app
            </a>{' '}
            con el asunto <strong>"Eliminar cuenta"</strong> indicando el correo
            registrado en tu cuenta. Procesamos tu solicitud en un plazo máximo
            de <strong>7 días hábiles</strong>.
          </p>
        </div>

        <hr style={styles.divider} />

        {/* Qué datos se eliminan */}
        <h3 style={styles.heading}>¿Qué datos se eliminan?</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Dato</th>
              <th style={styles.th}>¿Se elimina?</th>
              <th style={styles.th}>Retención</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Correo electrónico', '✅ Sí', 'Inmediata'],
              ['Nombre de usuario', '✅ Sí', 'Inmediata'],
              ['Saldo de monedas', '✅ Sí', 'Inmediata'],
              ['Historial de ganancias', '✅ Sí', 'Inmediata'],
              ['Solicitudes de cobro pendientes', '⚠️ Conservado', '90 días (obligación legal)'],
              ['Registros de transacciones', '⚠️ Conservado', '90 días (obligación fiscal)'],
            ].map(([dato, estado, retencion], i) => (
              <tr key={i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                <td style={styles.td}>{dato}</td>
                <td style={styles.td}>{estado}</td>
                <td style={styles.td}>{retencion}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={styles.warning}>
          ⚠️ <strong>Esta acción es irreversible.</strong> Una vez eliminada tu
          cuenta, perderás tu saldo de monedas y no podrás recuperarlo.
        </p>

        <hr style={styles.divider} />

        <p style={styles.footer}>
          JUEGALO — Gana Dinero Real &nbsp;·&nbsp;{' '}
          <a href="mailto:soporte@juegalo.app" style={styles.link}>
            soporte@juegalo.app
          </a>
        </p>
      </div>
    </main>
  );
}

// ── Estilos inline (no requiere CSS externo) ─────────────────────────
const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    background: '#f0f4ff',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '40px 16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    background: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    padding: '36px 32px',
    maxWidth: '680px',
    width: '100%',
  },
  header: {
    textAlign: 'center',
    marginBottom: '8px',
  },
  iconWrap: {
    fontSize: '48px',
    marginBottom: '8px',
  },
  icon: {},
  title: {
    margin: '0',
    fontSize: '28px',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: '14px',
    color: '#64748b',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #e2e8f0',
    margin: '24px 0',
  },
  heading: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 12px',
  },
  body: {
    fontSize: '15px',
    color: '#334155',
    lineHeight: '1.6',
    margin: '0 0 16px',
  },
  optionBox: {
    background: '#f8faff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
  },
  optionTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 10px',
  },
  list: {
    margin: '0 0 10px',
    paddingLeft: '20px',
    fontSize: '15px',
    color: '#334155',
    lineHeight: '1.8',
  },
  note: {
    fontSize: '13px',
    color: '#64748b',
    margin: '8px 0 0',
    fontStyle: 'italic',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '600',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    marginBottom: '16px',
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
  },
  rowEven: {
    background: '#ffffff',
  },
  rowOdd: {
    background: '#fafbff',
  },
  warning: {
    background: '#fff7ed',
    border: '1px solid #fed7aa',
    borderRadius: '10px',
    padding: '14px 16px',
    fontSize: '14px',
    color: '#92400e',
    margin: '0 0 8px',
  },
  footer: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#94a3b8',
    margin: '0',
  },
};
