/**
 * Redação de dados pessoais em `detalhes` de auditoria e logs.
 * Chaves que identificam paciente ou carregam texto clínico livre têm o valor substituído;
 * o restante é preservado. Aplica-se recursivamente a objetos e listas.
 */
const REDACTED = "[redigido]";

const PII_KEY = /(^|_)(nome|paciente|patient|cpf|cns|rg|telefone|phone|celular|email|endereco|address|nascimento|birth|prontuario|mae|responsavel|alergias?|diagnostico|hipotese|queixa|conteudo|texto|observacoes?|justificativa|posologia)($|_)/i;

const MAX_DEPTH = 6;

export function sanitizeAuditDetails(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return REDACTED;
  if (Array.isArray(value)) return value.map((v) => sanitizeAuditDetails(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      out[key] = PII_KEY.test(key) && v !== null && v !== undefined && v !== "" ? REDACTED : sanitizeAuditDetails(v, depth + 1);
    }
    return out;
  }
  return value;
}
