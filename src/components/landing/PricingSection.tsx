import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { PLANS, PREMIUM_FEATURES } from "@/modules/billing/lib/plans";

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
            Crie sua conta gratuitamente e use os recursos básicos. Assine o Pro
            quando quiser liberar os módulos avançados.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-ink-soft border border-ink-soft">
          {PLANS.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative flex flex-col p-8 lg:p-10 ${
                index === 1 ? "bg-card" : "bg-paper-alt/30"
              }`}
            >
              {plan.destaque && (
                <div className="absolute top-0 left-0 right-0 bg-ink text-paper text-center py-2 text-[10px] font-semibold tracking-editorial uppercase">
                  {plan.destaque}
                </div>
              )}

              <div className={plan.destaque ? "mt-8" : ""}>
                <div className="text-[10px] uppercase tracking-editorial text-ink-faint mb-3">
                  {plan.nome}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-5xl text-ink tabular-nums tracking-tight leading-none">
                    {plan.preco}
                  </span>
                </div>
                <div className="mt-2 text-sm text-ink-muted">{plan.periodo}</div>
              </div>

              <ul className="mt-6 space-y-2 text-sm text-ink-muted">
                {plan.detalhes.map((detail) => <li key={detail}>{detail}</li>)}
              </ul>

              <ul className="mt-8 space-y-3 flex-1">
                {PREMIUM_FEATURES.map((f) => (
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
                  index === 1
                    ? "bg-ink text-paper hover:bg-ink-muted"
                    : "border border-ink text-ink hover:bg-ink hover:text-paper"
                }`}
              >
                Criar conta grátis
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
