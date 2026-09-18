import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Mensal",
    price: "15",
    period: "por mês",
    description: "Para experimentar com flexibilidade total.",
    popular: false,
    savings: null,
  },
  {
    name: "Semestral",
    price: "75",
    period: "a cada 6 meses",
    description: "O plano mais escolhido pelos médicos parceiros.",
    popular: true,
    savings: "Equivale a R$ 12,50 por mês",
  },
  {
    name: "Anual",
    price: "150",
    period: "por ano",
    description: "Melhor custo por mês, sem renovação automática.",
    popular: false,
    savings: "Equivale a R$ 12,50 por mês",
  },
];

const features = [
  "Prescrições ilimitadas",
  "Cálculo pediátrico automático",
  "Alertas de interação e contraindicação",
  "Protocolos e modelos próprios",
  "Receita comum, especial e controle",
  "Acesso em qualquer dispositivo",
];

const PricingSection = () => {
  return (
    <section id="planos" className="py-20 md:py-32 scroll-mt-20">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-16">
        <div className="max-w-2xl mb-16 lg:mb-20">
          <p className="text-[11px] font-medium tracking-editorial uppercase text-ink-muted mb-6">
            Investimento
          </p>
          <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl text-ink leading-[1.05] tracking-tight text-balance">
            Um valor justo para uma
            <span className="italic text-canon-blue"> ferramenta de uso diário.</span>
          </h2>
          <p className="mt-6 text-base md:text-lg text-ink-muted leading-relaxed max-w-[55ch]">
            Sete dias de teste em qualquer plano, sem cartão de crédito.
            Sem renovação automática — você decide se continua.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-ink-soft border border-ink-soft">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col p-8 lg:p-10 ${
                plan.popular ? "bg-card" : "bg-paper-alt/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-ink text-paper text-center py-2 text-[10px] font-semibold tracking-editorial uppercase">
                  Mais escolhido
                </div>
              )}

              <div className={plan.popular ? "mt-8" : ""}>
                <div className="text-[10px] uppercase tracking-editorial text-ink-faint mb-3">
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-serif text-ink">R$</span>
                  <span className="font-serif text-6xl text-ink tabular-nums tracking-tight leading-none">
                    {plan.price}
                  </span>
                </div>
                <div className="mt-2 text-sm text-ink-muted">{plan.period}</div>
                {plan.savings && (
                  <div className="mt-2 text-[11px] text-canon-blue font-medium">
                    {plan.savings}
                  </div>
                )}
              </div>

              <p className="mt-6 text-sm text-ink-muted leading-relaxed">
                {plan.description}
              </p>

              <ul className="mt-8 space-y-3 flex-1">
                {features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 text-sm text-ink leading-relaxed"
                  >
                    <Check className="h-4 w-4 text-canon-blue shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/cadastro"
                className={`mt-10 block text-center px-6 py-3.5 text-[11px] font-semibold tracking-editorial uppercase transition-colors ${
                  plan.popular
                    ? "bg-ink text-paper hover:bg-ink-muted"
                    : "border border-ink text-ink hover:bg-ink hover:text-paper"
                }`}
              >
                Teste grátis por 7 dias
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
