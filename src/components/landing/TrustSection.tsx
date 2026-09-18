const items = [
  {
    label: "Conformidade legal",
    value: "LGPD & CFM",
    detail: "Aderência estrita à LGPD e formato de documento conforme padrão CFM.",
  },
  {
    label: "Assinatura digital",
    value: "ICP-Brasil",
    detail: "Compatível com certificado digital para validade jurídica plena do documento.",
  },
  {
    label: "Base farmacológica",
    value: "Anvisa & DEF",
    detail: "Doses, apresentações e diretrizes a partir de fontes oficiais brasileiras.",
  },
];

const TrustSection = () => {
  return (
    <section className="py-20 md:py-24 border-y border-ink-soft bg-paper-alt/40">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-16">
        <div className="max-w-2xl mb-14">
          <p className="text-[11px] font-medium tracking-editorial uppercase text-ink-muted mb-6">
            Segurança e conformidade
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-ink leading-[1.05] tracking-tight text-balance">
            Construída sobre as bases que
            <span className="italic text-canon-blue"> a prática médica exige.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6">
          {items.map((it, i) => (
            <div
              key={it.label}
              className={`flex flex-col items-start ${
                i > 0 ? "sm:border-l sm:border-ink-soft sm:pl-8" : ""
              }`}
            >
              <div className="text-[10px] uppercase tracking-editorial text-ink-faint mb-3">
                {it.label}
              </div>
              <div className="font-serif text-2xl md:text-3xl text-ink leading-tight tracking-tight">
                {it.value}
              </div>
              <p className="mt-4 text-sm text-ink-muted leading-relaxed max-w-[32ch]">
                {it.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
