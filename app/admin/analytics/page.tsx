import React from 'react';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 0;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ── Colores por fuente ────────────────────────────────────────────────────────
const SOURCE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  video:       { label: 'Videos',        color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', emoji: '📹' },
  survey:         { label: 'Encuestas',     color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', emoji: '📋' },
  cpx_research:   { label: 'Encuestas CPX', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', emoji: '📋' },
  daily_bonus: { label: 'Bono diario',   color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', emoji: '🎁' },
  daily_goal:  { label: 'Meta diaria',   color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', emoji: '🎯' },
  referral:      { label: 'Referidos',      color: '#EF4444', bg: '#FFF1F2', border: '#FECDD3', emoji: '👥' },
  ranking_prize: { label: 'Premio ranking', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', emoji: '🏆' },
  game:          { label: 'Juegos',         color: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD', emoji: '🎮' },
  paypal:        { label: 'Retiro PayPal',  color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', emoji: '💸' },
  bonus:       { label: 'Bono',          color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8', emoji: '⭐' },
  cashout:     { label: 'Retiro',        color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', emoji: '💸' },
  other:       { label: 'Otro',          color: '#94A3B8', bg: '#F8FAFC', border: '#E2E8F0', emoji: '🔹' },
};

function getSource(source: string) {
  return SOURCE_CONFIG[source] ?? { ...SOURCE_CONFIG.other, label: source };
}

// ── Queries ───────────────────────────────────────────────────────────────────

async function getCoinsBySource(days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data } = await supabase
    .from('transactions')
    .select('source, coins')
    .gte('created_at', since.toISOString())
    .gt('coins', 0)
    .limit(50000);
  const map: Record<string, { coins: number; count: number }> = {};
  for (const row of data ?? []) {
    const s = row.source ?? 'other';
    if (!map[s]) map[s] = { coins: 0, count: 0 };
    map[s].coins += Number(row.coins ?? 0);
    map[s].count += 1;
  }
  return map;
}

async function getDailyBySource(days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data } = await supabase
    .from('transactions')
    .select('source, coins, created_at')
    .gte('created_at', since.toISOString())
    .gt('coins', 0)
    .order('created_at', { ascending: true })
    .limit(50000);

  // Agrupar por día y fuente
  const map: Record<string, Record<string, number>> = {};
  for (const row of data ?? []) {
    const day = (row.created_at as string).slice(0, 10);
    const src = row.source ?? 'other';
    if (!map[day]) map[day] = {};
    map[day][src] = (map[day][src] ?? 0) + Number(row.coins ?? 0);
  }
  // Llenar días vacíos
  const result: { day: string; sources: Record<string, number>; total: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const sources = map[key] ?? {};
    const total = Object.values(sources).reduce((a, b) => a + b, 0);
    result.push({ day: key, sources, total });
  }
  return result;
}

async function getTopEarners(days: number, limit = 10) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data } = await supabase
    .from('transactions')
    .select('user_id, coins, source')
    .gte('created_at', since.toISOString())
    .gt('coins', 0)
    .limit(50000);

  const map: Record<string, { total: number; sources: Record<string, number> }> = {};
  for (const row of data ?? []) {
    const uid = row.user_id;
    if (!map[uid]) map[uid] = { total: 0, sources: {} };
    map[uid].total += Number(row.coins ?? 0);
    const src = row.source ?? 'other';
    map[uid].sources[src] = (map[uid].sources[src] ?? 0) + Number(row.coins ?? 0);
  }
  const sorted = Object.entries(map)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, limit);

  // Obtener info de usuarios
  const uids = sorted.map(([uid]) => uid);
  const { data: users } = await supabase
    .from('users')
    .select('id, username, email, coins')
    .in('id', uids);
  const userMap: Record<string, any> = {};
  for (const u of users ?? []) userMap[u.id] = u;

  return sorted.map(([uid, info]) => ({
    uid,
    user: userMap[uid] ?? { username: 'Desconocido', email: '—', coins: 0 },
    ...info,
  }));
}

async function getRecentTransactions(limit = 50) {
  const { data } = await supabase
    .from('transactions')
    .select('id, user_id, coins, source, description, created_at, users(username, email)')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

async function getHourlyActivity() {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const { data } = await supabase
    .from('transactions')
    .select('created_at, coins')
    .gte('created_at', since.toISOString())
    .gt('coins', 0)
    .limit(50000);

  const hours: number[] = new Array(24).fill(0);
  for (const row of data ?? []) {
    const h = new Date(row.created_at).getHours();
    hours[h] += Number(row.coins ?? 0);
  }
  return hours;
}

async function getSummaryTotals() {
  const [
    { count: totalTx },
    { count: totalUsers },
    { data: totalCoinsData },
  ] = await Promise.all([
    supabase.from('transactions').select('id', { count: 'exact', head: true }).gt('coins', 0),
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('transactions').select('coins').gt('coins', 0),
  ]);
  const totalCoins = totalCoinsData?.reduce((s, r) => s + Number(r.coins ?? 0), 0) ?? 0;
  return { totalTx: totalTx ?? 0, totalUsers: totalUsers ?? 0, totalCoins };
}

// ── SVG Helpers ───────────────────────────────────────────────────────────────

function DonutChart({ data, size = 180 }: {
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 13 }}>Sin datos</div>;

  const cx = size / 2, cy = size / 2;
  const r = size * 0.38, inner = size * 0.22;
  let angle = -Math.PI / 2;
  const paths: React.ReactNode[] = [];

  for (const d of data) {
    // Mínimo 4° para que siempre sea visible aunque el valor sea muy pequeño
    const slice = Math.max((d.value / total) * 2 * Math.PI, (4 * Math.PI) / 180);
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + slice);
    const y2 = cy + r * Math.sin(angle + slice);
    const large = slice > Math.PI ? 1 : 0;
    const xi1 = cx + inner * Math.cos(angle);
    const yi1 = cy + inner * Math.sin(angle);
    const xi2 = cx + inner * Math.cos(angle + slice);
    const yi2 = cy + inner * Math.sin(angle + slice);
    paths.push(
      <path
        key={d.label}
        d={`M ${xi1} ${yi1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z`}
        fill={d.color}
        opacity={0.9}
      />
    );
    angle += slice;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths}
      <circle cx={cx} cy={cy} r={inner - 2} fill="#fff" />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={11} fill="#64748B" fontWeight="600">Total</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={13} fill="#0F172A" fontWeight="900">{(total / 1000).toFixed(0)}K</text>
    </svg>
  );
}

function BarChart({ days, sources }: {
  days: { day: string; sources: Record<string, number>; total: number }[];
  sources: string[];
}) {
  const maxTotal = Math.max(...days.map(d => d.total), 1);
  const w = 620, h = 160, barW = Math.floor((w - 20) / days.length) - 2;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h + 20}`} style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(pct => (
        <line key={pct} x1={10} y1={h - h * pct} x2={w - 10} y2={h - h * pct}
          stroke="#F1F5F9" strokeWidth={1} />
      ))}
      {days.map((day, i) => {
        const x = 10 + i * (barW + 2);
        let yOff = 0;
        const bars: React.ReactNode[] = [];
        for (const src of sources) {
          const val = day.sources[src] ?? 0;
          const bh = (val / maxTotal) * h;
          if (bh < 1) continue;
          const cfg = getSource(src);
          bars.push(
            <rect key={src} x={x} y={h - yOff - bh} width={barW} height={bh}
              fill={cfg.color} opacity={0.85} rx={2} />
          );
          yOff += bh;
        }
        const label = day.day.slice(5); // MM-DD
        return (
          <g key={day.day}>
            {bars}
            {i % Math.ceil(days.length / 10) === 0 && (
              <text x={x + barW / 2} y={h + 14} textAnchor="middle" fontSize={9} fill="#94A3B8">{label}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function HourlyHeatmap({ hours }: { hours: number[] }) {
  const max = Math.max(...hours, 1);
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
      {hours.map((val, h) => {
        const pct = val / max;
        const bg = pct > 0.75 ? '#7C3AED' : pct > 0.5 ? '#A78BFA' : pct > 0.25 ? '#C4B5FD' : pct > 0 ? '#EDE9FE' : '#F8FAFC';
        return (
          <div key={h} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
            <div style={{ width: '100%', height: 48 * pct + 4, background: bg, borderRadius: 4, minHeight: 4 }} title={`${h}:00 — ${val.toLocaleString()} monedas`} />
            {h % 4 === 0 && <span style={{ fontSize: 9, color: '#94A3B8', whiteSpace: 'nowrap' }}>{h}h</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const sp = await searchParams;
  const days = Math.min(Math.max(Number(sp.days ?? 30), 7), 90);

  const [
    coinsBySource,
    dailyData,
    topEarners,
    recentTx,
    hourly,
    summary,
  ] = await Promise.all([
    getCoinsBySource(days),
    getDailyBySource(Math.min(days, 30)),
    getTopEarners(days),
    getRecentTransactions(50),
    getHourlyActivity(),
    getSummaryTotals(),
  ]);

  const totalCoinsPeriod = Object.values(coinsBySource).reduce((s, v) => s + v.coins, 0);
  const sourcesInUse = Object.keys(coinsBySource).filter(s => s !== 'cashout').sort(
    (a, b) => (coinsBySource[b]?.coins ?? 0) - (coinsBySource[a]?.coins ?? 0)
  );

  const donutData = sourcesInUse.map(s => ({
    label: getSource(s).label,
    value: coinsBySource[s]?.coins ?? 0,
    color: getSource(s).color,
  }));

  return (
    <html lang="es">
      <head>
        <title>Analíticas — JUEGALO Admin</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', sans-serif; background: #F1F5F9; color: #0F172A; min-height: 100vh; }

          .nav { background:#fff; border-bottom:1px solid #E2E8F0; padding:0 32px; height:60px; display:flex; align-items:center; gap:14px; position:sticky; top:0; z-index:100; box-shadow:0 1px 3px rgba(0,0,0,.06); }
          .logo { width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg,#6366F1,#4F46E5); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:900; font-size:16px; text-decoration:none; }
          .nav-title { font-weight:800; font-size:17px; color:#0F172A; }
          .nav-back { padding:6px 14px; border-radius:8px; background:#F8FAFC; border:1px solid #E2E8F0; color:#475569; font-size:12px; font-weight:600; text-decoration:none; display:flex; align-items:center; gap:5px; }
          .nav-back:hover { background:#EEF2FF; color:#4338CA; border-color:#C7D2FE; }
          .nav-right { margin-left:auto; display:flex; align-items:center; gap:10px; }
          .nav-dot { width:8px; height:8px; border-radius:50%; background:#10B981; box-shadow:0 0 6px #10B981; }
          .nav-status { font-size:12px; color:#64748B; font-weight:500; }

          .main { padding:28px 32px 56px; max-width:1360px; margin:0 auto; }

          /* PAGE HEADER */
          .page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:28px; flex-wrap:wrap; gap:16px; }
          .page-header-left { display:flex; align-items:center; gap:14px; }
          .page-icon { width:48px; height:48px; border-radius:14px; background:linear-gradient(135deg,#6366F1,#4F46E5); display:flex; align-items:center; justify-content:center; font-size:22px; box-shadow:0 4px 12px rgba(99,102,241,.35); }
          .page-title { font-size:22px; font-weight:900; color:#0F172A; letter-spacing:-.5px; }
          .page-sub   { font-size:13px; color:#64748B; margin-top:2px; font-weight:500; }

          /* PERIOD SELECTOR */
          .period-sel { display:flex; gap:6px; }
          .period-btn { padding:7px 16px; border-radius:8px; border:1.5px solid #E2E8F0; background:#fff; color:#64748B; font-size:12px; font-weight:700; text-decoration:none; transition:all .15s; font-family:inherit; }
          .period-btn:hover { border-color:#6366F1; color:#4338CA; background:#EEF2FF; }
          .period-btn.active { border-color:#6366F1; background:#6366F1; color:#fff; box-shadow:0 2px 8px rgba(99,102,241,.3); }

          /* SUMMARY CARDS */
          .summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; }
          .sum-card { background:#fff; border:1px solid #E2E8F0; border-radius:16px; padding:18px 20px; box-shadow:0 1px 3px rgba(0,0,0,.04); position:relative; overflow:hidden; }
          .sum-card::after { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:16px 16px 0 0; }
          .sum-card.indigo::after { background:linear-gradient(90deg,#6366F1,#818CF8); }
          .sum-card.violet::after { background:linear-gradient(90deg,#7C3AED,#A78BFA); }
          .sum-card.amber::after  { background:linear-gradient(90deg,#F59E0B,#FCD34D); }
          .sum-card.green::after  { background:linear-gradient(90deg,#10B981,#34D399); }
          .sum-icon { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px; margin-bottom:10px; }
          .sum-icon.indigo { background:#EEF2FF; }
          .sum-icon.violet { background:#F5F3FF; }
          .sum-icon.amber  { background:#FFFBEB; }
          .sum-icon.green  { background:#ECFDF5; }
          .sum-value { font-size:28px; font-weight:900; letter-spacing:-1px; color:#0F172A; line-height:1; }
          .sum-label { font-size:12px; color:#64748B; margin-top:4px; font-weight:500; }
          .sum-sub   { font-size:11px; color:#94A3B8; margin-top:2px; }

          /* SECTION */
          .section { background:#fff; border:1px solid #E2E8F0; border-radius:16px; padding:22px 24px; margin-bottom:20px; box-shadow:0 1px 3px rgba(0,0,0,.04); }
          .section-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
          .section-title { font-size:15px; font-weight:800; color:#0F172A; display:flex; align-items:center; gap:8px; }
          .section-sub   { font-size:12px; color:#64748B; margin-top:2px; }

          /* SOURCE BREAKDOWN */
          .breakdown-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px; }
          .source-list { display:flex; flex-direction:column; gap:10px; }
          .source-row { display:flex; align-items:center; gap:12px; }
          .source-emoji { font-size:18px; width:32px; text-align:center; }
          .source-info { flex:1; }
          .source-name { font-size:13px; font-weight:700; color:#0F172A; }
          .source-bar-wrap { height:6px; border-radius:3px; background:#F1F5F9; margin-top:4px; overflow:hidden; }
          .source-bar-fill { height:100%; border-radius:3px; transition:width .4s; }
          .source-coins { text-align:right; min-width:70px; }
          .source-coins-val { font-size:13px; font-weight:800; color:#0F172A; }
          .source-coins-pct { font-size:11px; color:#94A3B8; }
          .source-count { font-size:11px; color:#94A3B8; }

          /* DAILY BAR CHART */
          .chart-wrap { width:100%; overflow:hidden; }

          /* LEGEND */
          .legend { display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
          .legend-item { display:flex; align-items:center; gap:5px; font-size:11px; font-weight:600; color:#475569; }
          .legend-dot { width:8px; height:8px; border-radius:2px; }

          /* TOP EARNERS */
          .rank-table { width:100%; border-collapse:collapse; }
          .rank-table th { text-align:left; padding:9px 12px; font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:.5px; border-bottom:2px solid #F1F5F9; }
          .rank-table td { padding:12px; border-bottom:1px solid #F8FAFC; vertical-align:middle; }
          .rank-table tr:last-child td { border-bottom:none; }
          .rank-table tr:hover td { background:#FAFBFF; }
          .rank-num { font-size:13px; font-weight:900; color:#94A3B8; width:32px; }
          .rank-num.top1 { color:#F59E0B; }
          .rank-num.top2 { color:#64748B; }
          .rank-num.top3 { color:#B45309; }
          .user-cell { display:flex; align-items:center; gap:10px; }
          .user-avatar { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#6366F1,#8B5CF6); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; color:#fff; flex-shrink:0; }
          .user-name  { font-size:13px; font-weight:700; color:#0F172A; }
          .user-email { font-size:11px; color:#94A3B8; }
          .coins-earned { font-size:15px; font-weight:900; color:#7C3AED; }
          .coins-sub    { font-size:11px; color:#94A3B8; }
          .source-pills { display:flex; flex-wrap:wrap; gap:4px; }
          .source-pill  { padding:2px 8px; border-radius:20px; font-size:10px; font-weight:700; border:1px solid transparent; }

          /* RECENT TX */
          .tx-table { width:100%; border-collapse:collapse; }
          .tx-table th { text-align:left; padding:9px 12px; font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:.5px; border-bottom:2px solid #F1F5F9; }
          .tx-table td { padding:10px 12px; border-bottom:1px solid #F8FAFC; font-size:12.5px; vertical-align:middle; }
          .tx-table tr:last-child td { border-bottom:none; }
          .tx-table tr:hover td { background:#FAFBFF; }
          .source-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:20px; font-size:11px; font-weight:700; border:1px solid transparent; }
          .coins-pos { font-weight:800; color:#059669; }
          .coins-neg { font-weight:800; color:#DC2626; }
          .date-cell { font-size:11px; color:#94A3B8; white-space:nowrap; }

          /* HOURLY */
          .hourly-wrap { padding-top:4px; }

          /* EMPTY */
          .empty { padding:40px; text-align:center; color:#94A3B8; font-size:13px; }

          /* 2-col layout */
          .two-col { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px; }
          @media (max-width:900px) {
            .summary-grid { grid-template-columns:repeat(2,1fr); }
            .breakdown-grid { grid-template-columns:1fr; }
            .two-col { grid-template-columns:1fr; }
          }
        `}</style>
      </head>
      <body>

        {/* NAV */}
        <nav className="nav">
          <a href="/admin" className="logo">J</a>
          <span className="nav-title">JUEGALO Admin</span>
          <a className="nav-back" href="/admin">← Volver al panel</a>
          <div className="nav-right">
            <div className="nav-dot" />
            <span className="nav-status">En línea</span>
          </div>
        </nav>

        <main className="main">

          {/* PAGE HEADER */}
          <div className="page-header">
            <div className="page-header-left">
              <div className="page-icon">📊</div>
              <div>
                <div className="page-title">Analíticas de Monedas</div>
                <div className="page-sub">¿De dónde obtienen monedas los usuarios? · Últimos {days} días</div>
              </div>
            </div>
            {/* Period selector */}
            <div className="period-sel">
              {[7, 14, 30, 60, 90].map(d => (
                <a key={d} href={`/admin/analytics?days=${d}`} className={`period-btn ${days === d ? 'active' : ''}`}>
                  {d}d
                </a>
              ))}
            </div>
          </div>

          {/* SUMMARY CARDS */}
          <div className="summary-grid">
            <div className="sum-card indigo">
              <div className="sum-icon indigo">🪙</div>
              <div className="sum-value">{(totalCoinsPeriod / 1000).toFixed(1)}K</div>
              <div className="sum-label">Monedas acreditadas</div>
              <div className="sum-sub">en los últimos {days} días</div>
            </div>
            <div className="sum-card violet">
              <div className="sum-icon violet">📝</div>
              <div className="sum-value">{Object.values(coinsBySource).reduce((s, v) => s + v.count, 0).toLocaleString()}</div>
              <div className="sum-label">Transacciones</div>
              <div className="sum-sub">créditos procesados</div>
            </div>
            <div className="sum-card amber">
              <div className="sum-icon amber">👥</div>
              <div className="sum-value">{summary.totalUsers.toLocaleString()}</div>
              <div className="sum-label">Usuarios registrados</div>
              <div className="sum-sub">total histórico</div>
            </div>
            <div className="sum-card green">
              <div className="sum-icon green">🏆</div>
              <div className="sum-value">{(summary.totalCoins / 1000000).toFixed(2)}M</div>
              <div className="sum-label">Monedas totales</div>
              <div className="sum-sub">acreditadas históricamente</div>
            </div>
          </div>

          {/* DISTRIBUTION + DONUT */}
          <div className="breakdown-grid">

            {/* Donut + leyenda */}
            <div className="section" style={{ display:'flex', flexDirection:'column' }}>
              <div className="section-head">
                <div>
                  <div className="section-title">🍩 Distribución por fuente</div>
                  <div className="section-sub">% de monedas según origen · últimos {days} días</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:28 }}>
                <DonutChart data={donutData} size={160} />
                <div className="source-list" style={{ flex:1 }}>
                  {sourcesInUse.map(src => {
                    const cfg = getSource(src);
                    const info = coinsBySource[src] ?? { coins: 0, count: 0 };
                    const pct = totalCoinsPeriod > 0 ? (info.coins / totalCoinsPeriod * 100) : 0;
                    return (
                      <div key={src} className="source-row">
                        <span className="source-emoji">{cfg.emoji}</span>
                        <div className="source-info">
                          <div className="source-name">{cfg.label}</div>
                          <div className="source-bar-wrap">
                            <div className="source-bar-fill" style={{ width:`${pct}%`, background: cfg.color }} />
                          </div>
                          <div className="source-count">{info.count.toLocaleString()} transacciones</div>
                        </div>
                        <div className="source-coins">
                          <div className="source-coins-val">{(info.coins/1000).toFixed(1)}K</div>
                          <div className="source-coins-pct">{pct.toFixed(1)}%</div>
                        </div>
                      </div>
                    );
                  })}
                  {sourcesInUse.length === 0 && <div className="empty">Sin datos para el período seleccionado</div>}
                </div>
              </div>
            </div>

            {/* Actividad por hora */}
            <div className="section">
              <div className="section-head">
                <div>
                  <div className="section-title">⏰ Actividad por hora</div>
                  <div className="section-sub">Monedas acreditadas según la hora del día · últimos 7 días</div>
                </div>
              </div>
              <div className="hourly-wrap">
                <HourlyHeatmap hours={hourly} />
              </div>
              <div style={{ marginTop:12, display:'flex', gap:10, fontSize:11, color:'#64748B', fontWeight:600 }}>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:10, height:10, borderRadius:2, background:'#EDE9FE', display:'inline-block' }} /> Bajo</span>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:10, height:10, borderRadius:2, background:'#C4B5FD', display:'inline-block' }} /> Medio</span>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:10, height:10, borderRadius:2, background:'#A78BFA', display:'inline-block' }} /> Alto</span>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:10, height:10, borderRadius:2, background:'#7C3AED', display:'inline-block' }} /> Muy alto</span>
              </div>
            </div>
          </div>

          {/* DAILY BAR CHART */}
          <div className="section" style={{ marginBottom:20 }}>
            <div className="section-head">
              <div>
                <div className="section-title">📈 Monedas diarias por fuente</div>
                <div className="section-sub">Barras apiladas · cada color es una fuente · últimos {Math.min(days,30)} días</div>
              </div>
            </div>
            <div className="chart-wrap">
              <BarChart days={dailyData} sources={sourcesInUse} />
            </div>
            <div className="legend">
              {sourcesInUse.map(src => {
                const cfg = getSource(src);
                return (
                  <div key={src} className="legend-item">
                    <div className="legend-dot" style={{ background: cfg.color }} />
                    {cfg.emoji} {cfg.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* TOP EARNERS + RECENT TX */}
          <div className="two-col">

            {/* Top earners */}
            <div className="section">
              <div className="section-head">
                <div>
                  <div className="section-title">🏆 Top 10 usuarios</div>
                  <div className="section-sub">Por monedas ganadas · últimos {days} días</div>
                </div>
              </div>
              {topEarners.length === 0 ? (
                <div className="empty">Sin datos</div>
              ) : (
                <table className="rank-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Usuario</th>
                      <th>Monedas</th>
                      <th>Fuentes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topEarners.map((u, i) => {
                      const initials = (u.user?.username ?? 'U').substring(0, 2).toUpperCase();
                      const numClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
                      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
                      return (
                        <tr key={u.uid}>
                          <td><span className={`rank-num ${numClass}`}>{medal}</span></td>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar">{initials}</div>
                              <div>
                                <div className="user-name">{u.user?.username ?? 'Jugador'}</div>
                                <div className="user-email">{u.user?.email || u.uid.substring(0,8).toUpperCase()}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="coins-earned">{u.total.toLocaleString()}</div>
                            <div className="coins-sub">saldo actual: {(u.user?.coins ?? 0).toLocaleString()}</div>
                          </td>
                          <td>
                            <div className="source-pills">
                              {Object.entries(u.sources)
                                .sort(([,a],[,b]) => b - a)
                                .slice(0, 3)
                                .map(([src, val]) => {
                                  const cfg = getSource(src);
                                  return (
                                    <span key={src} className="source-pill" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                                      {cfg.emoji} {(val/1000).toFixed(1)}K
                                    </span>
                                  );
                                })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Fuente por fuente KPIs */}
            <div className="section">
              <div className="section-head">
                <div>
                  <div className="section-title">🔢 Detalle por fuente</div>
                  <div className="section-sub">Métricas individuales · últimos {days} días</div>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {sourcesInUse.length === 0 && <div className="empty">Sin datos</div>}
                {sourcesInUse.map(src => {
                  const cfg = getSource(src);
                  const info = coinsBySource[src] ?? { coins: 0, count: 0 };
                  const avg = info.count > 0 ? Math.round(info.coins / info.count) : 0;
                  const pct = totalCoinsPeriod > 0 ? (info.coins / totalCoinsPeriod * 100) : 0;
                  return (
                    <div key={src} style={{ background: cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
                      <div style={{ fontSize:22 }}>{cfg.emoji}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:800, color:'#0F172A', marginBottom:2 }}>{cfg.label}</div>
                        <div style={{ fontSize:11, color:'#64748B' }}>{info.count.toLocaleString()} transacciones · promedio {avg.toLocaleString()} monedas c/u</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:16, fontWeight:900, color: cfg.color }}>{(info.coins/1000).toFixed(1)}K</div>
                        <div style={{ fontSize:10, color:'#94A3B8', fontWeight:700 }}>{pct.toFixed(1)}% del total</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RECENT TRANSACTIONS */}
          <div className="section">
            <div className="section-head">
              <div>
                <div className="section-title">🕐 Últimas 50 transacciones</div>
                <div className="section-sub">Transacciones más recientes de todos los usuarios</div>
              </div>
              <a href="/admin/analytics" style={{ fontSize:12, color:'#6366F1', fontWeight:700, textDecoration:'none' }}>↻ Actualizar</a>
            </div>
            {recentTx.length === 0 ? (
              <div className="empty">Sin transacciones</div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table className="tx-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Fuente</th>
                      <th>Monedas</th>
                      <th>Descripción</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTx.map((tx: any) => {
                      const cfg = getSource(tx.source);
                      const isNeg = Number(tx.coins) < 0;
                      const u = tx.users;
                      const initials = (u?.username ?? 'U').substring(0, 2).toUpperCase();
                      const dt = new Date(tx.created_at);
                      return (
                        <tr key={tx.id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar" style={{ width:28, height:28, fontSize:10 }}>{initials}</div>
                              <div>
                                <div style={{ fontSize:12, fontWeight:700 }}>{u?.username ?? 'Jugador'}</div>
                                <div style={{ fontSize:10, color:'#94A3B8' }}>{u?.email || tx.user_id.substring(0,8).toUpperCase()}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="source-badge" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                              {cfg.emoji} {cfg.label}
                            </span>
                          </td>
                          <td>
                            <span className={isNeg ? 'coins-neg' : 'coins-pos'}>
                              {isNeg ? '' : '+'}{Number(tx.coins).toLocaleString()}
                            </span>
                          </td>
                          <td style={{ maxWidth:220, color:'#64748B', fontSize:12 }}>
                            {tx.description ?? '—'}
                          </td>
                          <td className="date-cell">
                            {dt.toLocaleDateString('es-MX', { day:'2-digit', month:'short' })}<br />
                            {dt.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>
      </body>
    </html>
  );
}
