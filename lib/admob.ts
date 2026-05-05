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
  earnings:    number;  // USD
  impressions: number;
  clicks:      number;
  ecpm:        number;  // USD
}

export interface AdMobSummary {
  rows:             AdMobDayRow[];
  totalEarnings:    number;
  totalImpressions: number;
  totalClicks:      number;
  avgEcpm:          number;
  error?:           string;
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

// ── Genera reporte de red de los últimos N días ──────────────────
export async function getAdMobReport(days = 7): Promise<AdMobSummary> {
  const publisherId = process.env.ADMOB_PUBLISHER_ID;
  if (!publisherId) {
    return { rows: [], totalEarnings: 0, totalImpressions: 0, totalClicks: 0, avgEcpm: 0, error: 'ADMOB_PUBLISHER_ID no configurada' };
  }

  try {
    const token = await getAccessToken();

    const end   = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));

    const fmt = (d: Date) => ({
      year:  d.getFullYear(),
      month: d.getMonth() + 1,
      day:   d.getDate(),
    });

    const body = {
      reportSpec: {
        dateRange:      { startDate: fmt(start), endDate: fmt(end) },
        dimensions:     ['DATE'],
        metrics:        ['ESTIMATED_EARNINGS', 'IMPRESSIONS', 'CLICKS', 'ECPM'],
        sortConditions: [{ dimension: 'DATE', order: 'ASCENDING' }],
      },
    };

    const res = await fetch(
      `https://admob.googleapis.com/v1/accounts/${publisherId}/networkReport:generate`,
      {
        method:  'POST',
        headers: {
          Authorization:  `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('[AdMob] API error:', err);
      return { rows: [], totalEarnings: 0, totalImpressions: 0, totalClicks: 0, avgEcpm: 0, error: `API ${res.status}` };
    }

    // Respuesta NDJSON — líneas JSON separadas por saltos de línea
    const text  = await res.text();
    const lines = text.trim().split('\n').filter(Boolean);

    const rows: AdMobDayRow[] = [];

    for (const line of lines) {
      try {
        const obj = JSON.parse(line.replace(/^,/, ''));
        if (!obj.row) continue;

        const dimValues    = obj.row.dimensionValues ?? {};
        const metricValues = obj.row.metricValues    ?? {};

        const date        = dimValues.DATE?.value ?? '';
        const earnings    = Number(metricValues.ESTIMATED_EARNINGS?.microsValue ?? 0) / 1_000_000;
        const impressions = Number(metricValues.IMPRESSIONS?.integerValue ?? 0);
        const clicks      = Number(metricValues.CLICKS?.integerValue ?? 0);
        const ecpm        = Number(metricValues.ECPM?.microsValue ?? 0) / 1_000_000;

        rows.push({ date, earnings, impressions, clicks, ecpm });
      } catch {
        // Línea de encabezado o footer — ignorar
      }
    }

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
