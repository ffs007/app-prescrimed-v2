import {
  Pill,
  FlaskConical,
  Send,
  FileCheck2,
  CalendarCheck,
  ClipboardList,
  HeartPulse,
  Stethoscope,
  CheckCircle2,
  Clock,
} from "lucide-react";

type ModuleStatus = "disponivel" | "em-breve";

interface ModuleItem {
  icon: typeof Pill;
  name: string;
  desc: string;
  pill: string;
  status: ModuleStatus;
}

const modules: ModuleItem[] = [
  {
    icon: Pill,
    name: "Receita médica",
    desc: "Comum, especial e controle. Cálculo pediátrico e checagem de interações.",
    pill: "Núcleo clínico",
    status: "disponivel",
  },
  {
    icon: FlaskConical,
    name: "Solicitação de exames",
    desc: "Laboratoriais e de imagem com justificativa estruturada e CID opcional.",
    pill: "Diagnóstico",
    status: "disponivel",
  },
  {
    icon: Send,
    name: "Encaminhamento",
    desc: "Especialidade, motivo, hipótese e resumo do caso em um clique.",
    pill: "Continuidade",
    status: "disponivel",
  },
  {
    icon: FileCheck2,
    name: "Atestado",
    desc: "Período, CID opcional e observações. Modelo padronizado e profissional.",
    pill: "Afastamento",
    status: "disponivel",
  },
  {
    icon: CalendarCheck,
    name: "Declaração de comparecimento",
    desc: "Emissão em segundos, com data, horário e acompanhante quando aplicável.",
    pill: "Comprovação",
    status: "em-breve",
  },
  {
    icon: ClipboardList,
    name: "Relatório de atendimento",
    desc: "Anamnese, hipótese, conduta e plano em formato clínico estruturado.",
    pill: "Documentação",
    status: "em-breve",
  },
  {
    icon: HeartPulse,
    name: "Orientações & retorno",
    desc: "Sinais de alarme, medidas não farmacológicas e plano de retorno claros.",
    pill: "Cuidado contínuo",
    status: "em-breve",
  },
  {
    icon: Stethoscope,
    name: "Solicitação de procedimento",
    desc: "Curativos, fisioterapia, nebulização e condutas complementares ao tratamento.",
    pill: "Procedimentos",
    status: "em-breve",
  },
];

const StatusBadge = ({ status }: { status: ModuleStatus }) =>
  status === "disponivel" ? (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-editorial text-canon-blue">
      <CheckCircle2 className="h-3 w-3" />
      Disponível
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-editorial text-ink-faint">
      <Clock className="h-3 w-3" />
      Em breve
    </span>
  );

const ModulesSection = () => {
  return (
    <section
      id="modulos"
      className="py-20 md:py-32 bg-paper-alt/40 border-y border-ink-soft scroll-mt-20"
    >
      <div className="max-w-[1200px] mx-auto px-6 lg:px-16">
        <div className="max-w-3xl mb-14 lg:mb-20">
          <p className="text-[11px] font-medium tracking-editorial uppercase text-ink-muted mb-6">
            Central de emissão clínica
          </p>
          <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl text-ink leading-[1.05] tracking-tight text-balance">
            Não é só receita. É todo o
            <span className="italic text-canon-blue"> documento clínico</span>{" "}
            do atendimento.
          </h2>
          <p className="mt-6 text-base md:text-lg text-ink-muted leading-relaxed max-w-[58ch]">
            Oito módulos pensados para a rotina real — ambulatório, plantão e
            urgência. Um único fluxo: paciente, ação, documento. Sem trocar
            de sistema, sem refazer dados.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-ink-soft border border-ink-soft">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <article
                key={m.name}
                className="group bg-card p-7 lg:p-8 flex flex-col transition-colors hover:bg-paper-alt/40"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="size-10 border border-ink-soft flex items-center justify-center transition-colors group-hover:border-canon-blue/40 group-hover:bg-canon-blue/5">
                    <Icon className="h-5 w-5 text-canon-blue" />
                  </div>
                  <span className="text-[10px] uppercase tracking-editorial text-ink-faint">
                    {m.pill}
                  </span>
                </div>
                <h3 className="font-serif text-xl md:text-2xl text-ink tracking-tight leading-snug mb-3">
                  {m.name}
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed flex-1">
                  {m.desc}
                </p>
                <div className="mt-5 pt-4 border-t border-ink-soft">
                  <StatusBadge status={m.status} />
                </div>
              </article>
            );
          })}

          {/* Closing tile */}
          <article className="bg-ink text-paper p-7 lg:p-8 flex flex-col justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-editorial text-paper/60 mb-6">
                Próxima fronteira
              </div>
              <h3 className="font-serif text-xl md:text-2xl tracking-tight leading-snug mb-3">
                Prontuário leve & assinatura digital
              </h3>
            </div>
            <p className="text-sm text-paper/70 leading-relaxed mt-6">
              Integração com provedor ICP-Brasil planejada. Hoje, o fluxo prioriza revisão, PDF e assinatura pelo médico.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
};

export default ModulesSection;
