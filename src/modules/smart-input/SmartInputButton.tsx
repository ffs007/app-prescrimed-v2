// Etapa 19 — Botão de entrada para acionar o diálogo de Entrada Inteligente.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import SmartInputDialog from "./SmartInputDialog";
import type { EntradaTipo, ExtractedItem } from "./lib/types";

interface Props {
  tipoEntrada: EntradaTipo;
  contexto?: string;
  onConfirm: (selecionados: ExtractedItem[]) => void;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default";
  label?: string;
}

export default function SmartInputButton({
  tipoEntrada, contexto, onConfirm, variant = "outline", size = "sm", label = "Entrada inteligente",
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <Sparkles className="h-4 w-4 mr-1" />
        {label}
      </Button>
      <SmartInputDialog
        open={open}
        onOpenChange={setOpen}
        tipoEntrada={tipoEntrada}
        contexto={contexto}
        onConfirm={onConfirm}
      />
    </>
  );
}
