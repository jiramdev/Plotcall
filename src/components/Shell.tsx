import Link from "next/link";
import type { ReactNode } from "react";

export function Shell({
  kicker,
  title,
  lede,
  children,
}: {
  kicker: string;
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Plotcall
        </Link>
        <Link
          href="/results"
          className="text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Results
        </Link>
      </header>
      <main id="content" className="mx-auto w-full max-w-lg px-4 pb-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{kicker}</p>
        <h1
          id="poc-heading"
          tabIndex={-1}
          className="mt-2 text-[1.65rem] font-semibold leading-[1.15] tracking-tight text-balance outline-none"
        >
          {title}
        </h1>
        {lede ? <p className="mt-3 text-base leading-relaxed text-ink/80">{lede}</p> : null}
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const styles =
    variant === "primary"
      ? "bg-pine text-white hover:bg-pine-2"
      : variant === "danger"
        ? "bg-white text-truth ring-1 ring-truth/40 hover:bg-truth/5"
        : "bg-white text-ink ring-1 ring-line hover:bg-paper";
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
      {...props}
    />
  );
}

export function TesterNote({ children }: { children: ReactNode }) {
  return (
    <details className="mt-10 rounded-2xl bg-white px-4 py-3 text-sm leading-relaxed text-muted ring-1 ring-line">
      <summary className="cursor-pointer font-semibold text-ink">Session notes for the tester</summary>
      <div className="mt-3 space-y-2">{children}</div>
    </details>
  );
}

export function SourceNote({
  source,
  placeholder,
}: {
  source: {
    name: string;
    tableId: string;
    url: string;
    period: string;
    retrieved: string;
    note: string;
  };
  placeholder: boolean;
}) {
  return (
    <div className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
      {placeholder ? (
        <p className="inline-flex rounded-full bg-[#f4df9a] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#5c4300] ring-1 ring-[#c9a227]">
          Example data
        </p>
      ) : null}
      <p>
        Source:{" "}
        <a
          className="font-medium text-ink underline decoration-line underline-offset-2"
          href={source.url}
          target="_blank"
          rel="noreferrer"
        >
          {source.name} ({source.tableId})
        </a>
        . {source.period}. Retrieved {source.retrieved}.
      </p>
      <p>{source.note}</p>
    </div>
  );
}
