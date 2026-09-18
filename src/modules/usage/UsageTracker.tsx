import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logUsageEvent } from "./usageClient";

/** Registra telas visitadas e início/fim de sessão. Não guarda dado clínico. */
export default function UsageTracker() {
  const location = useLocation();

  useEffect(() => {
    void logUsageEvent({ tipo: "sessao_inicio" });
    const onLeave = () => {
      void logUsageEvent({ tipo: "sessao_fim" });
    };
    window.addEventListener("pagehide", onLeave);
    return () => window.removeEventListener("pagehide", onLeave);
  }, []);

  useEffect(() => {
    void logUsageEvent({ tipo: "tela", rota: location.pathname });
  }, [location.pathname]);

  return null;
}
