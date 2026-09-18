import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Printer, Pencil, X, CalendarDays, Heart, Baby, CheckCircle2, AlertTriangle, FileText,
} from "lucide-react";
import type { Medication, SelectedMed, ClinicInfo } from "../types/prescription";
import type { DocumentAction } from "./ActionGrid";
import type { CareContext } from "./ContextHeader";
import type { AtestadoData } from "./AtestadoForm";
import type { ExamesData } from "./ExamesForm";
import type { EncaminhamentoData } from "./EncaminhamentoForm";
import type { DeclaracaoData } from "./DeclaracaoForm";
import type { RelatorioData } from "./RelatorioForm";
import type { OrientacoesData } from "./OrientacoesForm";
import { hasSpecialPrescription as checkHasSpecial } from "../services/medicationSafety";
import StructuredDocumentBody from "./StructuredDocumentBody";
import {
  buildSections,
  structuredLead,
  AIH_FIELDS,
  APAC_FIELDS,
  NOTIFICACAO_FIELDS,
  type StructuredData,
} from "../services/regulatoryForms";
import { PRESCRIPTION_TYPE_INFO } from "@/data/medications";

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

interface Props {
  // Patient
  patientName: string;
  isPediatric: boolean;
  isPregnant: boolean;
  ageValue: string;
  ageUnit: string;
  weight: string;
  // Document
  context: CareContext;
  action: DocumentAction;
  // Receita
  selected: SelectedMed[];
  allMedications: Medication[];
  onUpdateMedText: (id: number, text: string) => void;
  onRemoveMed: (id: number) => void;
  // Atestado
  atestado: AtestadoData;
  // Exames
  exames: ExamesData;
  // Encaminhamento
  encaminhamento: EncaminhamentoData;
  declaracao: DeclaracaoData;
  relatorio: RelatorioData;
  orientacoes: OrientacoesData;
  // Documentos regulatórios
  aih: StructuredData;
  apac: StructuredData;
  notificacao: StructuredData;
  // Clinic
  clinicInfo: ClinicInfo;
  // Actions
  onPrint: () => void;
  onBackToEdit?: () => void; // Mobile only
  showBackToEdit?: boolean;
  onClear?: () => void;
  /** Esconde a action bar interna (usado quando o preview é embutido em ReviewScreen). */
  hideActions?: boolean;
}

const DOC_TITLES: Record<DocumentAction, string> = {
  receita: "Receita médica",
  atestado: "Atestado médico",
  exames: "Solicitação de exames",
  encaminhamento: "Encaminhamento",
  declaracao: "Declaração de comparecimento",
  relatorio: "Relatório de atendimento",
  orientacoes: "Orientações & retorno",
  procedimento: "Solicitação de procedimento",
  aih: "Laudo de internação (AIH)",
  apac: "Laudo APAC",
  notificacao: "Notificação compulsória",
};

const CONTEXT_LABEL: Record<CareContext, string> = {
  hospitalar: "Hospitalar",
  urgencia: "Urgência",
};

