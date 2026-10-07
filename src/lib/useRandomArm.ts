"use client";

import { useEffect, useSyncExternalStore } from "react";

export type Arm = "predict" | "read";

let memoryArm: Arm | null = null;

function armFromLocation(): Arm {
  const raw = new URLSearchParams(window.location.search).get("v");
  if (raw === "predict" || raw === "read") {
    memoryArm = raw;
    return raw;
  }
  if (!memoryArm) {
    memoryArm = Math.random() < 0.5 ? "predict" : "read";
  }
  return memoryArm;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}

/**
 * Uses ?v=predict or ?v=read when present. Otherwise assigns 50/50 once.
 * The assignment is written into the URL so a refresh keeps the same arm.
 */
export function useRandomArm(): Arm | null {
  const arm = useSyncExternalStore(subscribe, armFromLocation, () => null);

  useEffect(() => {
    if (!arm) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("v") === arm) return;
    url.searchParams.set("v", arm);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [arm]);

  return arm;
}
