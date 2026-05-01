import React from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const MIN_CASHOUT_COINS = 10_000;
const NEAR_CASHOUT_PCT  = 0.70;

async function getCashoutRequests() {
  const { data } = await supabase
    .from('cashout_requests')
    .select(`*, users(username, email, coins)`)
    .order('created_at', { ascending: false })
    .limit(200);
  return data ?? [];
}

async function getStats() {
  const [
    { count: totalUsers },
    { data: pending },
    { data: paid },
    { data: rejected },
    { data: nearCashout },
    { data: readyCashout },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('cashout_requests').select('amount_usd').eq('status', 'pending'),
    supabase.from('cashout_requests').select('amount_usd').eq('status', 'paid'),
    supabase.from('cashout_requests').select('id').eq('status', 'rejected'),
    supabase.from('users').select('id').gte('coins', Math.floor(MIN_CASHOUT_COINS * NEAR_CASHOUT_PCT)).lt('coins', MIN_CASHOUT_COINS),
    supabase.from('users').select('id').gte('coins', MIN_CASHOUT_COINS),
  ]);

  return {
    totalUsers:    totalUsers ?? 0,
    pendingCount:  pending?.length ?? 0,
    pendingUsd:    pending?.reduce((s, r) => s + Number(r.amount_usd), 0) ?? 0,
    paidUsd:       paid?.reduce((s, r) => s + Number(r.amount_usd), 0) ?? 0,
    paidCount:     paid?.length ?? 0,
    rejectedCount: rejected?.length ?? 0,
    nearCashout:   nearCashout?.length ?? 0,
    readyCashout:  readyCashout?.length ?? 0,
  };
}

