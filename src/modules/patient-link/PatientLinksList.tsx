import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDocumentoLinks, buildPublicUrl } from "./hooks/useDocumentoLinks";
import { toast } from "@/components/ui/use-toast";
import { Copy, Ban } from "lucide-react";

export default function PatientLinksList({ id_documento }: { id_documento?: string }) {
  const { links, loading, revoke } = useDocumentoLinks(id_documento);

  if (loading) return <div className="text-sm text-muted-foreground">Carregando…</div>;
  if (links.length === 0) return <div className="text-sm text-muted-foreground">Nenhum link criado.</div>;

  return (
    <div className="space-y-2">
      {links.map((l) => {
        const expired = new Date(l.expira_em) < new Date();
        const status = l.status === "revogado" ? "revogado" : expired ? "expirado" : "ativo";
        const tone = status === "ativo" ? "bg-primary/10 text-primary"
          : status === "expirado" ? "bg-secondary text-secondary-foreground"
          : "bg-destructive/10 text-destructive";
        return (
          <Card key={l.id}>
            <CardContent className="p-3 flex items-center justify-between gap-2 text-sm">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={tone}>{status}</Badge>
                  <span className="text-xs text-muted-foreground">{l.numero_acessos} acesso(s)</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">{buildPublicUrl(l.token)}</div>
                <div className="text-xs text-muted-foreground">Expira: {new Date(l.expira_em).toLocaleDateString()}</div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={async () => { await navigator.clipboard.writeText(buildPublicUrl(l.token)); toast({ title: "Copiado" }); }}>
                  <Copy className="h-4 w-4" />
                </Button>
                {status === "ativo" && (
                  <Button size="icon" variant="ghost" onClick={() => revoke(l.id)}>
                    <Ban className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
