/**
 * Tradução de erros do backend para mensagens de UI.
 * Distingue falta de permissão (usuário sem sessão/papel) de falha genérica.
 */
export type SupabaseLikeError = { code?: string | null; message?: string | null } | null | undefined;

export function isPermissionError(error: SupabaseLikeError): boolean {
  if (!error) return false;
  const code = error.code ?? "";
  const msg = (error.message ?? "").toLowerCase();
  return (
    code === "42501" ||
    code === "PGRST301" ||
    code === "401" ||
    msg.includes("permission denied") ||
    msg.includes("jwt") ||
    msg.includes("row-level security")
  );
}

export function describeSupabaseError(error: SupabaseLikeError): string {
  if (!error) return "";
  if (isPermissionError(error)) {
    return "Você não tem permissão para ver estes dados. Faça login novamente ou solicite acesso ao administrador.";
  }
  return error.message || "Não foi possível carregar os dados. Tente novamente.";
}
