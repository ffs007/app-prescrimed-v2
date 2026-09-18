import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X, Search, Zap } from "lucide-react";

export type ExameTipo = "laboratorial" | "imagem";

export interface ExameItem {
  id: string;
  tipo: ExameTipo;
  nome: string;
}

export interface ExamesData {
  itens: ExameItem[];
  justificativa: string;
  cid: string;
  urgente: boolean;
  observacoes: string;
}

interface SugestaoExame {
  nome: string;
  tipo: ExameTipo;
}

const SUGESTOES: SugestaoExame[] = [
  // ===== Laboratoriais — hematologia/bioquímica =====
  { nome: "Hemograma completo", tipo: "laboratorial" },
  { nome: "Plaquetas", tipo: "laboratorial" },
  { nome: "Reticulócitos", tipo: "laboratorial" },
  { nome: "Coagulograma (TP/INR, TTPA)", tipo: "laboratorial" },
  { nome: "Glicemia de jejum", tipo: "laboratorial" },
  { nome: "Hemoglobina glicada (HbA1c)", tipo: "laboratorial" },
  { nome: "Curva glicêmica (TOTG)", tipo: "laboratorial" },
  { nome: "Insulina basal", tipo: "laboratorial" },
  { nome: "TSH", tipo: "laboratorial" },
  { nome: "T4 livre", tipo: "laboratorial" },
  { nome: "T3", tipo: "laboratorial" },
  { nome: "Anti-TPO", tipo: "laboratorial" },
  { nome: "Creatinina", tipo: "laboratorial" },
  { nome: "Ureia", tipo: "laboratorial" },
  { nome: "Ácido úrico", tipo: "laboratorial" },
  { nome: "Sódio", tipo: "laboratorial" },
  { nome: "Potássio", tipo: "laboratorial" },
  { nome: "Cálcio total", tipo: "laboratorial" },
  { nome: "Cálcio iônico", tipo: "laboratorial" },
  { nome: "Magnésio", tipo: "laboratorial" },
  { nome: "Fósforo", tipo: "laboratorial" },
  { nome: "TGO (AST)", tipo: "laboratorial" },
  { nome: "TGP (ALT)", tipo: "laboratorial" },
  { nome: "Gama-GT", tipo: "laboratorial" },
  { nome: "Fosfatase alcalina", tipo: "laboratorial" },
  { nome: "Bilirrubinas totais e frações", tipo: "laboratorial" },
  { nome: "Albumina", tipo: "laboratorial" },
  { nome: "Proteínas totais e frações", tipo: "laboratorial" },
  { nome: "Amilase", tipo: "laboratorial" },
  { nome: "Lipase", tipo: "laboratorial" },
  { nome: "CPK", tipo: "laboratorial" },
  { nome: "Troponina", tipo: "laboratorial" },
  { nome: "BNP / NT-proBNP", tipo: "laboratorial" },
  { nome: "Colesterol total e frações", tipo: "laboratorial" },
  { nome: "Triglicerídeos", tipo: "laboratorial" },
  { nome: "Apolipoproteína B", tipo: "laboratorial" },
  { nome: "PCR (proteína C reativa)", tipo: "laboratorial" },
  { nome: "VHS", tipo: "laboratorial" },
  { nome: "Procalcitonina", tipo: "laboratorial" },
  { nome: "Ferritina", tipo: "laboratorial" },
  { nome: "Ferro sérico", tipo: "laboratorial" },
  { nome: "Saturação de transferrina", tipo: "laboratorial" },
  { nome: "Vitamina B12", tipo: "laboratorial" },
  { nome: "Ácido fólico", tipo: "laboratorial" },
  { nome: "Vitamina D (25-OH)", tipo: "laboratorial" },
  { nome: "PTH", tipo: "laboratorial" },
  { nome: "Cortisol matinal", tipo: "laboratorial" },
  { nome: "Beta-HCG quantitativo", tipo: "laboratorial" },
  { nome: "Prolactina", tipo: "laboratorial" },
  { nome: "Testosterona total", tipo: "laboratorial" },
  { nome: "FSH / LH", tipo: "laboratorial" },
  { nome: "Estradiol", tipo: "laboratorial" },
  { nome: "PSA total e livre", tipo: "laboratorial" },
  { nome: "EAS / Urina I", tipo: "laboratorial" },
  { nome: "Urocultura com antibiograma", tipo: "laboratorial" },
  { nome: "Microalbuminúria 24h", tipo: "laboratorial" },
  { nome: "Parasitológico de fezes (3 amostras)", tipo: "laboratorial" },
  { nome: "Sangue oculto nas fezes", tipo: "laboratorial" },
  { nome: "Coprocultura", tipo: "laboratorial" },
  { nome: "Hemocultura (2 amostras)", tipo: "laboratorial" },
  // Sorologias / infecciosas
  { nome: "Anti-HIV", tipo: "laboratorial" },
  { nome: "VDRL", tipo: "laboratorial" },
  { nome: "HBsAg / Anti-HBs / Anti-HBc", tipo: "laboratorial" },
  { nome: "Anti-HCV", tipo: "laboratorial" },
  { nome: "Sorologia dengue (IgM/IgG/NS1)", tipo: "laboratorial" },
  { nome: "COVID-19 RT-PCR", tipo: "laboratorial" },
  { nome: "Influenza A/B (swab)", tipo: "laboratorial" },
  // Imunologia / auto-imunes
  { nome: "FAN (Fator Antinuclear)", tipo: "laboratorial" },
  { nome: "Fator reumatoide", tipo: "laboratorial" },
  { nome: "Anti-CCP", tipo: "laboratorial" },
  { nome: "ANCA", tipo: "laboratorial" },

  // ===== Imagem — Radiografias =====
  { nome: "Raio-X de tórax PA + perfil", tipo: "imagem" },
  { nome: "Raio-X de abdome agudo (3 incidências)", tipo: "imagem" },
  { nome: "Raio-X de coluna cervical", tipo: "imagem" },
  { nome: "Raio-X de coluna lombar", tipo: "imagem" },
  { nome: "Raio-X de joelho bilateral", tipo: "imagem" },
  { nome: "Raio-X de bacia", tipo: "imagem" },
  { nome: "Raio-X de seios da face", tipo: "imagem" },

  // ===== Imagem — Ultrassonografias =====
  { nome: "USG abdominal total", tipo: "imagem" },
  { nome: "USG abdome superior", tipo: "imagem" },
  { nome: "USG rins e vias urinárias", tipo: "imagem" },
  { nome: "USG pélvica", tipo: "imagem" },
  { nome: "USG transvaginal", tipo: "imagem" },
  { nome: "USG obstétrica", tipo: "imagem" },
  { nome: "USG obstétrica morfológica", tipo: "imagem" },
  { nome: "USG transvaginal com doppler", tipo: "imagem" },
  { nome: "USG mamária bilateral", tipo: "imagem" },
  { nome: "USG tireoide", tipo: "imagem" },
  { nome: "USG cervical / partes moles", tipo: "imagem" },
  { nome: "USG bolsa escrotal", tipo: "imagem" },
  { nome: "USG próstata via abdominal", tipo: "imagem" },
  { nome: "USG articular (especificar)", tipo: "imagem" },
  { nome: "USG doppler venoso de MMII", tipo: "imagem" },
  { nome: "USG doppler arterial de MMII", tipo: "imagem" },
  { nome: "USG doppler de carótidas", tipo: "imagem" },

  // ===== Imagem — Tomografias =====
  { nome: "Tomografia de crânio sem contraste", tipo: "imagem" },
  { nome: "Tomografia de crânio com contraste", tipo: "imagem" },
  { nome: "Angio-TC de crânio", tipo: "imagem" },
  { nome: "Tomografia de seios da face", tipo: "imagem" },
  { nome: "Tomografia de pescoço com contraste", tipo: "imagem" },
  { nome: "Tomografia de tórax sem contraste", tipo: "imagem" },
  { nome: "Tomografia de tórax com contraste", tipo: "imagem" },
  { nome: "Angio-TC de tórax (TEP)", tipo: "imagem" },
  { nome: "Tomografia de abdome e pelve com contraste", tipo: "imagem" },
  { nome: "Tomografia de abdome superior", tipo: "imagem" },
  { nome: "Uro-TC", tipo: "imagem" },
  { nome: "Tomografia de coluna cervical", tipo: "imagem" },
  { nome: "Tomografia de coluna lombar", tipo: "imagem" },
  { nome: "Tomografia de bacia", tipo: "imagem" },

  // ===== Imagem — Ressonâncias Magnéticas =====
  { nome: "RM de crânio sem contraste", tipo: "imagem" },
  { nome: "RM de crânio com contraste", tipo: "imagem" },
  { nome: "Angio-RM de crânio", tipo: "imagem" },
  { nome: "RM de coluna cervical", tipo: "imagem" },
  { nome: "RM de coluna torácica", tipo: "imagem" },
  { nome: "RM de coluna lombar", tipo: "imagem" },
  { nome: "RM de pelve", tipo: "imagem" },
  { nome: "RM de abdome superior", tipo: "imagem" },
  { nome: "Colangio-RM", tipo: "imagem" },
  { nome: "RM de joelho", tipo: "imagem" },
  { nome: "RM de ombro", tipo: "imagem" },
  { nome: "RM de tornozelo", tipo: "imagem" },
  { nome: "RM de quadril", tipo: "imagem" },
  { nome: "RM mamária bilateral", tipo: "imagem" },

  // ===== Imagem — Cardiologia / Vascular =====
  { nome: "Ecocardiograma transtorácico", tipo: "imagem" },
  { nome: "Ecocardiograma transesofágico", tipo: "imagem" },
  { nome: "Eletrocardiograma de repouso", tipo: "imagem" },
  { nome: "Teste ergométrico", tipo: "imagem" },
  { nome: "Holter 24h", tipo: "imagem" },
  { nome: "MAPA 24h", tipo: "imagem" },

  // ===== Imagem — Endoscopias =====
  { nome: "Endoscopia digestiva alta", tipo: "imagem" },
  { nome: "Colonoscopia", tipo: "imagem" },
  { nome: "Broncoscopia", tipo: "imagem" },

  // ===== Imagem — Outros =====
  { nome: "Mamografia bilateral", tipo: "imagem" },
  { nome: "Densitometria óssea (coluna e fêmur)", tipo: "imagem" },
  { nome: "Cintilografia óssea", tipo: "imagem" },
  { nome: "PET-CT oncológico", tipo: "imagem" },
];

