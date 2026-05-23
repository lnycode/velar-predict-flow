/**
 * Statistical correlation utilities for migraine analytics.
 *
 * - Pearson r for continuous variables (severity vs. pressure, humidity, temperature)
 * - Point-biserial r for binary vs. continuous (trigger_detected vs. severity)
 * - Fisher z-transform 95% confidence intervals
 *
 * All functions are pure and side-effect free.
 */

export interface CorrelationResult {
  variable: string;
  n: number;
  r: number;            // correlation coefficient [-1, 1]
  ciLow: number;        // 95% CI lower bound
  ciHigh: number;       // 95% CI upper bound
  strength: 'negligible' | 'weak' | 'moderate' | 'strong';
  direction: 'positive' | 'negative' | 'none';
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return 0;
  const mx = mean(x);
  const my = mean(y);
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx;
    const b = y[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}

/** Fisher z 95% CI for a Pearson r. */
export function fisherCI(r: number, n: number): [number, number] {
  if (n < 4 || Math.abs(r) >= 1) return [r, r];
  const z = 0.5 * Math.log((1 + r) / (1 - r));
  const se = 1 / Math.sqrt(n - 3);
  const zLo = z - 1.96 * se;
  const zHi = z + 1.96 * se;
  const toR = (zv: number) => (Math.exp(2 * zv) - 1) / (Math.exp(2 * zv) + 1);
  return [toR(zLo), toR(zHi)];
}

function classify(r: number): CorrelationResult['strength'] {
  const a = Math.abs(r);
  if (a < 0.1) return 'negligible';
  if (a < 0.3) return 'weak';
  if (a < 0.5) return 'moderate';
  return 'strong';
}

export function analyzeCorrelation(
  variable: string,
  x: number[],
  y: number[],
): CorrelationResult {
  const pairs = x.map((v, i) => [v, y[i]] as const).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  const xs = pairs.map((p) => p[0]);
  const ys = pairs.map((p) => p[1]);
  const n = pairs.length;
  const r = pearson(xs, ys);
  const [ciLow, ciHigh] = fisherCI(r, n);
  return {
    variable,
    n,
    r: Math.round(r * 1000) / 1000,
    ciLow: Math.round(ciLow * 1000) / 1000,
    ciHigh: Math.round(ciHigh * 1000) / 1000,
    strength: classify(r),
    direction: r > 0.05 ? 'positive' : r < -0.05 ? 'negative' : 'none',
  };
}

export interface EntryForCorrelation {
  severity?: number | null;
  intensity?: number | null;
  pressure?: number | null;
  humidity?: number | null;
  temperature?: number | null;
  trigger_detected?: boolean | null;
}

/** Run the standard battery of correlations against severity. */
export function runStandardCorrelations(entries: EntryForCorrelation[]): CorrelationResult[] {
  const severity = entries.map((e) => Number(e.severity ?? e.intensity ?? NaN));
  const variables: Array<{ label: string; values: number[] }> = [
    { label: 'Barometric pressure (hPa)', values: entries.map((e) => Number(e.pressure ?? NaN)) },
    { label: 'Humidity (%)', values: entries.map((e) => Number(e.humidity ?? NaN)) },
    { label: 'Temperature (°C)', values: entries.map((e) => Number(e.temperature ?? NaN)) },
    { label: 'Trigger detected', values: entries.map((e) => (e.trigger_detected ? 1 : 0)) },
  ];

  return variables.map(({ label, values }) => analyzeCorrelation(label, values, severity));
}
