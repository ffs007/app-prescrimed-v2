import { Link } from "react-router-dom";

const testimonials = [
  {
    quote:
      "Ganhei velocidade sem perder segurança. Hoje prescrevo com muito menos atrito durante o plantão e isso muda completamente como eu termino o turno.",
    name: "Médico clínico — pronto atendimento",
    context: "Validação fechada · SP",
  },
  {
    quote:
      "A interface não me força a sair do raciocínio clínico. Eu monto a receita enquanto ainda estou pensando no caso.",
    name: "Médica generalista — atenção primária",
    context: "Validação fechada · MG",
  },
  {
    quote:
      "Como recém-formado, me sinto mais confiante para revisar dose pediátrica. O alerta de contraindicação já me poupou de dois erros.",
    name: "Médico recém-formado — urgência",
    context: "Validação fechada · RS",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 md:py-32 bg-paper-alt/40 border-y border-ink-soft">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-16">
        {/* Credibility block */}
        <div className="max-w-3xl mb-12 pb-10 border-b border-ink-soft">
          <p className="font-serif text-xl md:text-2xl italic text-ink leading-relaxed">
            Criada a partir da rotina médica real.
          </p>
          <p className="mt-3 text-sm md:text-base text-ink-muted leading-relaxed max-w-[60ch]">
            A plataforma foi desenhada com visão médica e refinada com a escuta de profissionais 
            que conhecem, na prática, os atritos do atendimento.
          </p>
        </div>

        <div className="max-w-2xl mb-16 lg:mb-20">
          <p className="text-[11px] font-medium tracking-editorial uppercase text-ink-muted mb-6">
            Em validação fechada
          </p>
          <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl text-ink leading-[1.05] tracking-tight text-balance">
            O que dizem os médicos que já
            <span className="italic text-canon-blue"> usam no atendimento.</span>
          </h2>
          <p className="mt-6 text-sm md:text-base text-ink-muted leading-relaxed max-w-[55ch]">
            Estamos refinando a plataforma com um grupo fechado de médicos
            antes da abertura pública. Identidades preservadas a pedido dos parceiros.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {testimonials.map((t, i) => (
            <figure
              key={i}
              className="flex flex-col bg-card p-8 lg:p-10 shadow-paper border border-ink-soft"
            >
              <div className="font-serif text-5xl text-canon-blue/30 leading-none mb-4">
                &ldquo;
              </div>
              <blockquote className="font-serif text-lg lg:text-xl text-ink leading-snug flex-1">
                {t.quote}
              </blockquote>
              <figcaption className="mt-8 pt-6 border-t border-ink-soft">
                <div className="text-sm font-medium text-ink">{t.name}</div>
                <div className="text-[11px] uppercase tracking-editorial text-ink-faint mt-1">
                  {t.context}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/cadastro"
            className="font-serif italic text-base md:text-lg text-ink hover:text-ink-muted transition-colors border-b border-ink/20 hover:border-ink/50 pb-0.5"
          >
            Quer participar da próxima leva de validação? →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
