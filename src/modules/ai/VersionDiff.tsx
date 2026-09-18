// Comparação visual entre a versão anterior e a nova de um protocolo.
import { diffLines, diffStats } from "./lib/diff";

interface Props {
  anterior: string;
  novo: string;
}

export default function VersionDiff({ anterior, novo }: Props) {
  const lines = diffLines(anterior, novo);
  const stats = diffStats(lines);

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-3 border-b px-3 py-1.5 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">Comparação de versões</span>
        <span>{stats.adicionadas} linha(s) nova(s)</span>
        <span>{stats.removidas} linha(s) retirada(s)</span>
      </div>
      <pre className="max-h-72 overflow-auto p-2 text-[11px] leading-relaxed">
        {lines.map((l, i) => (
          <div
            key={i}
            className={
              l.kind === "adicionada"
                ? "bg-primary/10 px-1 text-foreground"
                : l.kind === "removida"
                ? "bg-destructive/10 px-1 text-muted-foreground line-through"
                : "px-1 text-muted-foreground"
            }
          >
            <span className="mr-1 select-none opacity-60">
              {l.kind === "adicionada" ? "+" : l.kind === "removida" ? "−" : " "}
            </span>
            {l.text || " "}
          </div>
        ))}
      </pre>
    </div>
  );
}
