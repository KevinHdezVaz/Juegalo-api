import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { getAdMobReport } from '../../lib/admob';

const PRESETS: Record<string, { title: string; body: string; audience: string }> = {
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

async function getPaidByPeriod(days: number): Promise<number> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - (isNaN(days) ? 7 : days));
    const { data } = await supabase
      .from('cashout_requests')
      .select('amount_usd')
      .eq('status', 'paid')
      .gte('processed_at', since.toISOString());
    return data?.reduce((s: number, r: any) => s + Number(r.amount_usd ?? 0), 0) ?? 0;
  } catch {
    return 0;
  }
}

// Parsea "correo@paypal.com | MXN" → { account, currency }
function parseDetail(raw: string | null | undefined): { account: string; currency: string | null } {
  if (!raw) return { account: '—', currency: null };
  const parts = raw.split('|');
  if (parts.length >= 2) {
    return { account: parts[0].trim(), currency: parts[1].trim() };
  }
  return { account: raw.trim(), currency: null };
}

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', MXN: '🇲🇽', ARS: '🇦🇷', COP: '🇨🇴',
  BRL: '🇧🇷', PEN: '🇵🇪', CLP: '🇨🇱', EUR: '🇪🇺',
};

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
  searchParams: Promise<{ success?: string; error?: string; tab?: string; preset?: string; sent?: string; total?: string; username?: string; days?: string }>;
}) {
  const sp = await searchParams;
  const activeTab  = sp.tab ?? 'retiros';
  const admobDays  = Number(sp.days ?? 7);

  const [requests, stats, admob, paidPeriod] = await Promise.all([
    getCashoutRequests(),
    getStats(),
    getAdMobReport(admobDays),
    getPaidByPeriod(admobDays),
  ]);
  const successMsg  = sp.success ?? '';
  const errorMsg    = sp.error   ?? '';
  const activePreset = sp.preset ?? '';
  const sentCount   = sp.sent   ? Number(sp.sent)   : null;
  const totalCount  = sp.total  ? Number(sp.total)  : null;
  const pending     = requests.filter((r: any) => r.status === 'pending' || r.status === 'processing');

  // Rentabilidad AdMob (valores con guardia por si algo falla en runtime)
  const safeEarnings  = Number.isFinite(admob?.totalEarnings) ? admob.totalEarnings : 0;
  const safePaid      = Number.isFinite(paidPeriod) ? paidPeriod : 0;
  const netProfit     = safeEarnings - safePaid;
  const profitMargin  = safeEarnings > 0 ? (netProfit / safeEarnings) * 100 : (safePaid > 0 ? -100 : 0);
  const earningsPct   = safeEarnings + safePaid > 0
    ? (safeEarnings / (safeEarnings + safePaid)) * 100
    : 0;
  const isProfit      = netProfit >= 0;

  // Pre-fill compose form from selected preset (or last sent values)
  const presetData  = activePreset ? PRESETS[activePreset] : null;
  const formTitle   = presetData?.title    ?? '';
  const formBody    = presetData?.body     ?? '';
  const formAudience = presetData?.audience ?? 'all';

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

          /* ADMOB */
          .admob-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
          .admob-kpi  { background:#fff; border:1px solid #E2E8F0; border-radius:14px; padding:16px 18px; box-shadow:0 1px 3px rgba(0,0,0,.04); }
          .admob-kpi-label { font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:.5px; margin-bottom:6px; }
          .admob-kpi-value { font-size:26px; font-weight:900; color:#0F172A; letter-spacing:-1px; line-height:1; }
          .admob-kpi-sub   { font-size:11px; color:#94A3B8; margin-top:3px; }

          .admob-table-wrap { background:#fff; border:1px solid #E2E8F0; border-radius:16px; overflow:hidden; margin-bottom:24px; box-shadow:0 1px 3px rgba(0,0,0,.04); }
          .admob-bar-cell { display:flex; align-items:center; gap:8px; }
          .admob-bar { height:6px; border-radius:3px; background:linear-gradient(90deg,#6366F1,#818CF8); min-width:2px; }
          .admob-error { background:#FFF1F2; border:1px solid #FECDD3; border-radius:12px; padding:16px 20px; color:#991B1B; font-size:13px; font-weight:600; }
          .admob-days-select { display:flex; gap:6px; margin-bottom:16px; }
          .admob-days-btn { padding:6px 14px; border-radius:8px; border:1.5px solid #E2E8F0; background:#F8FAFC; color:#64748B; font-size:12px; font-weight:700; text-decoration:none; transition:all .15s; }
          .admob-days-btn:hover { border-color:#6366F1; color:#4338CA; background:#EEF2FF; }
          .admob-days-btn.active { border-color:#6366F1; background:#6366F1; color:#fff; }

          /* RENTABILIDAD */
          .profit-banner { border-radius:16px; padding:24px 28px; margin-bottom:20px; border:1px solid transparent; }
          .profit-banner.positive { background:linear-gradient(135deg,#F0FDF4,#DCFCE7); border-color:#86EFAC; }
          .profit-banner.negative { background:linear-gradient(135deg,#FFF1F2,#FEE2E2); border-color:#FCA5A5; }
          .profit-banner-top { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; }
          .profit-banner-title { font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; margin-bottom:4px; }
          .profit-banner-title.positive { color:#15803D; }
          .profit-banner-title.negative { color:#B91C1C; }
          .profit-banner-amount { font-size:38px; font-weight:900; letter-spacing:-2px; line-height:1; }
          .profit-banner-amount.positive { color:#166534; }
          .profit-banner-amount.negative { color:#991B1B; }
          .profit-banner-sub { font-size:12px; margin-top:4px; font-weight:500; }
          .profit-banner-sub.positive { color:#15803D; }
          .profit-banner-sub.negative { color:#B91C1C; }
          .profit-cols { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px; }
          .profit-col { background:#fff; border-radius:12px; padding:14px 16px; border:1px solid transparent; }
          .profit-col.earnings { border-color:#BBF7D0; }
          .profit-col.costs    { border-color:#FCA5A5; }
          .profit-col-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; margin-bottom:6px; }
          .profit-col-label.earnings { color:#15803D; }
          .profit-col-label.costs    { color:#B91C1C; }
          .profit-col-value { font-size:26px; font-weight:900; letter-spacing:-1px; }
          .profit-col-value.earnings { color:#166534; }
          .profit-col-value.costs    { color:#991B1B; }
          .profit-col-sub { font-size:11px; color:#94A3B8; margin-top:3px; }
          .profit-bar-wrap { margin-top:16px; }
          .profit-bar-label { display:flex; justify-content:space-between; font-size:11px; font-weight:600; margin-bottom:5px; }
          .profit-bar-track { height:12px; border-radius:6px; background:#FEE2E2; overflow:hidden; }
          .profit-bar-fill  { height:100%; border-radius:6px; background:linear-gradient(90deg,#10B981,#059669); transition:width .6s; }
          .profit-bar-labels { display:flex; justify-content:space-between; font-size:10px; color:#94A3B8; margin-top:4px; }
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
          {successMsg === 'enviado'     && <div className="alert alert-success">📤 Notificación enviada a {sentCount ?? '?'}{totalCount != null ? ` de ${totalCount}` : ''} dispositivos.</div>}
          {successMsg === 'prueba'      && <div className="alert alert-success">✅ Notificación de prueba enviada a <strong>{decodeURIComponent(sp.username ?? '')}</strong>.</div>}
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
            <a href="/admin?tab=admob" className={`tab-btn ${activeTab === 'admob' ? 'active' : ''}`}>
              📊 AdMob
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
                            <td>
                              {(() => { const { account, currency } = parseDetail(r.payment_detail ?? r.account); return (<>
                                <span className="account-text">{account}</span>
                                {currency && <div style={{ marginTop: 4 }}><span style={{ fontSize: 11, fontWeight: 700, background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', borderRadius: 6, padding: '2px 7px' }}>{CURRENCY_FLAGS[currency] ?? ''} {currency}</span></div>}
                              </>); })()}
                            </td>
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
                            {(() => { const { account, currency } = parseDetail(r.payment_detail ?? r.account); return (<>
                              <span className="account-text">{account}</span>
                              {currency && <div style={{ marginTop: 4 }}><span style={{ fontSize: 11, fontWeight: 700, background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', borderRadius: 6, padding: '2px 7px' }}>{CURRENCY_FLAGS[currency] ?? ''} {currency}</span></div>}
                            </>); })()}
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
          </div>}

          {/* TAB: ADMOB */}
          {activeTab === 'admob' && <div>

            {/* Selector de rango */}
            <div className="admob-days-select">
              {[7, 14, 30].map(d => (
                <a key={d} href={`/admin?tab=admob&days=${d}`} className={`admob-days-btn ${admobDays === d ? 'active' : ''}`}>
                  Últimos {d} días
                </a>
              ))}
            </div>

            {/* ── RENTABILIDAD ─────────────────────────────────── */}
            <div className={`profit-banner ${isProfit ? 'positive' : 'negative'}`}>
              <div className="profit-banner-top">
                <div>
                  <div className={`profit-banner-title ${isProfit ? 'positive' : 'negative'}`}>
                    {isProfit ? '📈 Ganancia neta' : '📉 Pérdida neta'} · últimos {admobDays} días
                  </div>
                  <div className={`profit-banner-amount ${isProfit ? 'positive' : 'negative'}`}>
                    {isProfit ? '+' : ''}{netProfit.toFixed(2)} <span style={{ fontSize: 18 }}>USD</span>
                  </div>
                  <div className={`profit-banner-sub ${isProfit ? 'positive' : 'negative'}`}>
                    Margen: {profitMargin.toFixed(1)}% · {isProfit ? 'La app está siendo rentable ✅' : 'Pagamos más de lo que ganamos ⚠️'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>Ratio ingresos / costos</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: -1 }}>
                    {safeEarnings.toFixed(2)} <span style={{ fontSize: 14, color: '#94A3B8' }}>vs</span> {safePaid.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>AdMob vs PayPal / MercadoPago</div>
                </div>
              </div>

              {/* Columnas */}
              <div className="profit-cols" style={{ marginTop: 16 }}>
                <div className="profit-col earnings">
                  <div className="profit-col-label earnings">💰 Ingresos AdMob</div>
                  <div className="profit-col-value earnings">${safeEarnings.toFixed(2)}</div>
                  <div className="profit-col-sub">{(admob?.totalImpressions ?? 0).toLocaleString()} impresiones · eCPM ${(admob?.avgEcpm ?? 0).toFixed(2)}</div>
                </div>
                <div className="profit-col costs">
                  <div className="profit-col-label costs">💸 Pagado a usuarios</div>
                  <div className="profit-col-value costs">${safePaid.toFixed(2)}</div>
                  <div className="profit-col-sub">Retiros completados en el período</div>
                </div>
              </div>

              {/* Barra visual */}
              <div className="profit-bar-wrap">
                <div className="profit-bar-label">
                  <span style={{ color: '#15803D', fontWeight: 700 }}>Ingresos (AdMob)</span>
                  <span style={{ color: '#B91C1C', fontWeight: 700 }}>Costos (Pagos)</span>
                </div>
                <div className="profit-bar-track">
                  <div className="profit-bar-fill" style={{ width: `${Math.min(earningsPct, 100).toFixed(1)}%` }} />
                </div>
                <div className="profit-bar-labels">
                  <span>{earningsPct.toFixed(0)}% ingresos</span>
                  <span>{(100 - earningsPct).toFixed(0)}% costos</span>
                </div>
              </div>
            </div>

            {admob.error ? (
              <div className="admob-error">
                ⚠️ No se pudo cargar AdMob: {admob.error}
                <div style={{ marginTop: 8, fontSize: 12, color: '#64748B', fontWeight: 400 }}>
                  Verifica que <code>ADMOB_SERVICE_ACCOUNT</code> y <code>ADMOB_PUBLISHER_ID</code> estén configuradas en Vercel,
                  y que la cuenta de servicio esté autorizada en AdMob Console → Configuración → Acceso a la API.
                </div>
              </div>
            ) : (
              <>
                {/* KPIs */}
                <div className="admob-kpis">
                  <div className="admob-kpi">
                    <div className="admob-kpi-label">💰 Ingresos estimados</div>
                    <div className="admob-kpi-value">${admob.totalEarnings.toFixed(2)}</div>
                    <div className="admob-kpi-sub">USD · últimos {admobDays} días</div>
                  </div>
                  <div className="admob-kpi">
                    <div className="admob-kpi-label">👁️ Impresiones</div>
                    <div className="admob-kpi-value">{admob.totalImpressions.toLocaleString()}</div>
                    <div className="admob-kpi-sub">últimos {admobDays} días</div>
                  </div>
                  <div className="admob-kpi">
                    <div className="admob-kpi-label">🖱️ Clics</div>
                    <div className="admob-kpi-value">{admob.totalClicks.toLocaleString()}</div>
                    <div className="admob-kpi-sub">CTR: {admob.totalImpressions > 0 ? ((admob.totalClicks / admob.totalImpressions) * 100).toFixed(2) : '0.00'}%</div>
                  </div>
                  <div className="admob-kpi">
                    <div className="admob-kpi-label">📈 eCPM promedio</div>
                    <div className="admob-kpi-value">${admob.avgEcpm.toFixed(2)}</div>
                    <div className="admob-kpi-sub">USD por 1,000 imp.</div>
                  </div>
                </div>

                {/* Tabla por día */}
                {admob.rows.length === 0 ? (
                  <div className="admob-error" style={{ background: '#F8FAFC', borderColor: '#E2E8F0', color: '#475569' }}>
                    📭 Sin datos para este rango. Puede tardar 24–48 h en aparecer.
                  </div>
                ) : (
                  <div className="admob-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Ingresos (USD)</th>
                          <th>Impresiones</th>
                          <th>Clics</th>
                          <th>eCPM</th>
                          <th>Barras</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const maxEarnings = Math.max(...admob.rows.map(r => r.earnings), 0.001);
                          return admob.rows.map(r => {
                            const y = r.date.substring(0, 4);
                            const m = r.date.substring(4, 6);
                            const d = r.date.substring(6, 8);
                            const barWidth = Math.round((r.earnings / maxEarnings) * 120);
                            return (
                              <tr key={r.date}>
                                <td><span className="date-main">{d}/{m}/{y}</span></td>
                                <td><span className="amount-usd">${r.earnings.toFixed(4)}</span></td>
                                <td>{r.impressions.toLocaleString()}</td>
                                <td>{r.clicks.toLocaleString()}</td>
                                <td>${r.ecpm.toFixed(2)}</td>
                                <td>
                                  <div className="admob-bar-cell">
                                    <div className="admob-bar" style={{ width: barWidth }} />
                                    <span style={{ fontSize: 11, color: '#94A3B8' }}>${r.earnings.toFixed(2)}</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: '#F8FAFC' }}>
                          <td style={{ fontWeight: 700, fontSize: 12, color: '#475569' }}>Total</td>
                          <td><span className="amount-usd">${admob.totalEarnings.toFixed(4)}</span></td>
                          <td style={{ fontWeight: 700 }}>{admob.totalImpressions.toLocaleString()}</td>
                          <td style={{ fontWeight: 700 }}>{admob.totalClicks.toLocaleString()}</td>
                          <td style={{ fontWeight: 700 }}>${admob.avgEcpm.toFixed(2)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>}

          {/* TAB: NOTIFICACIONES */}
          {activeTab === 'notificaciones' && <div>

            {/* Presets — cada uno es un link que navega a ?preset=X y recarga la página con el form pre-llenado */}
            <div className="notify-card">
              <div className="notify-card-title">⚡ Envíos rápidos</div>
              <div className="notify-card-sub">Toca un preset para cargar el mensaje en el formulario de abajo.</div>
              <div className="presets-grid">
                <a href="/admin?tab=notificaciones&preset=daily_bonus" className={`preset-btn${activePreset === 'daily_bonus' ? ' active' : ''}`}>
                  <span className="preset-emoji">🎁</span>
                  <span className="preset-name">Bono diario</span>
                  <span className="preset-desc">Sin reclamar hoy</span>
                </a>
                <a href="/admin?tab=notificaciones&preset=new_games" className={`preset-btn${activePreset === 'new_games' ? ' active' : ''}`}>
                  <span className="preset-emoji">🎮</span>
                  <span className="preset-name">Nuevas misiones</span>
                  <span className="preset-desc">Todos activos (30d)</span>
                </a>
                <a href="/admin?tab=notificaciones&preset=surveys" className={`preset-btn${activePreset === 'surveys' ? ' active' : ''}`}>
                  <span className="preset-emoji">📋</span>
                  <span className="preset-name">Hay encuestas</span>
                  <span className="preset-desc">Todos activos</span>
                </a>
                <a href="/admin?tab=notificaciones&preset=streak" className={`preset-btn${activePreset === 'streak' ? ' active' : ''}`}>
                  <span className="preset-emoji">🔥</span>
                  <span className="preset-name">Cuida tu racha</span>
                  <span className="preset-desc">Todos activos</span>
                </a>
                <a href="/admin?tab=notificaciones&preset=ranking" className={`preset-btn${activePreset === 'ranking' ? ' active' : ''}`}>
                  <span className="preset-emoji">🏆</span>
                  <span className="preset-name">Ranking semanal</span>
                  <span className="preset-desc">Todos activos</span>
                </a>
                <a href="/admin?tab=notificaciones&preset=prueba" className={`preset-btn${activePreset === 'prueba' ? ' active' : ''}`} style={{ borderColor: activePreset === 'prueba' ? '#F59E0B' : undefined, background: activePreset === 'prueba' ? '#FFFBEB' : undefined }}>
                  <span className="preset-emoji">🧪</span>
                  <span className="preset-name">Envío de prueba</span>
                  <span className="preset-desc">Por correo</span>
                </a>
              </div>
            </div>

            {/* Compose / Prueba — cambia según el preset activo */}
            <div className="notify-card" style={activePreset === 'prueba' ? { borderColor: '#FDE68A' } : {}}>
              {activePreset === 'prueba' ? (
                <>
                  <div className="notify-card-title">🧪 Envío de prueba</div>
                  <div className="notify-card-sub">Envía a un usuario específico por su correo. Úsalo para probar antes de hacer un envío masivo.</div>
                  <form method="POST" action="/admin/notify-user">
                    <div className="form-group">
                      <label className="form-label">Correo del usuario</label>
                      <input name="email" type="email" className="form-input" placeholder="usuario@ejemplo.com" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Título</label>
                      <input name="title" className="form-input" defaultValue="🧪 Prueba de notificación" required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mensaje</label>
                      <textarea name="message" className="form-textarea" defaultValue="Si ves esto, las notificaciones funcionan correctamente 🎉" required />
                    </div>
                    <button type="submit" className="send-btn" style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}>🧪 Enviar prueba</button>
                  </form>
                </>
              ) : (
                <>
                  <div className="notify-card-title">✏️ Componer notificación</div>
                  <div className="notify-card-sub">
                    {activePreset
                      ? `Preset cargado. Edita si quieres y luego envía.`
                      : 'Selecciona un envío rápido arriba o escribe tu propio mensaje.'}
                  </div>
                  <form method="POST" action="/admin/notify-form">
                    <div className="form-group">
                      <label className="form-label">Título</label>
                      <input name="title" className="form-input" placeholder="ej: 🎉 ¡Novedad en JUEGALO!" defaultValue={formTitle} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mensaje</label>
                      <textarea name="message" className="form-textarea" placeholder="ej: Tenemos una sorpresa para ti. ¡Entra y descúbrela!" defaultValue={formBody} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Audiencia</label>
                      <select name="audience" className="form-select" style={{ maxWidth: 280 }} defaultValue={formAudience}>
                        <option value="all">Todos los activos (últimos 30 días)</option>
                        <option value="unclaimed_bonus">Solo los que no reclamaron bono hoy</option>
                      </select>
                    </div>
                    <button type="submit" className="send-btn">📤 Enviar notificación</button>
                  </form>
                </>
              )}
            </div>

          </div>}

        </main>

      </body>
    </html>
  );
}
