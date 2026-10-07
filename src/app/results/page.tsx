import type { Metadata } from "next";
import { ResultsClient } from "./ResultsClient";

export const metadata: Metadata = {
  title: "Results",
  description: "Answers saved on this phone during a Plotcall test session, with a CSV download.",
};

export default function ResultsPage() {
  return <ResultsClient />;
}
