// Etapa 19 — Captura de áudio do microfone para envio à IA.
// Implementação simples: grava webm/opus, converte para base64 e o cliente envia
// para um STT (placeholder: enviamos como contexto se fora do escopo). Aqui apenas
// expomos start/stop e o blob; o componente decide o que fazer.
import { useCallback, useRef, useState } from "react";

export function useVoiceCapture() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const start = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch (e) {
      setError((e as Error).message ?? "mic-unavailable");
    }
  }, []);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    setRecording(false);
  }, []);

  const reset = useCallback(() => {
    setAudioBlob(null);
    setError(null);
  }, []);

  return { recording, audioBlob, error, start, stop, reset };
}
