import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "É só receita ou emite outros documentos do atendimento?",
    a: "É uma central de emissão clínica completa: receita (comum, especial e controle), solicitação de exames, encaminhamento, atestado, declaração de comparecimento, relatório de atendimento e orientações com plano de retorno — todos no mesmo fluxo do paciente.",
  },
  {
    q: "Funciona bem no celular durante o atendimento?",
    a: "Sim. A interface é construída mobile-first para plantão e ambulatório: toques grandes, fluxo em etapas, preview do documento em drawer e sem campos espremidos.",
  },
  {
    q: "Serve para recém-formado e médico experiente?",
    a: "Sim. O recém-formado ganha apoio em dose, contraindicação e padrão de documento. O médico experiente ganha velocidade — atalhos, modelos próprios e busca instantânea para o atendimento real.",
  },
  {
    q: "Quem é responsável legalmente pelos documentos emitidos?",
    a: "Você. O PrescriMed+ é ferramenta de apoio à decisão clínica — equivalente a calculadora e bulário digital. A responsabilidade legal pelo documento emitido é, em qualquer cenário, do médico assinante. Por isso o fluxo sempre exige revisão antes da emissão.",
  },
  {
    q: "De onde vêm as doses e diretrizes utilizadas?",
    a: "A base reúne referências clínicas e status de revisão. Sugestões devem ser conferidas pelo médico antes da emissão e não substituem a fonte oficial nem o julgamento clínico.",
  },
  {
    q: "Meus dados e dos meus pacientes ficam seguros?",
    a: "O produto aplica minimização de dados e controles de acesso orientados à LGPD. Registre apenas os dados necessários ao atendimento e proteja suas credenciais.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Os planos têm renovação automática e podem ser cancelados para impedir a próxima cobrança, conforme as condições apresentadas no checkout.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-20 md:py-32 bg-paper-alt/40 border-t border-ink-soft scroll-mt-20">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-4">
          <p className="text-[11px] font-medium tracking-editorial uppercase text-ink-muted mb-6">
            Perguntas
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-ink leading-[1.05] tracking-tight">
            Antes de
            <span className="italic text-canon-blue"> começar.</span>
          </h2>
          <p className="mt-6 text-sm text-ink-muted leading-relaxed">
            As respostas honestas para as perguntas que todo médico faz antes
            de confiar uma ferramenta clínica.
          </p>
        </div>

        <div className="lg:col-span-8">
          <Accordion type="single" collapsible className="border-t border-ink-soft">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border-b border-ink-soft"
              >
                <AccordionTrigger className="text-left font-serif text-lg md:text-xl text-ink hover:text-canon-blue transition-colors py-6">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-ink-muted leading-relaxed text-sm md:text-base pb-6 max-w-[60ch]">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
