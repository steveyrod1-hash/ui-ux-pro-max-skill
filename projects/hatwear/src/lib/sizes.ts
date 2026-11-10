/** Standard fitted-cap sizing: head circumference for each hat size. */
export const FITTED_SIZE_CHART: { size: string; inches: string; cm: number }[] = [
  { size: "6 7/8", inches: "21 5/8", cm: 54.9 },
  { size: "7", inches: "22", cm: 55.8 },
  { size: "7 1/8", inches: "22 3/8", cm: 56.8 },
  { size: "7 1/4", inches: "22 3/4", cm: 57.7 },
  { size: "7 3/8", inches: "23 1/8", cm: 58.7 },
  { size: "7 1/2", inches: "23 1/2", cm: 59.6 },
  { size: "7 5/8", inches: "23 7/8", cm: 60.6 },
  { size: "7 3/4", inches: "24 1/4", cm: 61.5 },
  { size: "7 7/8", inches: "24 5/8", cm: 62.5 },
  { size: "8", inches: "25", cm: 63.5 },
];

export function chartFor(size: string) {
  return FITTED_SIZE_CHART.find((r) => r.size === size);
}

/** Nearest fitted size for a head measurement in cm (rounds up between sizes). */
export function sizeForCm(cm: number) {
  if (!Number.isFinite(cm) || cm <= 0) return undefined;
  return FITTED_SIZE_CHART.find((r) => r.cm >= cm - 0.4) ?? FITTED_SIZE_CHART[FITTED_SIZE_CHART.length - 1];
}

export function sizeRangeLabel(sizes: string[]) {
  if (sizes.length === 1) return sizes[0];
  return `${sizes[0]} to ${sizes[sizes.length - 1]}`;
}