interface Props {
  data: ExamesData;
  onChange: (data: ExamesData) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const ExamesForm = ({ data, onChange }: Props) => {
  const [draft, setDraft] = useState("");

  const update = <K extends keyof ExamesData>(key: K, value: ExamesData[K]) =>
    onChange({ ...data, [key]: value });

  const addItem = (tipo: ExameTipo, nome: string) => {
    const trimmed = nome.trim();
    if (!trimmed) return;
    if (data.itens.some((i) => i.nome.toLowerCase() === trimmed.toLowerCase())) return;
    update("itens", [...data.itens, { id: uid(), tipo, nome: trimmed }]);
  };

  const removeItem = (id: string) =>
    update("itens", data.itens.filter((i) => i.id !== id));

  const filtered = useMemo(() => {
    if (!draft.trim()) return SUGESTOES.slice(0, 8);
    const q = norm(draft);
    return SUGESTOES.filter((s) => norm(s.nome).includes(q)).slice(0, 8);
  }, [draft]);

  const handleAddDraft = () => {
    if (!draft.trim()) return;
    // Default para laboratorial quando digitado livre
    addItem("laboratorial", draft);
    setDraft("");
  };

  return (
    <div className="rounded-lg border border-ink-soft bg-card p-4 shadow-paper sm:p-5 space-y-4">
      <div>
        <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
          Bloco C · construção
        </div>
        <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">
          Solicitação de exames
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Busque ou digite o exame. Clique nas sugestões para adicionar rapidamente.
        </p>
      </div>

      {/* Busca + adição rápida */}
      <div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddDraft();
              }
            }}
            placeholder="Buscar ou digitar exame..."
            className="h-11 bg-paper-alt/40 border-ink-soft pl-10 pr-12 text-sm"
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 p-0"
            onClick={handleAddDraft}
            aria-label="Adicionar"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {filtered.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {filtered.map((s) => (
              <button
                key={s.nome}
                type="button"
                onClick={() => {
                  addItem(s.tipo, s.nome);
                  setDraft("");
                }}
                className="text-[11px] px-2.5 py-1 rounded-full border border-ink-soft bg-paper-alt/40 text-ink-muted hover:border-canon-blue/40 hover:text-canon-blue transition"
              >
                + {s.nome}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Itens selecionados */}
      {data.itens.length > 0 && (
        <ul className="space-y-1.5">
          {data.itens.map((i) => (
            <li
              key={i.id}
              className="flex items-center gap-2 text-sm text-ink bg-paper-alt/30 rounded-md px-3 py-2 border border-ink-soft"
            >
              <span className="flex-1">{i.nome}</span>
              <span className="text-[10px] uppercase tracking-wider text-ink-faint">
                {i.tipo === "imagem" ? "imagem" : "lab"}
              </span>
              <button
                onClick={() => removeItem(i.id)}
                className="text-ink-faint hover:text-destructive transition"
                aria-label={`Remover ${i.nome}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Justificativa simples + urgente */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-ink">
            Justificativa clínica <span className="text-ink-faint font-normal">(opcional)</span>
          </Label>
          <Textarea
            value={data.justificativa}
            onChange={(e) => update("justificativa", e.target.value)}
            placeholder="Hipótese diagnóstica ou motivo da solicitação..."
            className="min-h-[60px] bg-paper-alt/40 border-ink-soft resize-none text-sm"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs font-medium text-ink">
              CID-10 <span className="text-ink-faint font-normal">(opcional)</span>
            </Label>
            <Input
              value={data.cid}
              onChange={(e) => update("cid", e.target.value)}
              placeholder="Ex: R51"
              className="h-10 bg-paper-alt/40 border-ink-soft text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => update("urgente", !data.urgente)}
            className={`mt-5 inline-flex items-center gap-1.5 rounded-md border px-3 h-10 text-xs font-medium transition ${
              data.urgente
                ? "border-warning/40 bg-warning/10 text-warning"
                : "border-ink-soft bg-paper-alt/30 text-ink-muted hover:bg-paper-alt/60"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            Urgente
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamesForm;
