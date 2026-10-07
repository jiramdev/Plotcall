import type { Metadata } from "next";
import { Suspense } from "react";
import { InputMethodsClient } from "./InputMethodsClient";

export const metadata: Metadata = {
  title: "Input methods",
  description: "Guess the same CBS bicycle figure by drawing, with a slider, or with a probability.",
};

export default function InputMethodsPage() {
  return (
    <Suspense
      fallback={
        <p className="min-h-dvh bg-paper px-4 py-8 text-base text-ink">Loading the question…</p>
      }
    >
      <InputMethodsClient />
    </Suspense>
  );
}
