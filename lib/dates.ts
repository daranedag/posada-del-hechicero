export function formatChileDate(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";

  return `${part("day")}/${part("month")}/${part("year")} ${part("hour")}:${part("minute")} ${part("dayPeriod").toUpperCase()}`;
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
