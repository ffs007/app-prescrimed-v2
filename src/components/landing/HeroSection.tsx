import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-hero-gradient-subtle">
      {/* Grain overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--ink)) 0.5px, transparent 0.5px)",
          backgroundSize: "16px 16px",
        }}
      />

      <div className="relative max-w-[1440px] mx-auto px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
        {/* LEFT — Editorial copy */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          {/* Brand signature — elegant tagline above headline */}
          <div className="mb-8 pt-2">
            <p className="font-serif italic text-lg md:text-xl text-ink-muted tracking-tight">
              Para o plantão, o pronto atendimento e a urgência.
            </p>
          </div>

          <h1 className="font-serif text-[2.25rem] sm:text-[3rem] md:text-[4rem] lg:text-[5rem] leading-[1.04] tracking-tight text-balance text-ink">
            Prescreva e gere documentos clínicos em poucos minutos.
          </h1>

          <p className="text-base md:text-lg lg:text-xl leading-relaxed text-ink-muted mt-7 max-w-[52ch] text-pretty">
            Organize medicamentos, exames e documentos em um fluxo único,
            sempre com revisão médica antes da emissão.
          </p>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-5 mt-10">
            <Link
              to="/cadastro"
              className="group bg-ink text-paper px-7 py-4 text-xs font-semibold tracking-editorial uppercase hover:bg-ink-muted transition-all flex items-center gap-3 hover:gap-4"
            >
              Começar agora
              <span className="block size-1 bg-paper rounded-full transition-all group-hover:size-1.5" />
            </Link>
            <a
              href="#modulos"
              className="font-serif italic text-lg md:text-xl text-ink hover:text-ink-muted transition-colors border-b border-transparent hover:border-ink/30 pb-0.5"
            >
              Ver como funciona
            </a>
          </div>

          <p className="mt-5 text-xs text-ink-faint flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            Fluxo desenhado para concluir a prescrição em poucos minutos.
          </p>

          {/* Authority line */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mt-16 pt-8 border-t border-ink-soft">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-editorial text-ink-faint">
                Privacidade
              </span>
              <span className="font-serif text-base text-ink">
                Minimização de dados
              </span>
            </div>
            <div className="flex flex-col gap-1.5 sm:border-l sm:border-ink-soft sm:pl-8">
              <span className="text-[10px] uppercase tracking-editorial text-ink-faint">
                Segurança clínica
              </span>
              <span className="font-serif text-base text-ink">
                Revisão médica obrigatória
              </span>
            </div>
            <div className="flex flex-col gap-1.5 sm:border-l sm:border-ink-soft sm:pl-8">
              <span className="text-[10px] uppercase tracking-editorial text-ink-faint">
                Conteúdo clínico
              </span>
              <span className="font-serif text-base text-ink">
                Curadoria rastreável
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT — Live document mockup */}
        <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
          <div className="w-full max-w-[460px] aspect-[4/5] bg-card p-7 sm:p-10 shadow-paper flex flex-col relative">
            {/* Floating live-check badge */}
            <div className="absolute -top-3 -right-3 z-10 hidden sm:flex items-center gap-1.5 bg-canon-blue text-paper text-[10px] font-semibold tracking-editorial uppercase px-3 py-1.5 rounded-full shadow-paper">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-paper opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-paper" />
              </span>
              Checagem ativa
            </div>

            {/* Document header */}
            <div className="border-b border-ink-soft pb-4 mb-6 flex justify-between items-end">
              <div>
                <div className="text-[10px] uppercase tracking-editorial text-ink-faint mb-1">
                  Paciente
                </div>
                <div className="font-serif text-lg tracking-tight text-ink">
                  Paciente de demonstração
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-editorial text-ink-faint mb-1">
                  Idade / Peso
                </div>
                <div className="text-xs tabular-nums text-ink font-medium">
                  Dados a conferir
                </div>
              </div>
            </div>

            {/* Medication 1 */}
            <div className="anim-reveal mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] uppercase tracking-editorial text-ink px-2 py-0.5 border border-ink/20">
                  Uso oral
                </span>
              </div>
              <div className="font-serif text-xl tracking-tight text-ink mb-1">
                Medicamento selecionado
              </div>
              <div className="text-[11px] text-ink-muted mb-3">
                Apresentação definida pelo médico
              </div>

              <div className="anim-reveal anim-delay-1 bg-paper-alt/60 border-l-2 border-canon-blue p-3.5 mt-2">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-ink-muted mb-2">
                  <span>Posologia editável</span>
                  <span className="font-medium">Revisão pendente</span>
                </div>
                <div className="text-[13px] text-ink leading-relaxed">
                  Conferir dose, via, frequência e duração antes de emitir.
                </div>
              </div>
            </div>

            {/* Medication 2 */}
            <div className="anim-reveal anim-delay-2 mb-auto pt-4 border-t border-ink-faint">
              <div className="font-serif text-xl tracking-tight text-ink mb-1">
                Exame ou orientação
              </div>
              <div className="text-[11px] text-ink-muted mb-3">
                Item complementar do atendimento
              </div>
              <div className="anim-reveal anim-delay-3 border-l-2 border-ink/20 pl-3 py-1 text-[13px] text-ink leading-relaxed">
                Conteúdo editável e sujeito à conferência médica.
              </div>
            </div>

            {/* Footer action */}
            <div className="anim-reveal anim-delay-4 pt-6 border-t border-ink-soft mt-6">
              <div className="w-full bg-ink text-paper text-center py-3.5 text-[10px] font-semibold tracking-editorial uppercase">
                Revisar & gerar documento
              </div>
              <div className="text-center mt-2.5 text-[10px] uppercase tracking-editorial text-ink-faint">
                Assinatura pelo médico
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
