import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./client";

/**
 * Cliente sem tipagem gerada — usado para tabelas criadas depois da última
 * geração de `types.ts` (ex.: curadoria de patologias por ambiente).
 */
export const supabaseUntyped = supabase as unknown as SupabaseClient;
