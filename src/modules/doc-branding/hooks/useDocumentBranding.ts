import { useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { DEFAULT_BRANDING, normalizeBranding } from "../lib/defaults";
import type { DocumentBranding } from "../lib/types";

const KEY = "prescrimed:document-branding";

/**
 * Perfil de personalização ativo dos documentos.
 * Fica no dispositivo (aplicação imediata na impressão); os modelos
 * reutilizáveis/compartilháveis vivem no banco.
 */
export function useDocumentBranding() {
  const [raw, setRaw] = useLocalStorage<DocumentBranding>(KEY, DEFAULT_BRANDING);
  const branding = normalizeBranding(raw);
  const setBranding = useCallback((b: DocumentBranding) => setRaw(normalizeBranding(b)), [setRaw]);
  return { branding, setBranding };
}
