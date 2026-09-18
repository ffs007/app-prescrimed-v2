import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Termo = { versao_termo: string; conteudo: string; ativo: boolean };

export default function BetaTermsGate() {
  const [termo, setTermo] = useState<Termo | null>(null);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      setUserId(userData.user.id);
      const { data: termos } = await supabase
        .from("lancamento_termos_beta" as any)
        .select("versao_termo, conteudo, ativo")
        .eq("ativo", true)
        .limit(1);
      const t = (termos as any)?.[0];
      if (!t) return;
      const { data: aceite } = await supabase
        .from("lancamento_termos_aceites" as any)
        .select("id")
        .eq("usuario_id", userData.user.id)
        .eq("versao_termo", t.versao_termo)
        .maybeSingle();
      if (!aceite) {
        setTermo(t);
        setOpen(true);
      }
    })();
  }, []);

  const aceitar = async () => {
    if (!termo || !userId) return;
    setSaving(true);
    const { error } = await supabase.from("lancamento_termos_aceites" as any).insert({
      usuario_id: userId,
      versao_termo: termo.versao_termo,
    });
    setSaving(false);
    // 23505 = aceite já registrado antes; considerar sucesso
    if (error && (error as any).code !== "23505") {
      toast.error("Não foi possível registrar aceite agora.");
      return;
    }
    setOpen(false);
  };

  if (!termo) return null;

  return (
    <Dialog open={open} onOpenChange={() => { /* obrigatório */ }}>
      <DialogContent className="max-w-lg" onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Termos de Uso Beta</DialogTitle>
          <DialogDescription>Versão {termo.versao_termo}</DialogDescription>
        </DialogHeader>
        <div className="text-sm leading-relaxed max-h-[50vh] overflow-y-auto whitespace-pre-wrap">
          {termo.conteudo}
        </div>
        <DialogFooter>
          <Button onClick={aceitar} disabled={saving}>{saving ? "Registrando…" : "Li e concordo"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
