"use client";

import { useEffect, useState, useTransition } from "react";
import { getSlots } from "@/app/actions";
import { addDays, nowInShowroom } from "@/lib/slots";

const DAYS = 14;
const dayName = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("id-ID", { weekday: "short", timeZone: "UTC" });
const dayNum = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });

/** Pilih tanggal (14 hari ke depan) lalu jam kosong. Mengisi input preferredDate & preferredTime. */
export function SlotPicker({ carId, defaultDate, defaultTime, dateError, timeError }: {
  carId: number;
  defaultDate?: string;
  defaultTime?: string;
  dateError?: string;
  timeError?: string;
}) {
  const [today] = useState(() => nowInShowroom().date);
  const dates = Array.from({ length: DAYS }, (_, i) => addDays(today, i));
  const [date, setDate] = useState(defaultDate && dates.includes(defaultDate) ? defaultDate : "");
  const [time, setTime] = useState(defaultTime ?? "");
  const [slots, setSlots] = useState<{ time: string; available: boolean }[] | null>(null);
  const [loading, startLoading] = useTransition();

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    startLoading(async () => {
      const s = await getSlots(carId, date);
      if (!cancelled) setSlots(s);
    });
    return () => {
      cancelled = true;
    };
  }, [carId, date]);

  return (
    <div className="space-y-3">
      <input type="hidden" name="preferredDate" value={date} />
      <input type="hidden" name="preferredTime" value={time} />
      <div>
        <p className="nb-label">Tanggal_</p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2" role="listbox" aria-label="Pilih tanggal">
          {dates.map((d, i) => (
            <button
              key={d}
              type="button"
              role="option"
              aria-selected={date === d}
              onClick={() => { setDate(d); setTime(""); setSlots(null); }}
              className={`w-16 shrink-0 border-2 border-ink py-1.5 text-center ${date === d ? "bg-ink text-nb-yellow shadow-none" : "bg-white shadow-[2px_2px_0_0_var(--color-ink)] hover:bg-nb-lemon"}`}
            >
              <span className="block font-mono text-[10px] font-bold uppercase">{i === 0 ? "Hari ini" : i === 1 ? "Besok" : dayName(d)}</span>
              <span className="block text-sm font-bold">{dayNum(d)}</span>
            </button>
          ))}
        </div>
        {dateError && <p className="mt-1 inline-block bg-ink px-1.5 py-0.5 font-mono text-[11px] font-bold text-nb-pink">! {dateError}</p>}
      </div>

      {date && (
        <div>
          <p className="nb-label">Jam (WIB)_</p>
          {loading || !slots ? (
            <p className="font-mono text-xs">Cek jadwal_</p>
          ) : slots.length === 0 ? (
            <p className="font-mono text-xs">Tidak ada slot di tanggal ini.</p>
          ) : slots.every((s) => !s.available) ? (
            <p className="border-2 border-ink bg-nb-pink px-2 py-1 font-mono text-xs font-bold">Slot hari ini penuh / sudah lewat. Pilih tanggal lain.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  key={s.time}
                  type="button"
                  disabled={!s.available}
                  aria-pressed={time === s.time}
                  onClick={() => setTime(s.time)}
                  title={s.available ? undefined : "Sudah dibooking / lewat"}
                  className={`border-2 border-ink py-2 font-mono text-sm font-bold ${
                    !s.available ? "cursor-not-allowed bg-paper text-ink/30 line-through" : time === s.time ? "bg-ink text-nb-yellow" : "bg-white hover:bg-nb-lemon"
                  }`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
          {timeError && <p className="mt-1.5 inline-block bg-ink px-1.5 py-0.5 font-mono text-[11px] font-bold text-nb-pink">! {timeError}</p>}
        </div>
      )}
    </div>
  );
}
