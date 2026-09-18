import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "prescrimed:install-banner-dismissed";

type InstallPromptEvent = Event & { prompt: () => Promise<void> };

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallAppBanner() {
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    if (isStandalone()) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    if (isIos()) setVisible(true);

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="flex items-center gap-2 border-b bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
      {deferred ? (
        <>
          <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">Instale o PrescriMed no seu celular para abrir mais rápido.</span>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await deferred.prompt();
              dismiss();
            }}
          >
            Instalar app
          </Button>
        </>
      ) : (
        <>
          <Share className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            No iPhone: toque em Compartilhar e depois em “Adicionar à Tela de Início”.
          </span>
        </>
      )}
      <Button size="icon" variant="ghost" onClick={dismiss} aria-label="Dispensar aviso de instalação">
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
