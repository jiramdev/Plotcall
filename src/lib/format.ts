export type ValueFormat = "euro" | "km" | "people";

const euro = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const integer = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 0 });

export function formatValue(value: number, format: ValueFormat): string {
  const rounded = Math.round(value);
  if (format === "euro") return euro.format(rounded);
  if (format === "km") return `${integer.format(rounded)} km`;
  return integer.format(rounded);
}

/** Short labels for chart axes. Full values stay in the caption. */
export function formatAxis(value: number, format: ValueFormat): string {
  if (format === "euro" || format === "people") {
    if (value === 0) return "0";
    return `${Math.round(value / 1000)}k`;
  }
  return integer.format(value);
}

/**
 * Accepts 450000, 450.000 (Dutch thousands) and 450,5.
 * A dot followed by exactly three digits is a thousands separator.
 */
export function parseLooseNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, "").replace(/€/g, "");
  if (!trimmed) return null;
  if (/^\d{1,3}(\.\d{3})+$/.test(trimmed)) {
    return Number(trimmed.replace(/\./g, ""));
  }
  if (/^\d{1,3}(\.\d{3})+,\d+$/.test(trimmed)) {
    return Number(trimmed.replace(/\./g, "").replace(",", "."));
  }
  if (/^\d+,\d+$/.test(trimmed)) return Number(trimmed.replace(",", "."));
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return null;
}

export function elapsedSince(start: number): number {
  return Math.round(performance.now() - start);
}

export function compareToActual(
  guess: number,
  actual: number,
  format: ValueFormat,
): string {
  const delta = guess - actual;
  const closeBand = Math.max(Math.abs(actual) * 0.02, 1);
  if (Math.abs(delta) <= closeBand) {
    return `You guessed ${formatValue(guess, format)}, very close to the CBS figure of ${formatValue(actual, format)}.`;
  }
  const direction = delta > 0 ? "above" : "below";
  return `You guessed ${formatValue(guess, format)}, which is ${formatValue(Math.abs(delta), format)} ${direction} the CBS figure of ${formatValue(actual, format)}.`;
}
