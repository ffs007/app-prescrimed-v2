// Etapa 19 — Captura de imagem (upload/câmera) e conversão para data URL base64.
import { useCallback, useState } from "react";

export function useImageCapture() {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Apenas imagens são aceitas.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Imagem maior que 8 MB.");
      return;
    }
    const reader = new FileReader();
    await new Promise<void>((resolve, reject) => {
      reader.onload = () => {
        setDataUrl(String(reader.result));
        resolve();
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }, []);

  const reset = useCallback(() => {
    setDataUrl(null);
    setError(null);
  }, []);

  return { dataUrl, error, handleFile, reset };
}
