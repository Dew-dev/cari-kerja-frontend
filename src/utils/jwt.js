export function decodeAccessToken(token) {
  if (!token || token === "google-cookie-session") return null;

  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function tokenNeedsWorkerContext(token) {
  const payload = decodeAccessToken(token);
  if (!payload) return false;

  const roleId = Number(payload.role_id);
  return roleId === 1 && !payload.worker_id;
}
