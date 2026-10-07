import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Plotcall",
  description: "Three research prototypes: guess a public statistic, then see the CBS figure.",
};

const prototypes = [
  {
    href: "/poc/predict-vs-read",
    title: "Predict vs read",
    test: "Does guessing before the chart change what people remember?",
  },
  {
    href: "/poc/input-methods",
    title: "Input methods",
    test: "Draw, a number slider, or a yes/no probability: which way of guessing is usable?",
  },
  {
    href: "/poc/crowd",
    title: "Crowd",
    test: "After you guess, does a distribution of other guesses change the story?",
  },
];

export default function Home() {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="mx-auto flex w-full max-w-lg items-center justify-between px-4 py-3">
        <p className="text-sm font-semibold tracking-tight">Plotcall</p>
        <Link
          href="/results"
          className="text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Results
        </Link>
      </header>
      <main id="content" className="mx-auto w-full max-w-lg px-4 pb-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Fontys ICT · user-test kit
        </p>
        <h1 className="mt-2 text-[1.85rem] font-semibold leading-[1.15] tracking-tight text-balance">
          Guess the figure. Then see what CBS measured.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink/80">
          Three short prototypes for a phone test. Each one isolates a single question about how
          people meet a public statistic.
        </p>
        <ul className="mt-6 space-y-3">
          {prototypes.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-2xl bg-white px-4 py-4 ring-1 ring-line"
              >
                <span className="block text-lg font-semibold">{item.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">{item.test}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm leading-relaxed text-muted">
          For the person running the session: answers are saved on the phone. Open{" "}
          <Link href="/results" className="font-semibold text-ink underline underline-offset-4">
            the results log
          </Link>{" "}
          to check them and download a CSV. Figures are from CBS StatLine, with the table and year
          on each screen.
        </p>
      </main>
    </div>
  );
}
