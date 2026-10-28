export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { tick } = await import("./lib/server/service");
  const timer = setInterval(() => tick(), 20_000);
  timer.unref();
}
