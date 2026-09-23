import { toast } from "sonner";

const notified = new Set<string>();

/**
 * Registra o erro no console e, quando `userMessage` é informado, avisa o usuário.
 * O aviso aparece uma vez por sessão para cada mensagem, evitando enxurrada de toasts
 * quando uma escrita em segundo plano falha repetidamente.
 */
export function reportError(context: string, error: unknown, userMessage?: string): void {
  console.error(`[${context}]`, error);
  if (userMessage && !notified.has(userMessage)) {
    notified.add(userMessage);
    toast.error(userMessage);
  }
}
