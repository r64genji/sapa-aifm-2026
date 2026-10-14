export function kappa(pairs: [boolean, boolean][]) {
  const n = pairs.length;
  if (n === 0) return null;
  const both = pairs.filter(([a, b]) => a && b).length;
  const neither = pairs.filter(([a, b]) => !a && !b).length;
  const goldYes = pairs.filter(([a]) => a).length;
  const modelYes = pairs.filter(([, b]) => b).length;
  const observed = (both + neither) / n;
  const chance = (goldYes * modelYes + (n - goldYes) * (n - modelYes)) / (n * n);
  return chance === 1 ? null : round((observed - chance) / (1 - chance));
}

export function wilson(k: number, n: number) {
  if (n === 0) return null;
  const z = 1.96;
  const p = k / n;
  const centre = (p + (z * z) / (2 * n)) / (1 + (z * z) / n);
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / (1 + (z * z) / n);
  return [round(Math.max(0, centre - half)), round(Math.min(1, centre + half))];
}

export function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function share(k: number, n: number) {
  return n === 0 ? null : round(k / n);
}

export function fraction(k: number, n: number) {
  return { k, n, share: share(k, n), ci95: wilson(k, n) };
}
