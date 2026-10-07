import type { Metadata } from "next";
import { Suspense } from "react";
import { PredictReadClient } from "./PredictReadClient";

export const metadata: Metadata = {
  title: "Predict vs read",
  description: "Guess a CBS price series before seeing it, or read the chart first, then answer from memory.",
};

export default function PredictReadPage() {
  return (
    <Suspense
      fallback={
        <p className="min-h-dvh bg-paper px-4 py-8 text-base text-ink">Loading the question…</p>
      }
    >
      <PredictReadClient />
    </Suspense>
  );
}
