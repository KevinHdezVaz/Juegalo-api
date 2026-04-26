import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { isPayPalConfigured } from '../../lib/paypal';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function getCashoutRequests() {
  const { data } = await supabase
    .from('cashout_requests')
    .select(`*, users(username, email, coins)`)
    .order('created_at', { ascending: false })
    .limit(100);
  return data ?? [];
}

async function getStats() {
  const { data: users } = await supabase
    .from('users')
    .select('id', { count: 'exact' });

  const { data: pending } = await supabase
    .from('cashout_requests')
    .select('amount_usd')
    .eq('status', 'pending');

  const totalUsers        = users?.length ?? 0;
  const totalPending      = pending?.reduce((s, r) => s + Number(r.amount_usd), 0) ?? 0;
  const totalPendingCount = pending?.length ?? 0;

  return { totalUsers, totalPending, totalPendingCount };
}

const STATUS_COLORS: Record<string, React.CSSProperties> = {
  pending:    { background: '#FEF9C3', color: '#854D0E' },
  processing: { background: '#DBEAFE', color: '#1E40AF' },
  paid:       { background: '#DCFCE7', color: '#166534' },
  rejected:   { background: '#FEE2E2', color: '#991B1B' },
};

const STATUS_LABELS: Record<string, string> = {
  pending:    'Pendiente',
  processing: 'Procesando',
  paid:       'Pagado',
  rejected:   'Rechazado',
};

const METHOD_ICONS: Record<string, string> = {
  paypal:      '🅿️',
  mercadopago: '🔵',
  oxxo:        '🏪',
  giftcard:    '🎁',
  gift_card:   '🎁',
};

