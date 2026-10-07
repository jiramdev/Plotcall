import { formatValue, type ValueFormat } from "@/lib/format";

export type SeriesPoint = {
  year: number;
  value: number;
};

export type StatSource = {
  name: string;
  tableId: string;
  url: string;
  apiUrl: string;
  period: string;
  retrieved: string;
  note: string;
};

export type StatSeries = {
  id: string;
  format: ValueFormat;
  /** Axis title, for example "euros". */
  unitLabel: string;
  /** Wider than the data when the chart is shown before the reveal. */
  domain: { min: number; max: number };
  points: SeriesPoint[];
  source: StatSource;
  placeholder: boolean;
  slider: {
    year: number;
    min: number;
    max: number;
    step: number;
    /** Starting handle. Not the published figure. */
    initial: number;
    prompt: string;
  };
  odds?: {
    year: number;
    above: number;
    prompt: string;
  };
  recall?: {
    year: number;
    prompt: string;
  };
};

/**
 * Figures copied from the CBS OData API on 2026-10-07.
 * Re-fetch with the filters in the comments below before swapping numbers.
 * Do not type in a "likely" value: if a figure is not in the response, mark
 * the series placeholder: true and show the example-data badge.
 */

/** 83625NED / TypedDataSet: RegioS eq 'GM0772' and Perioden endswith JJ00. Topic GemiddeldeVerkoopprijs_1 (euro). */
export const eindhovenHomePrices: StatSeries = {
  id: "eindhoven-home-prices",
  format: "euro",
  unitLabel: "euros",
  domain: { min: 0, max: 800_000 },
  placeholder: false,
  points: [
    { year: 2015, value: 212_919 },
    { year: 2016, value: 227_320 },
    { year: 2017, value: 258_287 },
    { year: 2018, value: 286_088 },
    { year: 2019, value: 308_793 },
    { year: 2020, value: 344_024 },
    { year: 2021, value: 367_046 },
    { year: 2022, value: 411_914 },
    { year: 2023, value: 404_275 },
    { year: 2024, value: 450_380 },
    { year: 2025, value: 469_870 },
  ],
  slider: {
    year: 2025,
    min: 100_000,
    max: 900_000,
    step: 5_000,
    initial: 500_000,
    prompt: "What was the average sale price in Eindhoven in 2025?",
  },
  recall: {
    year: 2025,
    prompt: "From memory, roughly what was the average sale price in Eindhoven in 2025?",
  },
  source: {
    name: "CBS StatLine — Bestaande koopwoningen; gemiddelde verkoopprijzen, regio",
    tableId: "83625NED",
    url: "https://opendata.cbs.nl/statline/#/CBS/nl/dataset/83625NED/table",
    apiUrl: "https://opendata.cbs.nl/ODataApi/OData/83625NED",
    period: "Eindhoven (GM0772), annual figures 2015–2025",
    retrieved: "7 October 2026",
    note: "Average sale price, in euros, of existing homes bought by a private individual. CBS warns this is not a house-price index: each year mixes different homes, so the line is not a pure price change. Figures in this table are marked definitive. Table last updated 17 February 2026.",
  },
};

/**
 * 84710NED: Vervoerwijzen A018984 (Fiets), Populatie A048709 (12 jaar of ouder),
 * Reismotieven T001080 (Totaal), RegioS 'NL01    ', Marges MW00000.
 * Topic Afstand_5, average kilometres per person per year.
 * 2024 is published but provisional, with a method break, so it is not in this series.
 */
export const netherlandsBicycleKm: StatSeries = {
  id: "nl-bicycle-km",
  format: "km",
  unitLabel: "km per person per year",
  domain: { min: 0, max: 2_000 },
  placeholder: false,
  points: [
    { year: 2018, value: 1_172 },
    { year: 2019, value: 1_112 },
    { year: 2020, value: 966 },
    { year: 2021, value: 988 },
    { year: 2022, value: 1_127 },
    { year: 2023, value: 1_080 },
  ],
  slider: {
    year: 2023,
    min: 0,
    max: 2_500,
    step: 10,
    initial: 1_500,
    prompt: "How many kilometres did an average person aged 12+ cycle in the Netherlands in 2023?",
  },
  odds: {
    year: 2023,
    above: 1_000,
    prompt: "In 2023, was the average above 1,000 km per person?",
  },
  source: {
    name: "CBS StatLine — Mobiliteit; per persoon, vervoerwijzen, motieven, regio's",
    tableId: "84710NED",
    url: "https://opendata.cbs.nl/statline/#/CBS/nl/dataset/84710NED/table",
    apiUrl: "https://opendata.cbs.nl/ODataApi/OData/84710NED",
    period: "Netherlands, bicycle, population aged 12+, all trip purposes, 2018–2023",
    retrieved: "7 October 2026",
    note: "Onderweg in Nederland (ODiN). Average distance by bicycle per person per year, in kilometres, for people aged 12 or older in private households. 2018–2023 are definitive. 2024 is left out: CBS marks it provisional and reports a method break after shorter invitation letters, even though a corrected figure was published.",
  },
};

