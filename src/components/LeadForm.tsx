"use client";

import { useActionState, useState } from "react";
import { submitLead, type FormState } from "@/app/actions";
import { Honeypot } from "./forms";
import { NbAlert, NbConsent, NbField } from "./nb";
import { SlotPicker } from "./SlotPicker";

type Mode = "test_drive" | "inquiry";

export function LeadForm({ carId, defaultMode = "test_drive" }: { carId?: number; defaultMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(carId ? defaultMode : "inquiry");
  const [state, action, pending] = useActionState<FormState, FormData>(submitLead, {});
  const e = state.errors ?? {};
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <div className="space-y-3">
        <NbAlert state={state} />
        <button type="button" className="nb-btn w-full bg-white" onClick={() => window.location.reload()}>Kirim lagi</button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {carId && (
        <div className="grid grid-cols-2 border-2 border-ink" role="tablist">
          {(["test_drive", "inquiry"] as const).map((m, i) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`py-2 text-sm font-bold uppercase ${i > 0 ? "border-l-2 border-ink" : ""} ${mode === m ? "bg-ink text-nb-yellow" : "bg-white hover:bg-nb-lemon"}`}
            >
              {m === "test_drive" ? "Test drive" : "Tanya unit"}
            </button>
          ))}
        </div>
      )}
      <input type="hidden" name="type" value={mode} />
      {carId && <input type="hidden" name="carId" value={carId} />}
      <Honeypot />
      <NbField label="Nama" name="name" error={e.name}>
        <input id="name" name="name" defaultValue={v.name} className="nb-input" required autoComplete="name" />
      </NbField>
      <NbField label="WhatsApp" name="phone" error={e.phone}>
        <input id="phone" name="phone" defaultValue={v.phone} className="nb-input" required inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" />
      </NbField>
      {mode === "test_drive" && carId && (
        <SlotPicker carId={carId} defaultDate={v.preferredDate} defaultTime={v.preferredTime} dateError={e.preferredDate} timeError={e.preferredTime} />
      )}
      <NbField label={mode === "test_drive" ? "Catatan (opsional)" : "Pertanyaan"} name="message" error={e.message}>
        <textarea
          id="message"
          name="message"
          defaultValue={v.message}
          rows={3}
          className="nb-input"
          required={mode === "inquiry"}
          placeholder={mode === "test_drive" ? "mis. datang jam 4 sore" : "mis. harga masih bisa nego?"}
        />
      </NbField>
      <NbConsent error={e.consent} />
      <NbAlert state={state} />
      <button className="nb-btn w-full bg-nb-pink" disabled={pending}>
        {pending ? "Mengirim..." : mode === "test_drive" ? "Booking test drive →" : "Kirim pertanyaan →"}
      </button>
    </form>
  );
}
