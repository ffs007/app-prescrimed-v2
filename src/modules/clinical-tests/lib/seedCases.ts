/**
 * Casos de teste clínico iniciais (A–O do brief Etapa 22).
 * Estrutura mínima — `paciente_simulado` e `medicamentos_prescritos` representam
 * o cenário; `alerta_esperado` descreve o comportamento que o sistema deve ter.
 * A execução real é feita em runTesteClinico (preenchido manualmente pelo médico
 * no MVP beta — aprovação/reprovação manual).
 */
export interface SeedCase {
  nome_do_teste: string;
  descricao: string;
  categoria: string;
  paciente_simulado: Record<string, unknown>;
  medicamentos_prescritos: Array<Record<string, unknown>>;
  alerta_esperado: { tipo: string; descricao: string; severidade: "critico" | "alto" | "medio" | "informativo" };
}

export const SEED_CASES: SeedCase[] = [
  {
    nome_do_teste: "A — Alergia conhecida",
    categoria: "alergia",
    descricao: "Paciente com alergia registrada a Dipirona. Ao prescrever Dipirona, deve gerar alerta crítico.",
    paciente_simulado: { idade: 35, peso: 70, alergias: ["dipirona"] },
    medicamentos_prescritos: [{ principio_ativo: "dipirona", dose: "1g", via: "VO" }],
    alerta_esperado: { tipo: "alergia", descricao: "Alerta crítico de alergia ao prescrever Dipirona", severidade: "critico" },
  },
  {
    nome_do_teste: "B — Pediátrico com peso",
    categoria: "pediatrico",
    descricao: "Criança de 5 anos, 18 kg. Ao prescrever paracetamol, deve calcular dose por peso.",
    paciente_simulado: { idade: 5, peso: 18 },
    medicamentos_prescritos: [{ principio_ativo: "paracetamol", via: "VO" }],
    alerta_esperado: { tipo: "calculo_pediatrico", descricao: "Sistema sugere dose mg/kg", severidade: "informativo" },
  },
  {
    nome_do_teste: "C — Pediátrico sem peso",
    categoria: "pediatrico",
    descricao: "Criança sem peso informado. Sistema deve alertar peso necessário.",
    paciente_simulado: { idade: 4, peso: null },
    medicamentos_prescritos: [{ principio_ativo: "amoxicilina", via: "VO" }],
    alerta_esperado: { tipo: "peso_ausente", descricao: "Peso necessário para cálculo pediátrico seguro", severidade: "alto" },
  },
  {
    nome_do_teste: "D — Diluição IV",
    categoria: "iv",
    descricao: "Medicamento IV cadastrado. Card de Segurança IV deve aparecer.",
    paciente_simulado: { idade: 50, peso: 70 },
    medicamentos_prescritos: [{ principio_ativo: "ceftriaxona", dose: "1g", via: "IV" }],
    alerta_esperado: { tipo: "seguranca_iv", descricao: "Card de Segurança IV exibido com diluente e tempo", severidade: "informativo" },
  },
  {
    nome_do_teste: "E — Concentração máxima",
    categoria: "iv",
    descricao: "Dose/volume resultando em concentração acima da máxima cadastrada.",
    paciente_simulado: { idade: 60, peso: 75 },
    medicamentos_prescritos: [{ principio_ativo: "vancomicina", dose: "1g", via: "IV", volume_ml: 50 }],
    alerta_esperado: { tipo: "concentracao", descricao: "Concentração acima da máxima recomendada", severidade: "alto" },
  },
  {
    nome_do_teste: "F — Tempo mínimo de infusão",
    categoria: "iv",
    descricao: "Tempo informado menor que o tempo mínimo cadastrado para o medicamento.",
    paciente_simulado: { idade: 45, peso: 70 },
    medicamentos_prescritos: [{ principio_ativo: "vancomicina", dose: "1g", via: "IV", tempo_min: 15 }],
    alerta_esperado: { tipo: "tempo_infusao", descricao: "Tempo de infusão abaixo do mínimo seguro", severidade: "alto" },
  },
  {
    nome_do_teste: "G — Interação crítica",
    categoria: "interacao",
    descricao: "Combinação de dois medicamentos com interação crítica. Exige justificativa.",
    paciente_simulado: { idade: 65, peso: 72 },
    medicamentos_prescritos: [
      { principio_ativo: "warfarina", via: "VO" },
      { principio_ativo: "aas", via: "VO" },
    ],
    alerta_esperado: { tipo: "interacao_critica", descricao: "Alerta crítico de interação + exige justificativa", severidade: "critico" },
  },
  {
    nome_do_teste: "H — Duplicidade de classe",
    categoria: "duplicidade",
    descricao: "Dois AINEs prescritos. Deve mostrar alerta de duplicidade.",
    paciente_simulado: { idade: 40, peso: 70 },
    medicamentos_prescritos: [
      { principio_ativo: "ibuprofeno", via: "VO" },
      { principio_ativo: "naproxeno", via: "VO" },
    ],
    alerta_esperado: { tipo: "duplicidade", descricao: "Alerta de duplicidade de classe (AINE)", severidade: "medio" },
  },
  {
    nome_do_teste: "I — Gestante",
    categoria: "gestante",
    descricao: "Paciente gestante. Medicamento contraindicado deve disparar alerta.",
    paciente_simulado: { idade: 28, peso: 65, gestante: true },
    medicamentos_prescritos: [{ principio_ativo: "isotretinoina", via: "VO" }],
    alerta_esperado: { tipo: "gestacao", descricao: "Contraindicação na gestação", severidade: "critico" },
  },
  {
    nome_do_teste: "J — Ajuste renal",
    categoria: "renal",
    descricao: "Paciente com ClCr reduzida e medicamento que exige ajuste renal.",
    paciente_simulado: { idade: 70, peso: 65, clcr: 25 },
    medicamentos_prescritos: [{ principio_ativo: "vancomicina", via: "IV" }],
    alerta_esperado: { tipo: "ajuste_renal", descricao: "Alerta de ajuste de dose por função renal", severidade: "alto" },
  },
  {
    nome_do_teste: "K — Medicamento controlado",
    categoria: "controlado",
    descricao: "Medicamento controlado deve gerar receita separada.",
    paciente_simulado: { idade: 40, peso: 70 },
    medicamentos_prescritos: [{ principio_ativo: "clonazepam", via: "VO" }],
    alerta_esperado: { tipo: "controle_especial", descricao: "Documento separado em Receita de Controle Especial", severidade: "informativo" },
  },
  {
    nome_do_teste: "L — Antimicrobiano",
    categoria: "antimicrobiano",
    descricao: "Antimicrobiano deve sair em receita separada (conforme configuração).",
    paciente_simulado: { idade: 30, peso: 70 },
    medicamentos_prescritos: [{ principio_ativo: "amoxicilina", via: "VO" }],
    alerta_esperado: { tipo: "antimicrobiano", descricao: "Receita de antimicrobiano separada", severidade: "informativo" },
  },
  {
    nome_do_teste: "M — Geração de PDFs separados",
    categoria: "documentos",
    descricao: "Prescrição com medicamento + exame + atestado + orientação deve gerar PDFs separados.",
    paciente_simulado: { idade: 35, peso: 70 },
    medicamentos_prescritos: [{ principio_ativo: "paracetamol", via: "VO" }],
    alerta_esperado: { tipo: "pdf_separado", descricao: "4 documentos distintos gerados", severidade: "informativo" },
  },
  {
    nome_do_teste: "N — Documento digital + link",
    categoria: "link_paciente",
    descricao: "Geração de documento digital e criação de link seguro.",
    paciente_simulado: { idade: 35, peso: 70 },
    medicamentos_prescritos: [{ principio_ativo: "paracetamol", via: "VO" }],
    alerta_esperado: { tipo: "link_publico", descricao: "Link seguro criado com expiração de 30 dias", severidade: "informativo" },
  },
  {
    nome_do_teste: "O — Assinatura digital pronta",
    categoria: "assinatura",
    descricao: "Documento pronto para assinatura digital (mesmo em modo configuração).",
    paciente_simulado: { idade: 35, peso: 70 },
    medicamentos_prescritos: [{ principio_ativo: "paracetamol", via: "VO" }],
    alerta_esperado: { tipo: "assinatura_pronta", descricao: "Botão de assinatura disponível ou estrutura configurada", severidade: "informativo" },
  },
];
