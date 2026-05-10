export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <html lang="es">
      <head>
        <title>Admin — JUEGALO</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Inter', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0F1B3D 0%, #1A2F6B 50%, #0F1B3D 100%);
            padding: 24px;
          }

          .card {
            width: 100%;
            max-width: 400px;
            background: rgba(255,255,255,0.06);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 24px;
            padding: 40px 36px;
            backdrop-filter: blur(12px);
            box-shadow: 0 24px 64px rgba(0,0,0,0.4);
          }

          .logo-wrap {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            margin-bottom: 32px;
          }
          .logo-icon {
            width: 64px; height: 64px;
            border-radius: 18px;
            background: linear-gradient(135deg, #6366F1, #4F46E5);
            display: flex; align-items: center; justify-content: center;
            font-size: 28px; font-weight: 900; color: #fff;
            box-shadow: 0 8px 24px rgba(99,102,241,0.45);
          }
          .logo-title {
            font-size: 22px; font-weight: 800;
            color: #fff; letter-spacing: 0.5px;
          }
          .logo-sub {
            font-size: 13px; color: rgba(255,255,255,0.5);
            margin-top: -8px;
          }

          .error-box {
            background: rgba(239,68,68,0.15);
            border: 1px solid rgba(239,68,68,0.3);
            border-radius: 10px;
            padding: 10px 14px;
            font-size: 13px;
            color: #FCA5A5;
            margin-bottom: 20px;
            text-align: center;
          }

          label {
            display: block;
            font-size: 12px; font-weight: 600;
            color: rgba(255,255,255,0.6);
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            text-transform: uppercase;
          }
          input[type="text"], input[type="password"] {
            width: 100%;
            padding: 12px 16px;
            background: rgba(255,255,255,0.07);
            border: 1px solid rgba(255,255,255,0.14);
            border-radius: 12px;
            color: #fff;
            font-size: 15px;
            font-family: inherit;
            outline: none;
            transition: border-color .2s, box-shadow .2s;
            margin-bottom: 18px;
          }
          input:focus {
            border-color: rgba(99,102,241,0.7);
            box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
          }
          input::placeholder { color: rgba(255,255,255,0.25); }

          .submit-btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #6366F1, #4F46E5);
            color: #fff;
            font-size: 15px; font-weight: 700;
            font-family: inherit;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: opacity .2s, transform .1s;
            box-shadow: 0 4px 16px rgba(99,102,241,0.4);
            margin-top: 4px;
          }
          .submit-btn:hover  { opacity: 0.92; }
          .submit-btn:active { transform: scale(0.98); }

          .footer-note {
            text-align: center;
            margin-top: 24px;
            font-size: 11px;
            color: rgba(255,255,255,0.25);
          }
        `}</style>
      </head>
      <body>
        <div className="card">
          <div className="logo-wrap">
            <div className="logo-icon">J</div>
            <div className="logo-title">JUEGALO Admin</div>
            <div className="logo-sub">Panel de administración</div>
          </div>

          {error && <div className="error-box">⚠️ {decodeURIComponent(error)}</div>}

          <form method="POST" action="/admin/auth">
            <input type="hidden" name="action" value="login" />

            <label>Usuario</label>
            <input
              type="text"
              name="username"
              placeholder="admin"
              autoComplete="username"
              autoFocus
              required
            />

            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />

            <button type="submit" className="submit-btn">
              Iniciar sesión →
            </button>
          </form>

          <div className="footer-note">
            Configura ADMIN_USERNAME y ADMIN_PASSWORD en Vercel
          </div>
        </div>
      </body>
    </html>
  );
}
