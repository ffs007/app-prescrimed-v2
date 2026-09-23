import { reportError } from "@/lib/reportError";
/**
 * Registro único e protegido do service worker.
 * Nunca registra em dev, iframe ou pré-visualização da Lovable.
 */
const SW_URL = "/sw.js";

function isPreviewHost(hostname: string) {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

async function unregisterExisting() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((r) => (r.active?.scriptURL ?? r.installing?.scriptURL ?? "").endsWith(SW_URL))
      .map((r) => r.unregister()),
  );
}

export async function registerServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const refused =
    !import.meta.env.PROD ||
    window.self !== window.top ||
    isPreviewHost(window.location.hostname) ||
    new URLSearchParams(window.location.search).has("sw") &&
      new URLSearchParams(window.location.search).get("sw") === "off";

  if (refused) {
    await unregisterExisting();
    return;
  }

  try {
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({ immediate: true });
  } catch (error) {
    reportError("pwa/registerServiceWorker", error);
  }
}
