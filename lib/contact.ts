export const contactDescription =
  "Prepara tu consulta y continúa en Instagram. Copia el mensaje, pégalo en el chat y envíalo; te responderemos allí.";

export function contactSectionBody(body: string): string {
  // Adapt the original seeded copy without overwriting customized content.
  return body === "Déjanos tu consulta y te responderemos al correo que nos indiques."
    ? contactDescription
    : body;
}

export function instagramChatUrl(profileUrl?: string): string {
  try {
    const url = new URL(profileUrl || "https://www.instagram.com/posada.delhechicero/");
    const username = url.hostname === "ig.me"
      ? /^\/m\/([\w.]+)\/?$/.exec(url.pathname)?.[1]
      : ["instagram.com", "www.instagram.com"].includes(url.hostname)
        ? /^\/([\w.]+)\/?$/.exec(url.pathname)?.[1]
        : undefined;
    if (username) return `https://ig.me/m/${username}`;
  } catch {
    // Use the shop account if configuration is missing or invalid.
  }
  return "https://ig.me/m/posada.delhechicero";
}
