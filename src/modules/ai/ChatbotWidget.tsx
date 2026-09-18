// Chatbot flutuante: dúvidas sobre o app e apoio clínico com referências.
import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAIAssist } from "./hooks/useAIAssist";
import DocumentAIDialog from "./DocumentAIDialog";
import { AI_DISCLAIMER, type AIChatMessage } from "./lib/types";

const SUGESTOES = [
  "Como emito uma AIH neste app?",
  "Qual escore usar em pneumonia adquirida na comunidade?",
  "Quais condições exigem notificação em 24 horas?",
];

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const { chat, loading, error } = useAIAssist();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async (texto: string) => {
    const pergunta = texto.trim();
    if (!pergunta || loading) return;
    const next: AIChatMessage[] = [...messages, { role: "user", content: pergunta }];
    setMessages(next);
    setInput("");
    const res = await chat(next);
    if (res?.texto) {
      const refs = res.referencias?.length ? `\n\nFontes:\n${res.referencias.map((r) => `• ${r}`).join("\n")}` : "";
      setMessages([...next, { role: "assistant", content: res.texto + refs }]);
    }
    inputRef.current?.focus();
  };

  return (
    <>
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-4 z-40 h-12 w-12 rounded-full p-0 shadow-lg md:bottom-6"
          aria-label="Abrir assistente de IA"
        >
          <Bot className="h-5 w-5" />
        </Button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 z-40 flex h-[70vh] w-[min(24rem,calc(100vw-2rem))] flex-col rounded-lg border bg-card shadow-xl">
          <header className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Assistente PrescriMed</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setDocOpen(true)} title="IA para documentos">
                <FileText className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} aria-label="Fechar assistente">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Tire dúvidas sobre o app ou peça apoio na escolha de protocolos e escores.
                  As respostas trazem a diretriz de referência quando existe.
                </p>
                {SUGESTOES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="block w-full rounded-md border px-2.5 py-2 text-left text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-6 rounded-md bg-primary px-3 py-2 text-xs text-primary-foreground"
                    : "mr-2 whitespace-pre-wrap rounded-md border bg-muted/40 px-3 py-2 text-xs"
                }
              >
                {m.content}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Consultando...
              </div>
            )}
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                {error}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <footer className="border-t p-2">
            <div className="flex gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder="Escreva sua dúvida..."
                className="min-h-[38px] resize-none text-xs"
                rows={1}
              />
              <Button size="sm" onClick={() => send(input)} disabled={loading || !input.trim()} aria-label="Enviar">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">{AI_DISCLAIMER}</p>
          </footer>
        </div>
      )}

      <DocumentAIDialog open={docOpen} onOpenChange={setDocOpen} />
    </>
  );
}
