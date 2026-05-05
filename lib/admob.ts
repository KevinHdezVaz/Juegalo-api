// ── AdMob Reporting API ──────────────────────────────────────────
// Usa OAuth2 con refresh token (cuenta de AdMob).
//
// Env vars necesarias:
//   ADMOB_CLIENT_ID      → OAuth2 client ID
//   ADMOB_CLIENT_SECRET  → OAuth2 client secret
//   ADMOB_REFRESH_TOKEN  → refresh token (obtenido una sola vez)
//   ADMOB_PUBLISHER_ID   → ej. "pub-5486388630970825"

export interface AdMobDayRow {
  date:        string;  // "YYYYMMDD"
  earnings:    number;  // en la moneda de la cuenta (ej. MXN)
  impressions: number;
  clicks:      number;
  ecpm:        number;
}

export interface AdMobSummary {
  rows:             AdMobDayRow[];
  totalEarnings:    number;
  totalImpressions: number;
  totalClicks:      number;
  avgEcpm:          number;
  error?:           string;
}

export interface AdMobPeriods {
  today:      number;
  yesterday:  number;
  thisMonth:  number;
  lastMonth:  number;
  error?:     string;
}

// ── Obtiene access token desde el refresh token ──────────────────
async function getAccessToken(): Promise<string> {
  const clientId     = process.env.ADMOB_CLIENT_ID;
  const clientSecret = process.env.ADMOB_CLIENT_SECRET;
  const refreshToken = process.env.ADMOB_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Faltan env vars: ADMOB_CLIENT_ID, ADMOB_CLIENT_SECRET o ADMOB_REFRESH_TOKEN');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  });

  const data = await res.json() as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`OAuth error: ${JSON.stringify(data)}`);
  return data.access_token;
}

// ── Formatea una fecha como { year, month, day } ─────────────────
function fmtDate(d: Date) {
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

// ── Parsea la respuesta NDJSON de AdMob ─────────────────────────
function parseNdjson(text: string): AdMobDayRow[] {
  const rows: AdMobDayRow[] = [];
  for (const line of text.trim().split('\n').filter(Boolean)) {
    try {
      const obj = JSON.parse(line.replace(/^,/, ''));
      if (!obj.row) continue;
      const dv = obj.row.dimensionValues ?? {};
      const mv = obj.row.metricValues    ?? {};
      rows.push({
        date:        dv.DATE?.value ?? '',
        earnings:    Number(mv.ESTIMATED_EARNINGS?.microsValue ?? 0) / 1_000_000,
        impressions: Number(mv.IMPRESSIONS?.integerValue ?? 0),
        clicks:      Number(mv.CLICKS?.integerValue ?? 0),
        ecpm:        Number(mv.IMPRESSION_RPM?.microsValue ?? 0) / 1_000_000,
      });
    } catch {
      // línea de header/footer — ignorar
    }
  }
  return rows;
}

// ── Genera reporte de red para un rango de fechas ────────────────
async function fetchNetworkReport(
  token:       string,
  publisherId: string,
  start:       Date,
  end:         Date,
  metrics:     string[] = ['ESTIMATED_EARNINGS', 'IMPRESSIONS', 'CLICKS', 'IMPRESSION_RPM'],
): Promise<AdMobDayRow[]> {
  const body = {
    reportSpec: {
      dateRange:      { startDate: fmtDate(start), endDate: fmtDate(end) },
      dimensions:     ['DATE'],
      metrics,
      sortConditions: [{ dimension: 'DATE', order: 'ASCENDING' }],
    },
  };

  const res = await fetch(
    `https://admob.googleapis.com/v1/accounts/${publisherId}/networkReport:generate`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    console.error('[AdMob] API error:', res.status, await res.text());
    return [];
  }

  return parseNdjson(await res.text());
}

// ── Suma los earnings de un array de filas ────────────────────────
function sumEarnings(rows: AdMobDayRow[]): number {
  return rows.reduce((s, r) => s + r.earnings, 0);
}

// ── Reporte por día de los últimos N días ────────────────────────
export async function getAdMobReport(days = 7): Promise<AdMobSummary> {
  const publisherId = process.env.ADMOB_PUBLISHER_ID;
  if (!publisherId) {
    return { rows: [], totalEarnings: 0, totalImpressions: 0, totalClicks: 0, avgEcpm: 0,
      error: 'ADMOB_PUBLISHER_ID no configurada' };
  }

  try {
    const token = await getAccessToken();
    const end   = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));

    const rows             = await fetchNetworkReport(token, publisherId, start, end);
    const totalEarnings    = rows.reduce((s, r) => s + r.earnings, 0);
    const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
    const totalClicks      = rows.reduce((s, r) => s + r.clicks, 0);
    const avgEcpm          = totalImpressions > 0 ? (totalEarnings / totalImpressions) * 1000 : 0;

    return { rows, totalEarnings, totalImpressions, totalClicks, avgEcpm };
  } catch (e) {
    console.error('[AdMob] Error:', e);
    return { rows: [], totalEarnings: 0, totalImpressions: 0, totalClicks: 0, avgEcpm: 0, error: String(e) };
  }
}

// ── Períodos fijos: hoy / ayer / este mes / mes pasado ───────────
// Un solo token — 4 requests en paralelo
export async function getAdMobPeriods(): Promise<AdMobPeriods> {
  const publisherId = process.env.ADMOB_PUBLISHER_ID;
  if (!publisherId) {
    return { today: 0, yesterday: 0, thisMonth: 0, lastMonth: 0,
      error: 'ADMOB_PUBLISHER_ID no configurada' };
  }

  try {
    const token = await getAccessToken();

    const now       = new Date();
    const todayD    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterD   = new Date(todayD); yesterD.setDate(todayD.getDate() - 1);
    const monthS    = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonS  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonE  = new Date(now.getFullYear(), now.getMonth(), 0); // último día del mes anterior

    const m = ['ESTIMATED_EARNINGS'];

    const [rToday, rYest, rMonth, rPrev] = await Promise.all([
      fetchNetworkReport(token, publisherId, todayD,   todayD,  m),
      fetchNetworkReport(token, publisherId, yesterD,  yesterD, m),
      fetchNetworkReport(token, publisherId, monthS,   todayD,  m),
      fetchNetworkReport(token, publisherId, prevMonS, prevMonE, m),
    ]);

    return {
      today:     sumEarnings(rToday),
      yesterday: sumEarnings(rYest),
      thisMonth: sumEarnings(rMonth),
      lastMonth: sumEarnings(rPrev),
    };
  } catch (e) {
    console.error('[AdMob] Periods error:', e);
    return { today: 0, yesterday: 0, thisMonth: 0, lastMonth: 0, error: String(e) };
  }
}