const DocumentPreview = ({
  patientName, isPediatric, isPregnant, ageValue, ageUnit, weight,
  context, action, selected, allMedications, onUpdateMedText, onRemoveMed,
  atestado, exames, encaminhamento, declaracao, relatorio, orientacoes,
  aih, apac, notificacao,
  clinicInfo, onPrint, onBackToEdit, showBackToEdit, onClear, hideActions,
}: Props) => {
  const docTitle = DOC_TITLES[action];
  const hasClinicInfo = clinicInfo.clinicName || clinicInfo.doctorName;
  const currentDate = new Intl.DateTimeFormat("pt-BR").format(new Date());
  const hasSpecialPrescription = checkHasSpecial(selected, allMedications);
  const FUNCTIONAL_ACTIONS: DocumentAction[] = ["receita", "atestado", "exames", "encaminhamento", "declaracao", "relatorio", "orientacoes", "procedimento", "aih", "apac", "notificacao"];
  const structuredKind = action === "aih" || action === "apac" || action === "notificacao" ? action : null;
  const structuredFields = action === "aih" ? AIH_FIELDS : action === "apac" ? APAC_FIELDS : NOTIFICACAO_FIELDS;
  const structuredData = action === "aih" ? aih : action === "apac" ? apac : notificacao;
  const comingSoon = !FUNCTIONAL_ACTIONS.includes(action);

  const formatDateBR = (iso: string) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
  };

  const getTypeBadge = (med: Medication) => {
    const type = med.prescriptionType || "comum";
    if (type === "comum") return null;
    const info = PRESCRIPTION_TYPE_INFO[type];
    if (!info) return null;
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${info.color}`}>
        {info.label}
      </span>
    );
  };

  return (
    <div className="overflow-hidden rounded-lg border border-ink-soft bg-card shadow-paper flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-ink-soft bg-paper-alt/60 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
              {CONTEXT_LABEL[context]} · documento
            </div>
            <div className="mt-0.5 font-serif text-base font-semibold text-ink truncate">
              {docTitle}
            </div>
          </div>
          {showBackToEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToEdit}
              className="h-9 gap-2 shrink-0"
            >
              <Pencil className="h-3.5 w-3.5" /> Editar
            </Button>
          )}
        </div>
      </div>

      {/* Content scroll */}
      <div className="flex-1 overflow-auto">
        <div className="space-y-5 p-5">
          {/* Clinic + patient */}
          <div className="rounded-lg border border-ink-soft bg-paper-alt/40 p-4">
            {hasClinicInfo ? (
              <div className="text-center pb-3 mb-3 border-b border-ink-soft">
                {clinicInfo.clinicName && (
                  <p className="font-serif font-semibold text-ink text-base">{clinicInfo.clinicName}</p>
                )}
                {clinicInfo.doctorName && (
                  <p className="text-xs text-ink-muted mt-0.5">
                    {clinicInfo.doctorName}{clinicInfo.crm && ` — ${clinicInfo.crm}`}
                  </p>
                )}
                {clinicInfo.specialty && <p className="text-[11px] text-ink-faint">{clinicInfo.specialty}</p>}
              </div>
            ) : (
              <div className="text-center pb-3 mb-3 border-b border-ink-soft">
                <p className="text-[11px] italic text-ink-faint">
                  Configure os dados da unidade em Configurações
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">Paciente</div>
                <div className="mt-1 break-words text-sm font-semibold text-ink">
                  {patientName || "Nome do paciente"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
                  <CalendarDays className="h-3 w-3" /> Data
                </div>
                <div className="mt-1 text-sm font-semibold text-ink">{currentDate}</div>
              </div>
              {isPediatric && (
                <>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">Idade</div>
                    <div className="mt-1 text-sm text-ink-muted">
                      {ageValue ? `${ageValue} ${ageUnit}` : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">Peso</div>
                    <div className="mt-1 text-sm text-ink-muted">
                      {weight ? `${weight} kg` : "—"}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {isPregnant && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-medium text-destructive">
                  <Heart className="h-3 w-3" /> Gestante
                </span>
              )}
              {isPediatric && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-canon-blue/10 px-2.5 py-1 text-[10px] font-medium text-canon-blue">
                  <Baby className="h-3 w-3" /> Pediátrico
                </span>
              )}
              {!isPregnant && !isPediatric && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-paper-alt px-2.5 py-1 text-[10px] font-medium text-ink-muted">
                  <CheckCircle2 className="h-3 w-3" /> Contexto padrão
                </span>
              )}
            </div>
          </div>

          {/* Coming soon */}
          {comingSoon && (
            <div className="rounded-lg border border-dashed border-ink-soft bg-paper-alt/30 px-4 py-12 text-center">
              <FileText className="h-8 w-8 mx-auto text-ink-faint mb-3" />
              <div className="font-serif text-base font-semibold text-ink">
                Preview disponível em breve
              </div>
              <p className="mt-2 text-xs text-ink-muted max-w-[40ch] mx-auto">
                Esse módulo está no roadmap. O preview do documento será habilitado quando o formulário ficar pronto.
              </p>
            </div>
          )}

          {/* Receita */}
          {action === "receita" && (
            <div className="rounded-lg border border-ink-soft p-4">
              <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
                Prescrição
              </div>
              {selected.length === 0 ? (
                <div className="mt-4 text-center py-8 text-xs text-ink-faint italic">
                  Selecione uma patologia para carregar medicações
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {hasSpecialPrescription && (
                    <div className="rounded border border-destructive/30 bg-destructive/5 p-2.5 text-[11px] text-destructive">
                      <p className="font-bold mb-0.5">⚠ Receitas Especiais Necessárias</p>
                      <p>Serão separadas automaticamente na impressão.</p>
                    </div>
                  )}
                  {selected.map((med, i) => {
                    const medData = allMedications.find((m) => m.id === med.id);
                    const badge = medData ? getTypeBadge(medData) : null;
                    return (
                      <div key={med.id} className="group flex gap-3">
                        <span className="text-xs font-bold text-canon-blue mt-1 shrink-0">{i + 1})</span>
                        <div className="flex-1 min-w-0">
                          {badge && <div className="mb-1">{badge}</div>}
                          <Textarea
                            value={med.text}
                            onChange={(e) => onUpdateMedText(med.id, e.target.value)}
                            className="text-xs min-h-[50px] resize-none border-dashed bg-paper/50"
                            rows={2}
                          />
                        </div>
                        <button
                          onClick={() => onRemoveMed(med.id)}
                          className="text-ink-faint hover:text-destructive mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remover"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Atestado */}
          {action === "atestado" && (
            <div className="rounded-lg border border-ink-soft p-4">
              <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint mb-3">
                Texto do atestado
              </div>
              <p className="text-sm text-ink leading-7">
                Atesto, para os devidos fins, que o(a) paciente{" "}
                <strong>{patientName || "____________"}</strong> foi atendido(a) nesta data,
                necessitando de afastamento por{" "}
                <strong>{atestado.days || "___"} dia{parseInt(atestado.days || "0") !== 1 ? "s" : ""}</strong>,
                a partir de <strong>{currentDate}</strong>.
              </p>
              {atestado.showCid && atestado.cid && (
                <p className="mt-3 text-sm text-ink">
                  <strong>CID-10:</strong> {atestado.cid}
                  {atestado.reason && ` — ${atestado.reason}`}
                </p>
              )}
            </div>
          )}

          {/* Exames */}
          {action === "exames" && (
            <div className="rounded-lg border border-ink-soft p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
                  Solicito os seguintes exames
                </div>
                {exames.urgente && (
                  <span className="text-[10px] font-bold uppercase tracking-editorial px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                    Urgente
                  </span>
                )}
              </div>
              {exames.itens.length === 0 ? (
                <div className="text-center py-6 text-xs text-ink-faint italic">
                  Adicione exames laboratoriais ou de imagem
                </div>
              ) : (
                <div className="space-y-3">
                  {(["laboratorial", "imagem"] as const).map((tipo) => {
                    const lista = exames.itens.filter((i) => i.tipo === tipo);
                    if (lista.length === 0) return null;
                    return (
                      <div key={tipo}>
                        <div className="text-[10px] font-bold uppercase tracking-editorial text-ink mb-1.5">
                          {tipo === "laboratorial" ? "Laboratoriais" : "Imagem"}
                        </div>
                        <ul className="space-y-1 text-sm text-ink leading-6">
                          {lista.map((i, idx) => (
                            <li key={i.id}>{idx + 1}. {i.nome}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
              {(exames.justificativa || exames.cid) && (
                <div className="mt-4 pt-3 border-t border-ink-soft text-sm text-ink space-y-1.5">
                  {exames.cid && <p><strong className="text-xs uppercase tracking-editorial text-ink-faint">CID-10:</strong> {exames.cid}</p>}
                  {exames.justificativa && (
                    <p className="leading-6"><strong className="text-xs uppercase tracking-editorial text-ink-faint block mb-0.5">Justificativa:</strong> {exames.justificativa}</p>
                  )}
                </div>
              )}
              {exames.observacoes && (
                <p className="mt-3 text-xs italic text-ink-muted">Obs.: {exames.observacoes}</p>
              )}
            </div>
          )}

          {/* Encaminhamento */}
          {action === "encaminhamento" && (
            <div className="rounded-lg border border-ink-soft p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
                    Encaminho para
                  </div>
                  <div className="font-serif text-base font-semibold text-ink mt-0.5">
                    {encaminhamento.especialidade || "____________"}
                  </div>
                </div>
                {encaminhamento.urgencia !== "eletivo" && (
                  <span className={`text-[10px] font-bold uppercase tracking-editorial px-2 py-0.5 rounded-full ${
                    encaminhamento.urgencia === "urgente" ? "bg-destructive/10 text-destructive" : "bg-amber-100 text-amber-900"
                  }`}>
                    {encaminhamento.urgencia === "urgente" ? "Urgente" : "Prioritário"}
                  </span>
                )}
              </div>
              {encaminhamento.cid && (
                <p className="text-sm text-ink"><strong className="text-xs uppercase tracking-editorial text-ink-faint">CID-10:</strong> {encaminhamento.cid}</p>
              )}
              {encaminhamento.hipotese && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-editorial text-ink-faint mb-1">Hipótese diagnóstica</div>
                  <p className="text-sm text-ink leading-6 whitespace-pre-line">{encaminhamento.hipotese}</p>
                </div>
              )}
              {encaminhamento.resumoClinico && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-editorial text-ink-faint mb-1">Resumo clínico</div>
                  <p className="text-sm text-ink leading-6 whitespace-pre-line">{encaminhamento.resumoClinico}</p>
                </div>
              )}
              {encaminhamento.exames && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-editorial text-ink-faint mb-1">Exames realizados</div>
                  <p className="text-sm text-ink leading-6 whitespace-pre-line">{encaminhamento.exames}</p>
                </div>
              )}
            </div>
          )}

          {/* Declaração */}
          {action === "declaracao" && (
            <div className="rounded-lg border border-ink-soft p-4">
              <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint mb-3">
                Texto da declaração
              </div>
              <p className="text-sm text-ink leading-7">
                Declaro, para os devidos fins, que o(a) paciente{" "}
                <strong>{patientName || "____________"}</strong> compareceu a esta unidade no dia{" "}
                <strong>{declaracao.data ? formatDateBR(declaracao.data) : currentDate}</strong>
                {declaracao.horaInicio && (
                  <>
                    , no horário das <strong>{declaracao.horaInicio}</strong>
                    {declaracao.horaFim && <> às <strong>{declaracao.horaFim}</strong></>}
                  </>
                )}
                {declaracao.acompanhante && (
                  <>, acompanhado(a) de <strong>{declaracao.acompanhante}</strong></>
                )}
                .
              </p>
              {declaracao.finalidade && (
                <p className="mt-3 text-sm text-ink leading-7">
                  <strong>Finalidade:</strong> {declaracao.finalidade}
                </p>
              )}
            </div>
          )}

          {/* Relatório simples */}
          {action === "relatorio" && (
            <div className="rounded-lg border border-ink-soft p-4 space-y-3">
              {relatorio.destinatario && (
                <p className="text-sm text-ink"><strong className="text-xs uppercase tracking-editorial text-ink-faint">À/Ao:</strong> {relatorio.destinatario}</p>
              )}
              {relatorio.cid && (
                <p className="text-sm text-ink"><strong className="text-xs uppercase tracking-editorial text-ink-faint">CID-10:</strong> {relatorio.cid}</p>
              )}
              {relatorio.conteudo ? (
                <p className="text-sm text-ink leading-6 whitespace-pre-line">{relatorio.conteudo}</p>
              ) : (
                <div className="text-center py-6 text-xs text-ink-faint italic">
                  Escreva o relatório do atendimento
                </div>
              )}
            </div>
          )}


          {/* Orientações */}
          {action === "orientacoes" && (
            <div className="rounded-lg border border-ink-soft p-4 space-y-3">
              {orientacoes.diagnostico && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-editorial text-ink-faint mb-1">Condição</div>
                  <p className="text-sm text-ink">{orientacoes.diagnostico}</p>
                </div>
              )}
              {orientacoes.cuidadosGerais && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-editorial text-ink-faint mb-1">Cuidados gerais</div>
                  <p className="text-sm text-ink leading-6 whitespace-pre-line">{orientacoes.cuidadosGerais}</p>
                </div>
              )}
              {orientacoes.sinaisAlarme.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-editorial text-destructive mb-1.5">
                    <AlertTriangle className="h-3 w-3" /> Procurar pronto-atendimento se
                  </div>
                  <ul className="space-y-1">
                    {orientacoes.sinaisAlarme.map((s, i) => (
                      <li key={i} className="text-sm text-ink leading-snug pl-3 relative">
                        <span className="absolute left-0 text-destructive font-bold">!</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(orientacoes.retornoData || orientacoes.retornoCondicao) && (
                <div className="pt-2 border-t border-ink-soft">
                  <div className="text-[10px] font-bold uppercase tracking-editorial text-ink-faint mb-1">Retorno</div>
                  <p className="text-sm text-ink">
                    {orientacoes.retornoData && <>Em <strong>{formatDateBR(orientacoes.retornoData)}</strong></>}
                    {orientacoes.retornoData && orientacoes.retornoCondicao && " — "}
                    {orientacoes.retornoCondicao}
                  </p>
                </div>
              )}
              {!orientacoes.diagnostico && !orientacoes.cuidadosGerais && orientacoes.sinaisAlarme.length === 0 && (
                <div className="text-center py-6 text-xs text-ink-faint italic">
                  Preencha as orientações ao paciente
                </div>
              )}
            </div>
          )}

          {/* Documentos regulatórios (AIH, APAC, notificação) */}
          {structuredKind && (
            <StructuredDocumentBody
              lead={structuredLead(structuredKind, patientName, structuredData)}
              sections={buildSections(structuredFields, structuredData)}
              emptyHint="Preencha os campos obrigatórios do laudo"
            />
          )}

          {/* Aviso */}
          {!comingSoon && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div>
                  <div className="text-xs font-semibold text-destructive">Revisão final recomendada</div>
                  <p className="mt-0.5 text-[11px] leading-5 text-ink-muted">
                    Confirme dados, ajustes e contexto clínico antes de emitir.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action bar (sticky bottom) — hidden when embedded in ReviewScreen */}
      {!comingSoon && !hideActions && (
        <div className="border-t border-ink-soft bg-card px-5 py-3 flex gap-2">
          <Button
            className={cn(
              "flex-1 h-11 bg-canon-blue text-primary-foreground hover:bg-canon-blue/90"
            )}
            onClick={onPrint}
          >
            <Printer className="h-4 w-4 mr-2" /> Imprimir / PDF
          </Button>
          {onClear && (
            <Button variant="outline" className="h-11" onClick={onClear}>
              Limpar
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentPreview;