/** 03759ned: Geslacht T001038, Leeftijd 10000, BurgerlijkeStaat T001019, RegioS GM0772. Topic BevolkingOp1Januari_1. */
export const eindhovenPopulation: StatSeries = {
  id: "eindhoven-population",
  format: "people",
  unitLabel: "people on 1 January",
  domain: { min: 200_000, max: 280_000 },
  placeholder: false,
  points: [
    { year: 2015, value: 223_209 },
    { year: 2016, value: 224_755 },
    { year: 2017, value: 226_868 },
    { year: 2018, value: 229_126 },
    { year: 2019, value: 231_642 },
    { year: 2020, value: 234_394 },
    { year: 2021, value: 235_691 },
    { year: 2022, value: 238_326 },
    { year: 2023, value: 243_730 },
    { year: 2024, value: 246_417 },
    { year: 2025, value: 249_035 },
    { year: 2026, value: 249_783 },
  ],
  slider: {
    year: 2026,
    min: 50_000,
    max: 600_000,
    step: 1_000,
    initial: 350_000,
    prompt: "How many people lived in Eindhoven on 1 January 2026?",
  },
  source: {
    name: "CBS StatLine — Bevolking op 1 januari en gemiddeld; geslacht, leeftijd en regio",
    tableId: "03759ned",
    url: "https://opendata.cbs.nl/statline/#/CBS/nl/dataset/03759ned/table",
    apiUrl: "https://opendata.cbs.nl/ODataApi/OData/03759ned",
    period: "Eindhoven (GM0772), population on 1 January, 2015–2026",
    retrieved: "7 October 2026",
    note: "Total population on 1 January, all ages and marital statuses. CBS marks every figure in this table definitive. The 1 January 2026 count was added on 23 June 2026.",
  },
};

/**
 * Fixed demo guesses for an empty test phone. These are not survey responses
 * and are not from CBS. The crowd screen labels them "Simulated crowd".
 */
export const simulatedEindhovenPopulationGuesses: readonly number[] = [
  120_000, 150_000, 160_000, 180_000, 180_000, 190_000, 200_000, 200_000,
  210_000, 220_000, 230_000, 240_000, 250_000, 250_000, 260_000, 280_000,
  300_000, 300_000, 320_000, 350_000, 400_000, 450_000,
];

export const seriesById = {
  [eindhovenHomePrices.id]: eindhovenHomePrices,
  [netherlandsBicycleKm.id]: netherlandsBicycleKm,
  [eindhovenPopulation.id]: eindhovenPopulation,
} as const;

export function valueInYear(series: StatSeries, year: number): number {
  const point = series.points.find((item) => item.year === year);
  if (!point) {
    throw new Error(`${series.id} has no value for ${year}`);
  }
  return point.value;
}

export function storyFor(series: StatSeries): string {
  const n = (year: number) => formatValue(valueInYear(series, year), series.format);

  if (series.id === eindhovenHomePrices.id) {
    return `The average existing home sold in Eindhoven cost ${n(2015)} in 2015 and ${n(2025)} in 2025, more than twice as much. Prices dipped in 2023, to ${n(2023)}, then rose again. This is the average price of the homes that sold that year, not a pure house-price index: CBS does not adjust for which kinds of homes changed hands.`;
  }

  if (series.id === netherlandsBicycleKm.id) {
    return `People aged 12 and older in the Netherlands cycled ${n(2018)} each in 2018, on average. The low point was 2020, at ${n(2020)}. By 2023 the average was ${n(2023)}: higher than 2020, still short of 2018, and not a smooth line, in definitive CBS kilometres per person per year (2024 is left out because CBS still marks it provisional).`;
  }

  if (series.id === eindhovenPopulation.id) {
    const growth = valueInYear(series, 2026) - valueInYear(series, 2015);
    return `On 1 January 2015, ${n(2015)} people lived in Eindhoven. On 1 January 2026 the count was ${n(2026)}. That is ${formatValue(growth, "people")} more people across eleven years, a steady climb in the definitive CBS count rather than a sudden jump.`;
  }

  return "";
}

function assertStoryFacts() {
  const price = eindhovenHomePrices;
  const p2015 = valueInYear(price, 2015);
  const p2022 = valueInYear(price, 2022);
  const p2023 = valueInYear(price, 2023);
  const p2024 = valueInYear(price, 2024);
  const p2025 = valueInYear(price, 2025);
  if (!(p2025 > p2015 * 2)) {
    throw new Error("Housing story expects 2025 to be more than double 2015");
  }
  if (!(p2023 < p2022 && p2023 < p2024)) {
    throw new Error("Housing story expects a 2023 dip");
  }

  const bike = netherlandsBicycleKm;
  const bikeValues = bike.points.map((point) => point.value);
  if (valueInYear(bike, 2020) !== Math.min(...bikeValues)) {
    throw new Error("Bicycle story expects 2020 to be the low point");
  }
  if (!(valueInYear(bike, 2023) > 1000)) {
    throw new Error("Bicycle odds question expects 2023 to be above 1,000 km");
  }
  if (!(valueInYear(bike, 2023) < valueInYear(bike, 2018))) {
    throw new Error("Bicycle story expects 2023 to be short of 2018");
  }
  if (valueInYear(bike, 2022) === valueInYear(bike, 2023)) {
    throw new Error("Bicycle story expects the recovery not to be a smooth line");
  }

  const people = eindhovenPopulation;
  const growth = valueInYear(people, 2026) - valueInYear(people, 2015);
  if (growth !== 26_574) {
    throw new Error("Population story expects a gain of 26,574 people");
  }
  for (let index = 1; index < people.points.length; index += 1) {
    if (people.points[index].value < people.points[index - 1].value) {
      throw new Error("Population story expects a series that does not fall");
    }
  }
}

assertStoryFacts();
