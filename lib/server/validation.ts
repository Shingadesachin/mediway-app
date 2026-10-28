export function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, maxLength);
}
