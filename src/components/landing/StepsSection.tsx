const steps = [
  {
    number: "01",
    title: "Paciente & contexto",
    description:
      "Nome, idade, peso, alergias. Marque gestante, pediátrico ou contexto clínico — uma única vez no atendimento.",
  },
  {
    number: "02",
    title: "Escolha a ação",
    description:
      "Receita, exames, encaminhamento, atestado, declaração, relatório ou orientações. A interface se adapta à ação.",
  },
  {
    number: "03",
    title: "Revise e emita",
    description:
      "Confira cada item e ajuste o documento. Depois, imprima em A4/A5 ou gere o PDF para assinatura pelo médico.",
  },
];

const StepsSection = () => {
  return (
    <section className="py-20 md:py-32 bg-paper-alt/40 border-y border-ink-soft">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-16">
        <div className="max-w-2xl mb-16 lg:mb-20">
          <p className="text-[11px] font-medium tracking-editorial uppercase text-ink-muted mb-6">
            Como funciona
          </p>
          <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl text-ink leading-[1.05] tracking-tight text-balance">
            Três passos. Pensado para a
            <span className="italic text-canon-blue"> primeira utilização.</span>
          </h2>
          <p className="mt-6 text-base md:text-lg text-ink-muted leading-relaxed max-w-[55ch]">
            Um fluxo direto, sem treinamento prévio — feito para encaixar na
            cadência natural do atendimento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`flex flex-col ${
                i > 0 ? "md:border-l md:border-ink-soft md:pl-8" : ""
              }`}
            >
              <div className="font-serif text-7xl md:text-8xl text-canon-blue/20 tabular-nums leading-none mb-6">
                {step.number}
              </div>
              <h3 className="font-serif text-2xl md:text-3xl text-ink tracking-tight leading-snug mb-4">
                {step.title}
              </h3>
              <p className="text-sm md:text-base text-ink-muted leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StepsSection;
