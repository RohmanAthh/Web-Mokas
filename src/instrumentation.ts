// Dipanggil sekali saat server Next.js start.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { scheduleDailyBackup } = await import("./lib/backup");
    scheduleDailyBackup();
  }
}
