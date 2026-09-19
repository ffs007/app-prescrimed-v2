const painPoints = [
  {
    before: "Trocar de aba para gerar atestado, exame, encaminhamento",
    after: "Todos os documentos no mesmo fluxo do paciente",
  },
  {
    before: "Recalcular dose pediátrica e abrir bulário no meio do caso",
    after: "Cálculo assistido nos itens habilitados, com revisão antes da emissão",
  },
  {
    before: "Receita e atestado digitados no Word, sem padrão visual",
    after: "Documento clínico revisável, pronto para imprimir ou gerar em PDF",
  },
  {
    before: "Refazer dados do paciente em cada documento emitido",
    after: "Paciente uma vez. Receita, exame, atestado e relatório saem juntos",
  },
];

const PainPointsSection = () => {
  return (
    <section id="metodologia" className="py-20 md:py-32 scroll-mt-20">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-16">
        <div className="max-w-3xl mb-16 lg:mb-20">
          <p className="text-[11px] font-medium tracking-editorial uppercase text-ink-muted mb-6">
            O problema real
          </p>
          <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl text-ink leading-[1.05] tracking-tight text-balance">
            Todo atendimento carrega um
            <span className="italic text-canon-blue"> atrito invisível.</span>
          </h2>
          <p className="mt-6 text-base md:text-lg text-ink-muted leading-relaxed max-w-[58ch]">
            Não é apenas uma questão de velocidade. É a soma de pequenas
            decisões repetidas que cansam, abrem espaço para erro e tiram o
            médico do raciocínio clínico.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ink-soft border border-ink-soft">
          <div className="p-8 lg:p-12 bg-paper-alt/50">
            <div className="text-[10px] uppercase tracking-editorial text-ink-faint mb-6">
              Antes
            </div>
            <ul className="space-y-5">
              {painPoints.map((p) => (
                <li
                  key={p.before}
                  className="font-serif text-lg md:text-xl text-ink-muted leading-snug"
                >
                  {p.before}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-8 lg:p-12 bg-card">
            <div className="text-[10px] uppercase tracking-editorial text-canon-blue mb-6">
              Com PrescriMed+
            </div>
            <ul className="space-y-5">
              {painPoints.map((p) => (
                <li
                  key={p.after}
                  className="font-serif text-lg md:text-xl text-ink leading-snug"
                >
                  {p.after}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PainPointsSection;
