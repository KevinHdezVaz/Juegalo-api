export const metadata = {
  title: 'MusicMeet — Conecta por la música',
  description:
    'Descubre personas que comparten tu pasión musical. Publica, conecta y vive la música en comunidad.',
};

export default function MusicMeetLanding() {
  return (
    <main style={s.main}>
      {/* ── HERO ── */}
      <section style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.badge}>🎵 Disponible en App Store</div>
          <h1 style={s.heroTitle}>
            Conecta con personas<br />que viven la música
          </h1>
          <p style={s.heroSub}>
            MusicMeet es la comunidad donde artistas, fans y amantes de la música
            se encuentran, comparten momentos y crean conexiones reales.
          </p>
          <div style={s.heroButtons}>
            <a
              href="https://apps.apple.com/app/musicmeet"
              style={{ ...s.btn, ...s.btnPrimary }}
            >
              <span>⬇</span> Descargar en App Store
            </a>
            <a href="#features" style={{ ...s.btn, ...s.btnOutline }}>
              Conoce más
            </a>
          </div>
        </div>
        <div style={s.heroArt}>
          <div style={s.phoneMock}>
            <div style={s.phoneScreen}>
              <div style={s.phonePost}>
                <div style={s.postAvatar} />
                <div style={s.postLines}>
                  <div style={{ ...s.postLine, width: '60%' }} />
                  <div style={{ ...s.postLine, width: '40%', opacity: 0.5 }} />
                </div>
              </div>
              <div style={s.phoneWave}>
                {[40, 70, 55, 80, 45, 65, 50, 75, 60, 85, 50, 70].map(
                  (h, i) => (
                    <div
                      key={i}
                      style={{ ...s.waveBar, height: h, opacity: 0.6 + (i % 3) * 0.15 }}
                    />
                  ),
                )}
              </div>
              <div style={s.phoneTags}>
                {['#Rock', '#Jazz', '#Pop', '#Indie'].map((t) => (
                  <span key={t} style={s.tag}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={s.section}>
        <div style={s.sectionInner}>
          <p style={s.sectionLabel}>¿Qué puedes hacer?</p>
          <h2 style={s.sectionTitle}>Todo en una sola app</h2>
          <div style={s.grid3}>
            {features.map((f) => (
              <div key={f.title} style={s.featureCard}>
                <div style={s.featureIcon}>{f.icon}</div>
                <h3 style={s.featureTitle}>{f.title}</h3>
                <p style={s.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ ...s.section, background: '#0F0F0F' }}>
        <div style={s.sectionInner}>
          <p style={{ ...s.sectionLabel, color: '#C084FC' }}>Fácil y rápido</p>
          <h2 style={{ ...s.sectionTitle, color: '#fff' }}>
            Tres pasos para conectar
          </h2>
          <div style={s.steps}>
            {steps.map((step, i) => (
              <div key={i} style={s.step}>
                <div style={s.stepNum}>{i + 1}</div>
                <div style={s.stepIcon}>{step.icon}</div>
                <h3 style={{ ...s.featureTitle, color: '#fff' }}>{step.title}</h3>
                <p style={{ ...s.featureDesc, color: '#9CA3AF' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={s.cta}>
        <div style={s.ctaInner}>
          <span style={s.ctaEmoji}>🎸</span>
          <h2 style={s.ctaTitle}>¿Listo para encontrar tu comunidad?</h2>
          <p style={s.ctaSub}>
            Únete a miles de músicos y fans que ya están conectando en MusicMeet.
          </p>
          <a
            href="https://apps.apple.com/app/musicmeet"
            style={{ ...s.btn, ...s.btnPrimary, fontSize: 18, padding: '16px 40px' }}
          >
            Descargar gratis
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <p style={s.footerText}>
          © {new Date().getFullYear()} MusicMeet · Todos los derechos reservados
        </p>
        <div style={s.footerLinks}>
          <a href="/musicmeet/soporte" style={s.footerLink}>
            Soporte
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

const features = [
  {
    icon: '🎵',
    title: 'Publica tu música',
    desc: 'Comparte clips, fotos y textos sobre lo que más te apasiona. Tu feed, tu música.',
  },
  {
    icon: '🔍',
    title: 'Descubre artistas',
    desc: 'Explora perfiles de músicos cerca de ti y alrededor del mundo.',
  },
  {
    icon: '💬',
    title: 'Chat en tiempo real',
    desc: 'Conecta directamente con artistas y fans que comparten tu gusto musical.',
  },
  {
    icon: '📍',
    title: 'Encuentra eventos',
    desc: 'Descubre conciertos, tocadas y jam sessions cerca de tu ubicación.',
  },
  {
    icon: '✅',
    title: 'Perfiles verificados',
    desc: 'Sistema de verificación de rostro para garantizar comunidad auténtica.',
  },
  {
    icon: '🎨',
    title: 'Personaliza tu perfil',
    desc: 'Muestra tus géneros favoritos, instrumentos y tu historia musical.',
  },
];

const steps = [
  {
    icon: '📲',
    title: 'Descarga la app',
    desc: 'Disponible gratis en el App Store para iPhone.',
  },
  {
    icon: '🎭',
    title: 'Crea tu perfil',
    desc: 'Elige tus géneros, sube tu foto y cuéntale al mundo tu pasión musical.',
  },
  {
    icon: '🤝',
    title: 'Conecta y disfruta',
    desc: 'Sigue artistas, comenta posts y encuentra tu comunidad musical.',
  },
];

// ── STYLES ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  main: {
    fontFamily: '-apple-system, "Inter", "Segoe UI", sans-serif',
    background: '#fff',
    color: '#0F172A',
    overflowX: 'hidden',
  },

  /* Hero */
  hero: {
    background: 'linear-gradient(135deg, #1a0533 0%, #0d1a3a 50%, #0a0f1e 100%)',
    minHeight: '90vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 24px',
    gap: 60,
    flexWrap: 'wrap',
  },
  heroInner: { flex: 1, minWidth: 280, maxWidth: 540 },
  badge: {
    display: 'inline-block',
    background: 'rgba(192,132,252,0.15)',
    color: '#C084FC',
    border: '1px solid rgba(192,132,252,0.3)',
    borderRadius: 100,
    padding: '6px 16px',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 'clamp(32px, 5vw, 56px)',
    fontWeight: 800,
    color: '#fff',
    lineHeight: 1.15,
    marginBottom: 20,
  },
  heroSub: {
    fontSize: 17,
    color: '#94A3B8',
    lineHeight: 1.7,
    marginBottom: 36,
  },
  heroButtons: { display: 'flex', gap: 12, flexWrap: 'wrap' },

  /* Phone mockup */
  heroArt: { flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  phoneMock: {
    width: 220,
    height: 420,
    background: '#1E1E2E',
    borderRadius: 36,
    border: '3px solid rgba(192,132,252,0.4)',
    boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
    overflow: 'hidden',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  phoneScreen: { display: 'flex', flexDirection: 'column', gap: 16 },
  phonePost: { display: 'flex', alignItems: 'center', gap: 10 },
  postAvatar: { width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#C084FC,#818CF8)', flexShrink: 0 },
  postLines: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
  postLine: { height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.15)' },
  phoneWave: { display: 'flex', alignItems: 'flex-end', gap: 4, height: 80, padding: '0 4px' },
  waveBar: {
    flex: 1,
    borderRadius: 3,
    background: 'linear-gradient(to top, #C084FC, #818CF8)',
  },
  phoneTags: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  tag: {
    background: 'rgba(192,132,252,0.2)',
    color: '#C084FC',
    borderRadius: 100,
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 600,
  },

  /* Buttons */
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '14px 28px',
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 700,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'opacity .2s',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #C084FC, #818CF8)',
    color: '#fff',
    border: 'none',
  },
  btnOutline: {
    background: 'transparent',
    color: '#C084FC',
    border: '2px solid rgba(192,132,252,0.4)',
  },

  /* Sections */
  section: { padding: '80px 24px', background: '#FAFAFA' },
  sectionInner: { maxWidth: 1080, margin: '0 auto' },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#7C3AED',
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  sectionTitle: {
    fontSize: 'clamp(26px, 4vw, 40px)',
    fontWeight: 800,
    textAlign: 'center' as const,
    marginBottom: 48,
  },

  /* Feature cards */
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 24,
  },
  featureCard: {
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 20,
    padding: 28,
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  featureIcon: { fontSize: 32, marginBottom: 16 },
  featureTitle: { fontSize: 17, fontWeight: 700, marginBottom: 8 },
  featureDesc: { fontSize: 14, color: '#64748B', lineHeight: 1.6 },

  /* Steps */
  steps: {
    display: 'flex',
    gap: 32,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  step: {
    flex: '1 1 240px',
    maxWidth: 300,
    textAlign: 'center' as const,
    padding: '0 12px',
  },
  stepNum: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #C084FC, #818CF8)',
    color: '#fff',
    fontSize: 20,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
  },
  stepIcon: { fontSize: 32, marginBottom: 12 },

  /* CTA */
  cta: {
    background: 'linear-gradient(135deg, #1a0533 0%, #0d1a3a 100%)',
    padding: '100px 24px',
    textAlign: 'center' as const,
  },
  ctaInner: { maxWidth: 600, margin: '0 auto' },
  ctaEmoji: { fontSize: 48, display: 'block', marginBottom: 20 },
  ctaTitle: { fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: '#fff', marginBottom: 16 },
  ctaSub: { fontSize: 16, color: '#94A3B8', lineHeight: 1.7, marginBottom: 36 },

  /* Footer */
  footer: {
    background: '#0A0A0A',
    padding: '32px 24px',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 12,
  },
  footerText: { color: '#4B5563', fontSize: 13 },
  footerLinks: { display: 'flex', gap: 12, alignItems: 'center' },
  footerLink: { color: '#9CA3AF', fontSize: 13, textDecoration: 'none' },
  footerDot: { color: '#4B5563', fontSize: 13 },
};
