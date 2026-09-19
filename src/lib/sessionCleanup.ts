const OWNER_KEY = "prescrimed:session-owner";
const APP_KEY_PREFIXES = ["prescrimed", "protocolo-sessao:"];
const APP_KEYS_EXACT = new Set([
  "protocolos_recentes",
  "clinic-info",
  "signature-config",
  "custom-medications",
  "custom-templates",
]);
const KEEP_KEYS = new Set(["prescrimed:install-banner-dismissed"]);

export function isAppDataKey(key: string): boolean {
  if (KEEP_KEYS.has(key)) return false;
  if (APP_KEYS_EXACT.has(key)) return true;
  return APP_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export function clearLocalAppData(): void {
  try {
    const keys: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key && isAppDataKey(key)) keys.push(key);
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    return;
  }
}

export function ensureLocalDataOwner(userId: string): boolean {
  try {
    if (localStorage.getItem(OWNER_KEY) === userId) return false;
    clearLocalAppData();
    localStorage.setItem(OWNER_KEY, userId);
    return true;
  } catch {
    return false;
  }
}
