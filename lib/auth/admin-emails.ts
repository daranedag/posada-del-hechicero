export function parseAdminEmails(...sources: Array<string | null | undefined>) {
  return [...new Set(
    sources
      .flatMap((source) => source?.split(/[\s,;]+/) ?? [])
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )];
}

export function isAdminEmailAllowed(email: string, ...sources: Array<string | null | undefined>) {
  return parseAdminEmails(...sources).includes(email.trim().toLowerCase());
}