export const revalidate = 0;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const [requests, stats, sp] = await Promise.all([
    getCashoutRequests(),
    getStats(),
    searchParams,
  ]);

  const paypalActive = isPayPalConfigured();
  const successMsg   = sp.success;
  const errorMsg     = sp.error;

  return (
    <html lang="es">
      <head>
        <title>Admin — JUEGALO</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, 'Inter', sans-serif; background: #F8FAFC; color: #0F172A; }
          .nav { background: #fff; border-bottom: 1px solid #E2E8F0; padding: 16px 32px; display: flex; align-items: center; gap: 12px; }
          .logo { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg,#2563EB,#1D4ED8); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 900; font-size: 15px; }
          .nav-title { font-weight: 800; font-size: 18px; }
          .nav-sub { font-size: 13px; color: #64748B; margin-left: auto; }
          .main { padding: 32px; max-width: 1200px; margin: 0 auto; }
          .alert { padding: 14px 20px; border-radius: 12px; margin-bottom: 24px; font-weight: 600; font-size: 14px; }
          .alert-success { background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }
          .alert-error   { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
          .paypal-badge { background: #003087; color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; margin-left: 8px; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
          .stat-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 16px; padding: 24px; }
          .stat-value { font-size: 32px; font-weight: 900; letter-spacing: -1px; }
          .stat-label { font-size: 13px; color: #64748B; margin-top: 4px; }
          .section-title { font-size: 18px; font-weight: 800; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
          .table-wrap { background: #fff; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #F8FAFC; padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #E2E8F0; }
          td { padding: 14px 16px; border-bottom: 1px solid #F1F5F9; font-size: 14px; vertical-align: middle; }
          tr:last-child td { border-bottom: none; }
          tr:hover td { background: #F8FAFC; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; }
          .amount { font-weight: 800; color: #16A34A; font-size: 15px; }
          .method { display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 13px; }
          .auto-tag { font-size: 10px; background: #003087; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 700; }
          .account { font-family: monospace; font-size: 12px; color: #475569; }
          .notes { font-size: 11px; color: #94A3B8; margin-top: 2px; }
          .user-name { font-weight: 700; }
          .user-email { font-size: 12px; color: #94A3B8; }
          .date { font-size: 12px; color: #94A3B8; }
          .actions { display: flex; gap: 8px; flex-wrap: wrap; }
          .btn { padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; border: none; cursor: pointer; text-decoration: none; display: inline-block; }
          .btn-green { background: #DCFCE7; color: #166534; }
          .btn-paypal { background: #003087; color: #fff; }
          .btn-red   { background: #FEE2E2; color: #991B1B; }
          .empty { padding: 48px; text-align: center; color: #94A3B8; }
          .pending-badge { background: #FEF3C7; color: #92400E; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
        `}</style>
      </head>
      <body>
        <nav className="nav">
          <div className="logo">J</div>
          <span className="nav-title">JUEGALO Admin</span>
          {paypalActive && (
            <span style={{ background: '#003087', color: '#fff', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
              🅿️ PayPal Auto-pago activo
            </span>
          )}
          <span className="nav-sub">Panel de administración</span>
        </nav>

        <main className="main">

          {/* Alertas de éxito/error */}
          {successMsg === 'paypal_enviado' && (
            <div className="alert alert-success">
              ✅ Pago enviado automáticamente por PayPal. El usuario recibirá el dinero en minutos.
            </div>
          )}
          {successMsg === 'mp_enviado' && (
            <div className="alert alert-success">
              ✅ Pago enviado automáticamente por MercadoPago.
            </div>
          )}
          {successMsg === 'aprobado' && (
            <div className="alert alert-success">
              ✅ Retiro aprobado. Recuerda enviar el pago manualmente al usuario.
            </div>
          )}
          {errorMsg === 'ya_procesado' && (
            <div className="alert alert-error">
              ⚠️ Este retiro ya fue procesado anteriormente.
            </div>
          )}
          {errorMsg && errorMsg !== 'ya_procesado' && (
            <div className="alert alert-error">
              ❌ Error al procesar el pago: {decodeURIComponent(errorMsg)}
            </div>
          )}

          {/* Stats */}
          <div className="stats">
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#2563EB' }}>{stats.totalUsers}</div>
              <div className="stat-label">Usuarios registrados</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#DC2626' }}>
                {stats.totalPendingCount}
              </div>
              <div className="stat-label">
                Retiros pendientes
                {stats.totalPendingCount > 0 && (
                  <span className="pending-badge" style={{ marginLeft: 8 }}>!</span>
                )}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#16A34A' }}>${stats.totalPending.toFixed(2)}</div>
              <div className="stat-label">USD pendiente por pagar</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: paypalActive ? '#003087' : '#94A3B8' }}>
                {paypalActive ? 'ON' : 'OFF'}
              </div>
              <div className="stat-label">PayPal Auto-pago</div>
            </div>
          </div>

          {/* Tabla de retiros */}
          <div className="section-title">
            Solicitudes de retiro
            {stats.totalPendingCount > 0 && (
              <span className="pending-badge">{stats.totalPendingCount} pendientes</span>
            )}
          </div>

          <div className="table-wrap">
            {requests.length === 0 ? (
              <div className="empty">No hay solicitudes de retiro aún</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Monto</th>
                    <th>Método</th>
                    <th>Cuenta destino</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r: any) => {
                    const isPayPal = r.method === 'paypal';
                    return (
                      <tr key={r.id}>
                        <td>
                          <div className="user-name">{r.users?.username ?? '—'}</div>
                          <div className="user-email">{r.users?.email ?? r.users?.id?.substring(0, 8) ?? '—'}</div>
                        </td>
                        <td>
                          <span className="amount">${Number(r.amount_usd).toFixed(2)}</span>
                          <div style={{ fontSize: 11, color: '#94A3B8' }}>
                            {r.coins?.toLocaleString() ?? '—'} monedas
                          </div>
                        </td>
                        <td>
                          <div className="method">
                            {METHOD_ICONS[r.method] ?? '💰'} {r.method}
                            {isPayPal && paypalActive && (
                              <span className="auto-tag">AUTO</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="account">{r.payment_detail ?? r.account ?? '—'}</div>
                          {r.notes && (
                            <div className="notes">{r.notes}</div>
                          )}
                        </td>
                        <td>
                          <span className="badge" style={STATUS_COLORS[r.status] ?? {}}>
                            {STATUS_LABELS[r.status] ?? r.status}
                          </span>
                        </td>
                        <td>
                          <span className="date">
                            {new Date(r.created_at).toLocaleDateString('es-MX', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </span>
                        </td>
                        <td>
                          <div className="actions">
                            {r.status === 'pending' && (
                              <>
                                <a
                                  className={isPayPal && paypalActive ? 'btn btn-paypal' : 'btn btn-green'}
                                  href={`/admin/cashout/${r.id}/approve`}
                                >
                                  {isPayPal && paypalActive ? '🅿️ Pagar con PayPal' : '✓ Marcar pagado'}
                                </a>
                                <a className="btn btn-red" href={`/admin/cashout/${r.id}/reject`}>
                                  ✗ Rechazar
                                </a>
                              </>
                            )}
                            {r.status === 'processing' && (
                              <a className="btn btn-green" href={`/admin/cashout/${r.id}/approve`}>
                                ✓ Confirmar pago
                              </a>
                            )}
                            {(r.status === 'paid' || r.status === 'rejected') && (
                              <span style={{ color: '#CBD5E1', fontSize: 12 }}>—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}
