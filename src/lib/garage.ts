"use client";

// Favorit & daftar bandingkan disimpan di localStorage (per browser, tanpa akun).
import { useSyncExternalStore } from "react";

export const MAX_COMPARE = 3;
const KEYS = { fav: "gp_favorites", compare: "gp_compare" } as const;
type ListName = keyof typeof KEYS;

const listeners = new Set<() => void>();
const cache: Partial<Record<ListName, { raw: string | null; ids: number[] }>> = {};
const EMPTY: number[] = [];

function read(name: ListName): number[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEYS[name]);
  } catch {
    return EMPTY;
  }
  const hit = cache[name];
  if (hit && hit.raw === raw) return hit.ids; // referensi stabil untuk useSyncExternalStore
  let ids: number[] = EMPTY;
  try {
    const parsed = JSON.parse(raw ?? "[]");
    if (Array.isArray(parsed)) ids = parsed.filter((n) => Number.isInteger(n) && n > 0);
  } catch {}
  cache[name] = { raw, ids };
  return ids;
}

function write(name: ListName, ids: number[]) {
  try {
    localStorage.setItem(KEYS[name], JSON.stringify(ids));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEYS.fav || e.key === KEYS.compare) cb();
  };
  window.addEventListener("storage", onStorage); // sinkron antar tab
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useList(name: ListName) {
  return useSyncExternalStore(subscribe, () => read(name), () => EMPTY);
}

export function toggleFavorite(id: number) {
  const ids = read("fav");
  write("fav", ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids]);
}

/** @returns false bila daftar bandingkan sudah penuh */
export function toggleCompare(id: number) {
  const ids = read("compare");
  if (ids.includes(id)) {
    write("compare", ids.filter((x) => x !== id));
    return true;
  }
  if (ids.length >= MAX_COMPARE) return false;
  write("compare", [...ids, id]);
  return true;
}

export function setCompare(ids: number[]) {
  write("compare", ids.slice(0, MAX_COMPARE));
}
