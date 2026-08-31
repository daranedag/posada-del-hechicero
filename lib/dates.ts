export function formatChileDate(value: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    dateStyle: "long",
    timeStyle: "short",
    ...options,
  }).format(new Date(value));
}

export function formatChileDay(value: string) {
  return new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", day: "2-digit" }).format(new Date(value));
}

export function formatChileMonth(value: string) {
  return new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", month: "short" }).format(new Date(value)).replace(".", "");
}

export function isFutureDate(value: string) {
  return new Date(value).getTime() > Date.now();
}
