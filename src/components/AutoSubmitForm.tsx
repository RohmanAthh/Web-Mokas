"use client";

/** Form GET yang langsung submit saat select/radio berubah (input teks tetap menunggu Enter/tombol). */
export function AutoSubmitForm({ children, ...props }: React.ComponentProps<"form">) {
  return (
    <form
      {...props}
      onChange={(e) => {
        const t = e.target as unknown as HTMLInputElement;
        if (!t.name) return;
        if (t.tagName === "SELECT" || t.type === "radio" || t.type === "checkbox") e.currentTarget.requestSubmit();
      }}
    >
      {children}
    </form>
  );
}