const METHOD_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  paypal:      { label: 'PayPal',      color: '#003087', bg: '#EEF2FF', border: '#C7D2FE' },
  mercadopago: { label: 'MercadoPago', color: '#0070BA', bg: '#E0F2FE', border: '#BAE6FD' },
  oxxo:        { label: 'OXXO',        color: '#CC0000', bg: '#FFF1F2', border: '#FECDD3' },
  giftcard:    { label: 'Gift Card',   color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' },
  gift_card:   { label: 'Gift Card',   color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:    { label: 'Pendiente',  color: '#92400E', bg: '#FEF3C7', dot: '#F59E0B' },
  processing: { label: 'Revisando',  color: '#1E40AF', bg: '#DBEAFE', dot: '#3B82F6' },
  paid:       { label: 'Pagado',     color: '#065F46', bg: '#D1FAE5', dot: '#10B981' },
  rejected:   { label: 'Rechazado',  color: '#991B1B', bg: '#FEE2E2', dot: '#EF4444' },
};

export const revalidate = 0;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; tab?: string }>;
}) {
  const [requests, stats, sp] = await Promise.all([
    getCashoutRequests(),
    getStats(),
    searchParams,
  ]);

  const successMsg  = sp.success;
  const errorMsg    = sp.error;
  const activeTab   = sp.tab ?? 'retiros';
  const pending     = requests.filter((r: any) => r.status === 'pending' || r.status === 'processing');

  return (
    <html lang="es">
      <head>
        <title>Admin — JUEGALO</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', sans-serif; background: #F1F5F9; color: #0F172A; min-height: 100vh; }

          /* NAV */
          .nav { background:#fff; border-bottom:1px solid #E2E8F0; padding:0 32px; height:60px; display:flex; align-items:center; gap:14px; position:sticky; top:0; z-index:100; box-shadow:0 1px 3px rgba(0,0,0,.06); }
          .logo { width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg,#6366F1,#4F46E5); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:900; font-size:16px; }
          .nav-title { font-weight:800; font-size:17px; color:#0F172A; }
          .nav-right { margin-left:auto; display:flex; align-items:center; gap:12px; }
          .nav-dot { width:8px; height:8px; border-radius:50%; background:#10B981; box-shadow:0 0 6px #10B981; }
          .nav-status { font-size:12px; color:#64748B; font-weight:500; }
          .refresh-btn { padding:6px 14px; border-radius:8px; background:#F8FAFC; border:1px solid #E2E8F0; color:#475569; font-size:12px; font-weight:600; text-decoration:none; }

          /* MAIN */
          .main { padding:24px 32px 56px; max-width:1280px; margin:0 auto; }

          /* ALERT */
          .alert { padding:13px 18px; border-radius:12px; margin-bottom:20px; font-size:13.5px; font-weight:600; border:1px solid transparent; }
          .alert-success { background:#F0FDF4; color:#166534; border-color:#BBF7D0; }
          .alert-error   { background:#FFF1F2; color:#991B1B; border-color:#FECDD3; }
          .alert-info    { background:#EFF6FF; color:#1E40AF; border-color:#BFDBFE; }

          /* STATS */
          .stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:14px; }
          .stat-card { background:#fff; border:1px solid #E2E8F0; border-radius:16px; padding:18px 20px; position:relative; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,.04); }
          .stat-card::after { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:16px 16px 0 0; }
          .stat-card.indigo::after { background:linear-gradient(90deg,#6366F1,#818CF8); }
          .stat-card.amber::after  { background:linear-gradient(90deg,#F59E0B,#FCD34D); }
          .stat-card.green::after  { background:linear-gradient(90deg,#10B981,#34D399); }
          .stat-card.red::after    { background:linear-gradient(90deg,#EF4444,#F87171); }
          .stat-card.violet::after { background:linear-gradient(90deg,#8B5CF6,#A78BFA); }
          .stat-card.sky::after    { background:linear-gradient(90deg,#0EA5E9,#38BDF8); }
          .stat-top { display:flex; align-items:flex-start; justify-content:space-between; }
          .stat-icon { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; }
          .stat-icon.indigo { background:#EEF2FF; } .stat-icon.amber { background:#FFFBEB; }
          .stat-icon.green  { background:#ECFDF5; } .stat-icon.red   { background:#FFF1F2; }
          .stat-icon.violet { background:#F5F3FF; } .stat-icon.sky   { background:#F0F9FF; }
          .stat-value { font-size:28px; font-weight:900; letter-spacing:-1px; line-height:1; color:#0F172A; margin-top:10px; }
          .stat-label { font-size:12px; color:#64748B; margin-top:4px; font-weight:500; }
          .stat-sub   { font-size:11px; color:#94A3B8; margin-top:2px; }

          /* TABS */
          .tabs-bar { display:flex; gap:4px; background:#fff; border:1px solid #E2E8F0; border-radius:14px; padding:5px; margin-bottom:24px; box-shadow:0 1px 3px rgba(0,0,0,.04); }
          .tab-btn {
            flex:1; padding:10px 16px; border-radius:10px;
            font-size:13px; font-weight:700; font-family:inherit;
            background:transparent; color:#64748B; display:flex; align-items:center; justify-content:center; gap:7px;
            transition:all .18s; text-decoration:none;
          }
          .tab-btn:hover { background:#F8FAFC; color:#0F172A; }
          .tab-btn.active { background:linear-gradient(135deg,#6366F1,#4F46E5); color:#fff; box-shadow:0 2px 8px rgba(99,102,241,.35); }
          .tab-badge { background:rgba(255,255,255,.25); color:#fff; font-size:10px; font-weight:800; padding:1px 6px; border-radius:999px; }
          .tab-btn:not(.active) .tab-badge { background:#FEF3C7; color:#92400E; }

          /* TABLE */
          .table-wrap { background:#fff; border:1px solid #E2E8F0; border-radius:16px; overflow:hidden; margin-bottom:24px; box-shadow:0 1px 3px rgba(0,0,0,.04); }
          table { width:100%; border-collapse:collapse; }
          thead { background:#F8FAFC; }
          th { padding:11px 16px; text-align:left; font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:.6px; border-bottom:1px solid #E2E8F0; }
          td { padding:13px 16px; border-bottom:1px solid #F1F5F9; font-size:13.5px; vertical-align:middle; }
          tr:last-child td { border-bottom:none; }
          tr:hover td { background:#FAFBFC; }

          .section-header { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
          .section-title  { font-size:15px; font-weight:800; color:#0F172A; }
          .count-pill { padding:2px 10px; border-radius:999px; font-size:11px; font-weight:700; }
          .count-pill.amber { background:#FEF3C7; color:#92400E; }
          .count-pill.slate { background:#F1F5F9; color:#475569; border:1px solid #E2E8F0; }

          .user-cell { display:flex; align-items:center; gap:10px; }
          .user-avatar { width:32px; height:32px; border-radius:50%; flex-shrink:0; background:linear-gradient(135deg,#6366F1,#8B5CF6); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; color:#fff; }
          .user-name  { font-weight:700; color:#0F172A; font-size:13px; }
          .user-email { font-size:11px; color:#94A3B8; margin-top:1px; }

          .amount-usd   { font-weight:800; color:#059669; font-size:15px; }
          .amount-coins { font-size:11px; color:#94A3B8; margin-top:2px; }

          .method-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:8px; font-size:12px; font-weight:700; border:1px solid transparent; }
          .method-dot   { width:5px; height:5px; border-radius:50%; }

          .account-text { font-family:monospace; font-size:12px; color:#334155; background:#F8FAFC; padding:3px 8px; border-radius:6px; border:1px solid #E2E8F0; display:inline-block; word-break:break-all; }
          .notes-text { font-size:11.5px; color:#64748B; margin-top:5px; line-height:1.5; word-break:break-word; white-space:pre-wrap; background:#FFF8F0; border:1px solid #FED7AA; padding:5px 8px; border-radius:6px; }
          .notes-text.error { background:#FFF1F2; border-color:#FECDD3; color:#991B1B; }

          .status-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:700; }
          .status-dot   { width:5px; height:5px; border-radius:50%; flex-shrink:0; }

          .date-main { font-size:12.5px; color:#334155; font-weight:500; }
          .date-time  { font-size:11px; color:#94A3B8; margin-top:2px; }

          .actions { display:flex; gap:6px; flex-wrap:wrap; }
          .btn { padding:6px 12px; border-radius:8px; font-size:12px; font-weight:700; border:1px solid transparent; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; gap:4px; transition:filter .15s,transform .1s; }
          .btn:hover  { filter:brightness(.93); transform:translateY(-1px); }
          .btn:active { transform:translateY(0); }
          .btn-approve { background:#D1FAE5; color:#065F46; border-color:#A7F3D0; }
          .btn-review  { background:#DBEAFE; color:#1E40AF; border-color:#BFDBFE; }
          .btn-reject  { background:#FEE2E2; color:#991B1B; border-color:#FECACA; }

          .empty { padding:56px; text-align:center; }
          .empty-icon { font-size:36px; margin-bottom:10px; }
          .empty-text { font-size:14px; font-weight:600; color:#475569; }
          .empty-sub  { font-size:12px; color:#94A3B8; margin-top:4px; }

          /* PENDING highlight */
          .pending-wrap .table-wrap { border-color:#FDE68A; box-shadow:0 0 0 3px #FEF3C733; }
          .pending-wrap thead { background:#FFFBEB; }
          .pending-wrap th { color:#92400E; border-bottom-color:#FDE68A; }

          /* NOTIFY */
          .notify-card { background:#fff; border:1px solid #E2E8F0; border-radius:16px; padding:24px; margin-bottom:20px; box-shadow:0 1px 3px rgba(0,0,0,.04); }
          .notify-card-title { font-size:14px; font-weight:800; color:#0F172A; margin-bottom:4px; }
          .notify-card-sub   { font-size:12px; color:#64748B; margin-bottom:16px; }

          .presets-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:10px; }
          .preset-btn {
            padding:12px 14px; border-radius:12px; border:1.5px solid #E2E8F0;
            background:#F8FAFC; color:#334155; cursor:pointer; font-family:inherit;
            font-size:13px; font-weight:700; text-align:left;
            display:flex; flex-direction:column; gap:4px;
            transition:all .18s;
          }
          .preset-btn:hover { border-color:#6366F1; background:#EEF2FF; color:#4338CA; transform:translateY(-2px); box-shadow:0 4px 12px rgba(99,102,241,.15); }
          .preset-btn.active { border-color:#6366F1; background:#EEF2FF; color:#4338CA; }
          .preset-emoji { font-size:20px; }
          .preset-name  { font-size:12px; font-weight:700; color:inherit; }
          .preset-desc  { font-size:10.5px; color:#94A3B8; font-weight:500; }

          .form-group { display:flex; flex-direction:column; gap:8px; margin-bottom:14px; }
          .form-label { font-size:12px; font-weight:700; color:#475569; }
          .form-row   { display:flex; gap:10px; }
          .form-input, .form-textarea, .form-select {
            flex:1; padding:10px 13px; border-radius:10px; border:1.5px solid #E2E8F0;
            font-size:13px; font-family:inherit; background:#F8FAFC; color:#0F172A;
            outline:none; transition:border .15s, background .15s;
          }
          .form-input:focus, .form-textarea:focus, .form-select:focus { border-color:#6366F1; background:#fff; }
          .form-textarea { resize:vertical; min-height:80px; }

          .send-btn { padding:11px 26px; background:linear-gradient(135deg,#6366F1,#4F46E5); color:#fff; border:none; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; transition:opacity .15s,transform .1s; }
          .send-btn:hover { opacity:.88; transform:translateY(-1px); }
          .send-btn:active { transform:translateY(0); }

          .notify-result { font-size:12px; font-weight:600; padding:9px 13px; border-radius:8px; margin-top:12px; display:none; }
          .notify-result.ok  { display:block; background:#F0FDF4; color:#166534; border:1px solid #BBF7D0; }
          .notify-result.err { display:block; background:#FFF1F2; color:#991B1B; border:1px solid #FECDD3; }
          .notify-result.loading { display:block; background:#F8FAFC; color:#475569; border:1px solid #E2E8F0; }

          .divider { border:none; border-top:1.5px solid #F1F5F9; margin:20px 0; }
        `}</style>
      </head>
      <body>

        {/* NAV */}
        <nav className="nav">
          <div className="logo">J</div>
          <span className="nav-title">JUEGALO Admin</span>
          <div className="nav-right">
            <div className="nav-dot" />
            <span className="nav-status">En línea</span>
            <a className="refresh-btn" href="/admin">↻ Actualizar</a>
          </div>
        </nav>

        <main className="main">

          {/* ALERTS */}
          {successMsg === 'aprobado'    && <div className="alert alert-success">✅ Marcado como pagado. Recuerda enviar el dinero manualmente por PayPal.</div>}
          {successMsg === 'en_revision' && <div className="alert alert-info">🔍 Solicitud en revisión. El usuario ya lo puede ver en la app.</div>}
          {successMsg === 'rechazado'   && <div className="alert alert-error">🚫 Retiro rechazado. Monedas devueltas y usuario notificado.</div>}
          {errorMsg === 'ya_procesado'  && <div className="alert alert-error">⚠️ Este retiro ya fue procesado anteriormente.</div>}
          {errorMsg && errorMsg !== 'ya_procesado' && <div className="alert alert-error">❌ {decodeURIComponent(errorMsg)}</div>}

          {/* STATS */}
          <div className="stats-grid">
            <div className="stat-card indigo">
              <div className="stat-top"><div className="stat-icon indigo">👥</div></div>
              <div className="stat-value">{stats.totalUsers.toLocaleString()}</div>
              <div className="stat-label">Usuarios registrados</div>
            </div>
            <div className="stat-card amber">
              <div className="stat-top"><div className="stat-icon amber">⏳</div></div>
              <div className="stat-value">{stats.pendingCount}</div>
              <div className="stat-label">Retiros pendientes</div>
              <div className="stat-sub">${stats.pendingUsd.toFixed(2)} USD por pagar</div>
            </div>
            <div className="stat-card green">
              <div className="stat-top"><div className="stat-icon green">💸</div></div>
              <div className="stat-value">${stats.paidUsd.toFixed(2)}</div>
              <div className="stat-label">Total pagado</div>
              <div className="stat-sub">{stats.paidCount} retiros completados</div>
            </div>
          </div>
          <div className="stats-grid" style={{ marginBottom: 28 }}>
            <div className="stat-card red">
              <div className="stat-top"><div className="stat-icon red">🚫</div></div>
              <div className="stat-value">{stats.rejectedCount}</div>
              <div className="stat-label">Retiros rechazados</div>
            </div>
            <div className="stat-card sky">
              <div className="stat-top"><div className="stat-icon sky">✅</div></div>
              <div className="stat-value">{stats.readyCashout}</div>
              <div className="stat-label">Listos para cobrar</div>
              <div className="stat-sub">≥ 10,000 monedas ($1.00)</div>
            </div>
            <div className="stat-card violet">
              <div className="stat-top"><div className="stat-icon violet">🎯</div></div>
              <div className="stat-value">{stats.nearCashout}</div>
              <div className="stat-label">Cerca de cobrar</div>
              <div className="stat-sub">7,000–9,999 monedas (70–99%)</div>
            </div>
          </div>

          {/* TABS */}
          <div className="tabs-bar">
            <a href="/admin?tab=retiros" className={`tab-btn ${activeTab === 'retiros' ? 'active' : ''}`}>
              💳 Retiros
              {pending.length > 0 && <span className="tab-badge">{pending.length}</span>}
            </a>
            <a href="/admin?tab=notificaciones" className={`tab-btn ${activeTab === 'notificaciones' ? 'active' : ''}`}>
              🔔 Notificaciones
            </a>
          </div>

          {/* TAB: RETIROS */}
          {activeTab === 'retiros' && <div>

            {pending.length > 0 && (
              <div className="pending-wrap">
                <div className="section-header">
                  <span className="section-title">⚡ Requieren atención</span>
                  <span className="count-pill amber">{pending.length} pendiente{pending.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Usuario</th><th>Monto</th><th>Método</th><th>Cuenta destino</th><th>Fecha</th><th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((r: any) => {
                        const m = METHOD_CONFIG[r.method] ?? { label: r.method, color: '#475569', bg: '#F1F5F9', border: '#E2E8F0' };
                        const s = STATUS_CONFIG[r.status] ?? { label: r.status, color: '#475569', bg: '#F1F5F9', dot: '#94A3B8' };
                        const initials = (r.users?.username ?? 'U').substring(0, 2).toUpperCase();
                        return (
                          <tr key={r.id}>
                            <td>
                              <div className="user-cell">
                                <div className="user-avatar">{initials}</div>
                                <div>
                                  <div className="user-name">{r.users?.username ?? 'Jugador'}</div>
                                  <div className="user-email">{r.users?.email ?? '—'}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="amount-usd">${Number(r.amount_usd).toFixed(2)}</div>
                              <div className="amount-coins">{(r.coins ?? 0).toLocaleString()} monedas</div>
                            </td>
                            <td>
                              <span className="method-badge" style={{ background: m.bg, color: m.color, borderColor: m.border }}>
                                <span className="method-dot" style={{ background: m.color }} />{m.label}
                              </span>
                            </td>
                            <td><span className="account-text">{r.payment_detail ?? r.account ?? '—'}</span></td>
                            <td>
                              <div className="date-main">{new Date(r.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                              <div className="date-time">{new Date(r.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</div>
                              <div style={{ marginTop: 4 }}>
                                <span className="status-badge" style={{ background: s.bg, color: s.color }}>
                                  <span className="status-dot" style={{ background: s.dot }} />{s.label}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="actions">
                                {r.status === 'pending' && <a className="btn btn-review" href={`/admin/cashout/${r.id}/review`}>🔍 Revisar</a>}
                                <a className="btn btn-approve" href={`/admin/cashout/${r.id}/approve`}>✓ Pagado</a>
                                <a className="btn btn-reject"  href={`/admin/cashout/${r.id}/reject`}>✗ Rechazar</a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="section-header" style={{ marginTop: pending.length > 0 ? 8 : 0 }}>
              <span className="section-title">Historial completo</span>
              <span className="count-pill slate">{requests.length} total</span>
            </div>
            <div className="table-wrap">
              {requests.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">📭</div>
                  <div className="empty-text">Sin solicitudes aún</div>
                  <div className="empty-sub">Aquí aparecerán los retiros de los usuarios</div>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th><th>Monto</th><th>Método</th><th>Cuenta / Notas</th><th>Estado</th><th>Fecha</th><th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r: any) => {
                      const m = METHOD_CONFIG[r.method] ?? { label: r.method, color: '#475569', bg: '#F1F5F9', border: '#E2E8F0' };
                      const s = STATUS_CONFIG[r.status] ?? { label: r.status, color: '#475569', bg: '#F1F5F9', dot: '#94A3B8' };
                      const initials = (r.users?.username ?? 'U').substring(0, 2).toUpperCase();
                      const isError  = r.notes?.toLowerCase().includes('error') || r.notes?.toLowerCase().includes('failed');
                      return (
                        <tr key={r.id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar">{initials}</div>
                              <div>
                                <div className="user-name">{r.users?.username ?? 'Jugador'}</div>
                                <div className="user-email">{r.users?.email ?? '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="amount-usd">${Number(r.amount_usd).toFixed(2)}</div>
                            <div className="amount-coins">{(r.coins ?? 0).toLocaleString()} monedas</div>
                          </td>
                          <td>
                            <span className="method-badge" style={{ background: m.bg, color: m.color, borderColor: m.border }}>
                              <span className="method-dot" style={{ background: m.color }} />{m.label}
                            </span>
                          </td>
                          <td style={{ maxWidth: 260 }}>
                            <span className="account-text">{r.payment_detail ?? r.account ?? '—'}</span>
                            {r.notes && <div className={`notes-text${isError ? ' error' : ''}`}>{r.notes}</div>}
                          </td>
                          <td>
                            <span className="status-badge" style={{ background: s.bg, color: s.color }}>
                              <span className="status-dot" style={{ background: s.dot }} />{s.label}
                            </span>
                          </td>
                          <td>
                            <div className="date-main">{new Date(r.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div className="date-time">{new Date(r.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td>
                            <div className="actions">
                              {r.status === 'pending' && (
                                <>
                                  <a className="btn btn-review"  href={`/admin/cashout/${r.id}/review`}>🔍 Revisar</a>
                                  <a className="btn btn-approve" href={`/admin/cashout/${r.id}/approve`}>✓ Pagado</a>
                                  <a className="btn btn-reject"  href={`/admin/cashout/${r.id}/reject`}>✗ Rechazar</a>
                                </>
                              )}
                              {r.status === 'processing' && (
                                <>
                                  <a className="btn btn-approve" href={`/admin/cashout/${r.id}/approve`}>✓ Pagado</a>
                                  <a className="btn btn-reject"  href={`/admin/cashout/${r.id}/reject`}>✗ Rechazar</a>
                                </>
                              )}
                              {(r.status === 'paid' || r.status === 'rejected') && <span style={{ color: '#CBD5E1', fontSize: 14 }}>—</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* TAB: NOTIFICACIONES */}
          {activeTab === 'notificaciones' && <div>

            {/* Presets */}
            <div className="notify-card">
              <div className="notify-card-title">⚡ Envíos rápidos</div>
              <div className="notify-card-sub">Selecciona un preset para precargar el mensaje. Puedes editarlo antes de enviar.</div>
              <div className="presets-grid">
                <button className="preset-btn" {...{'onclick': "loadPreset('daily_bonus', this)"}}>
                  <span className="preset-emoji">🎁</span>
                  <span className="preset-name">Bono diario</span>
                  <span className="preset-desc">Sin reclamar hoy</span>
                </button>
                <button className="preset-btn" {...{'onclick': "loadPreset('new_games', this)"}}>
                  <span className="preset-emoji">🎮</span>
                  <span className="preset-name">Nuevas misiones</span>
                  <span className="preset-desc">Todos activos (30d)</span>
                </button>
                <button className="preset-btn" {...{'onclick': "loadPreset('surveys', this)"}}>
                  <span className="preset-emoji">📋</span>
                  <span className="preset-name">Hay encuestas</span>
                  <span className="preset-desc">Todos activos</span>
                </button>
                <button className="preset-btn" {...{'onclick': "loadPreset('streak', this)"}}>
                  <span className="preset-emoji">🔥</span>
                  <span className="preset-name">Cuida tu racha</span>
                  <span className="preset-desc">Todos activos</span>
                </button>
                <button className="preset-btn" {...{'onclick': "loadPreset('ranking', this)"}}>
                  <span className="preset-emoji">🏆</span>
                  <span className="preset-name">Ranking semanal</span>
                  <span className="preset-desc">Todos activos</span>
                </button>
              </div>
            </div>

            {/* Compose */}
            <div className="notify-card">
              <div className="notify-card-title">✏️ Componer notificación</div>
              <div className="notify-card-sub">Edita el mensaje y elige la audiencia antes de enviar.</div>

              <div className="form-group">
                <label className="form-label">Título</label>
                <input id="notif-title" className="form-input" placeholder="ej: 🎉 ¡Novedad en JUEGALO!" />
              </div>
              <div className="form-group">
                <label className="form-label">Mensaje</label>
                <textarea id="notif-body" className="form-textarea" placeholder="ej: Tenemos una sorpresa para ti. ¡Entra y descúbrela!" />
              </div>
              <div className="form-group">
                <label className="form-label">Audiencia</label>
                <select id="notif-audience" className="form-select" style={{ maxWidth: 280 }}>
                  <option value="all">Todos los activos (últimos 30 días)</option>
                  <option value="unclaimed_bonus">Solo los que no reclamaron bono hoy</option>
                </select>
              </div>

              <button className="send-btn" {...{'onclick': "sendCustom()"}}>📤 Enviar notificación</button>
              <div id="notify-result" className="notify-result" />
            </div>

          </div>

        </main>

        <script dangerouslySetInnerHTML={{ __html: `
          const PRESETS = {
            daily_bonus: {
              title:    '🎁 ¡Tu bono diario te espera!',
              body:     'Entra a JUEGALO y reclama tus monedas gratis de hoy.',
              audience: 'unclaimed_bonus',
            },
            new_games: {
              title:    '🎮 ¡Nuevas misiones disponibles!',
              body:     'Instala juegos y gana monedas extra hoy.',
              audience: 'all',
            },
            surveys: {
              title:    '📋 ¡Hay encuestas para ti!',
              body:     'Completa encuestas y gana hasta $0.60 USD cada una.',
              audience: 'all',
            },
            streak: {
              title:    '🔥 ¡No pierdas tu racha!',
              body:     'Entra hoy y mantén tu racha activa. ¡Hay bonos esperándote!',
              audience: 'all',
            },
            ranking: {
              title:    '🏆 ¡El ranking semanal reinicia pronto!',
              body:     'Gana más monedas antes del cierre y llévate el premio.',
              audience: 'all',
            },
          };

          function loadPreset(key, btn) {
            const p = PRESETS[key];
            if (!p) return;
            document.getElementById('notif-title').value    = p.title;
            document.getElementById('notif-body').value     = p.body;
            document.getElementById('notif-audience').value = p.audience;
            // Highlight active preset
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Clear previous result
            showResult('', '');
            // Scroll to compose
            document.getElementById('notif-title').scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          async function sendCustom() {
            const title    = document.getElementById('notif-title').value.trim();
            const message  = document.getElementById('notif-body').value.trim();
            const audience = document.getElementById('notif-audience').value;
            if (!title || !message) { showResult('err', '⚠️ Completa el título y el mensaje antes de enviar.'); return; }
            showResult('loading', '⏳ Enviando notificación…');
            try {
              const res  = await fetch('/admin/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, message, audience }),
              });
              const data = await res.json();
              if (res.ok) {
                showResult('ok', '✅ Enviada a ' + data.sent + ' de ' + data.total + ' dispositivos activos.');
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
              } else {
                showResult('err', '❌ Error: ' + (data.error ?? 'desconocido'));
              }
            } catch(e) { showResult('err', '❌ Error de red. Intenta de nuevo.'); }
          }

          function showResult(cls, msg) {
            const el = document.getElementById('notify-result');
            el.className = 'notify-result' + (cls ? ' ' + cls : '');
            el.textContent = msg;
          }

        `}} />

      </body>
    </html>
  );
}
