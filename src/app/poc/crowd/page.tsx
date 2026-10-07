import type { Metadata } from "next";
import { Suspense } from "react";
import { CrowdClient } from "./CrowdClient";

export const metadata: Metadata = {
  title: "Crowd",
  description: "Guess Eindhoven's population, then compare your guess with other guesses and the CBS count.",
};

export default function CrowdPage() {
  return (
    <Suspense
      fallback={
        <p className="min-h-dvh bg-paper px-4 py-8 text-base text-ink">Loading the question…</p>
      }
    >
      <CrowdClient />
    </Suspense>
  );
}
