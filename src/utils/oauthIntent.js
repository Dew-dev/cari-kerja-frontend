const OAUTH_INTENT_KEY = "oauth_intent";
const OAUTH_SESSION_BACKUP_KEY = "oauth_session_backup";

export const OAUTH_INTENT_LINK_TELEGRAM = "link_telegram";

export function beginTelegramLinkIntent({ token, refreshToken, user }) {
  sessionStorage.setItem(OAUTH_INTENT_KEY, OAUTH_INTENT_LINK_TELEGRAM);
  sessionStorage.setItem(
    OAUTH_SESSION_BACKUP_KEY,
    JSON.stringify({ token, refreshToken, user }),
  );
}

export function isTelegramLinkIntent() {
  return sessionStorage.getItem(OAUTH_INTENT_KEY) === OAUTH_INTENT_LINK_TELEGRAM;
}

export function clearOAuthLinkIntent() {
  sessionStorage.removeItem(OAUTH_INTENT_KEY);
  sessionStorage.removeItem(OAUTH_SESSION_BACKUP_KEY);
}

export function restoreSessionBackup() {
  try {
    const raw = sessionStorage.getItem(OAUTH_SESSION_BACKUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
