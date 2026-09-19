import {
  Pill,
  ListChecks,
  ShieldAlert,
  FileSignature,
  Layers,
  Clock,
} from "lucide-react";

const FeaturesSection = () => {
  return (
    <section id="funcionalidades" className="py-20 md:py-32 scroll-mt-20">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-16">
        <div className="max-w-2xl mb-16 lg:mb-20">
          <p className="text-[11px] font-medium tracking-editorial uppercase text-ink-muted mb-6">
            O que está dentro
          </p>
          <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl text-ink leading-[1.05] tracking-tight text-balance">
            Profundidade clínica em
            <span className="italic text-canon-blue"> cada detalhe</span> da plataforma.
          </h2>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-px bg-ink-soft border border-ink-soft">
          {/* Main workflow feature */}
          <div className="md:col-span-4 md:row-span-2 bg-card p-8 lg:p-12 flex flex-col">
            <ListChecks className="h-6 w-6 text-canon-blue mb-6" />
            <h3 className="font-serif text-3xl md:text-4xl text-ink tracking-tight leading-tight mb-4">
              Fluxo estruturado para prescrever e revisar.
            </h3>
            <p className="text-sm md:text-base text-ink-muted leading-relaxed max-w-[48ch] mb-8">
              Dados do paciente, itens da prescrição e documentos ficam no mesmo
              fluxo, editáveis até a conferência final pelo médico.
            </p>
            <div className="mt-auto pt-6 border-t border-ink-soft flex items-end justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-editorial text-ink-faint mb-1.5">
                  Etapa atual
                </div>
                <div className="font-serif text-base text-ink/80">
                  Paciente e <span className="text-ink font-medium">contexto</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-serif text-lg text-ink tabular-nums">
                  Itens <span className="text-canon-blue mx-2">→</span> <span className="text-canon-blue font-medium">revisão</span>
                </div>
                <div className="text-[10px] uppercase tracking-editorial text-ink-faint mt-0.5">
                  antes da emissão
                </div>
              </div>
            </div>
          </div>

          {/* Safety alerts */}
          <div className="md:col-span-2 bg-card p-8">
            <ShieldAlert className="h-6 w-6 text-canon-blue mb-5" />
            <h3 className="font-serif text-xl text-ink leading-tight mb-2">
              Alertas de segurança
            </h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Sinalização de alergias e condições informadas antes da impressão,
              sem substituir a revisão do médico.
            </p>
          </div>

          {/* Templates */}
          <div className="md:col-span-2 bg-card p-8">
            <Layers className="h-6 w-6 text-canon-blue mb-5" />
            <h3 className="font-serif text-xl text-ink leading-tight mb-2">
              Protocolos próprios
            </h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Salve seus modelos clínicos e reutilize em um clique no plantão.
            </p>
          </div>

          {/* Standard CFM */}
          <div className="md:col-span-2 bg-card p-8">
            <FileSignature className="h-6 w-6 text-canon-blue mb-5" />
            <h3 className="font-serif text-xl text-ink leading-tight mb-2">
              Documento revisável
            </h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Receitas e documentos em formato A4/A5, prontos para revisão,
              impressão ou geração de PDF.
            </p>
          </div>

          {/* Pediatric */}
          <div className="md:col-span-2 bg-card p-8">
            <Pill className="h-6 w-6 text-canon-blue mb-5" />
            <h3 className="font-serif text-xl text-ink leading-tight mb-2">
              Apoio pediátrico
            </h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Cálculo por peso nos itens habilitados, com volume e posologia
              sempre sujeitos à conferência médica.
            </p>
          </div>

          {/* Speed */}
          <div className="md:col-span-2 bg-card p-8">
            <Clock className="h-6 w-6 text-canon-blue mb-5" />
            <h3 className="font-serif text-xl text-ink leading-tight mb-2">
              Velocidade real
            </h3>
            <p className="text-sm text-ink-muted leading-relaxed">
              Atalhos de teclado, busca instantânea e fluxo desenhado para
              plantão e ambulatório.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
