import type { ProcedureItem } from "../types/clinical";

export const PROCEDURES_LIBRARY: ProcedureItem[] = [
  { id: "sutura-simples", name: "Sutura simples", category: "Pequenos procedimentos", defaultJustification: "Ferimento corto-contuso com necessidade de síntese." },
  { id: "drenagem-abscesso", name: "Drenagem de abscesso", category: "Pequenos procedimentos", defaultJustification: "Coleção purulenta superficial." },
  { id: "exerese-lesao", name: "Exérese de lesão de pele", category: "Pequenos procedimentos", defaultJustification: "Lesão suspeita / sintomática." },
  { id: "infiltracao-articular", name: "Infiltração articular", category: "Ortopedia", defaultJustification: "Artralgia refratária ao tratamento conservador." },
  { id: "tamponamento-nasal", name: "Tamponamento nasal anterior", category: "Otorrino", defaultJustification: "Epistaxe ativa." },
  { id: "lavagem-otologica", name: "Lavagem do conduto auditivo", category: "Otorrino", defaultJustification: "Rolha de cerume / otoscopia limitada." },
  { id: "cauterizacao", name: "Cauterização química", category: "Otorrino/Ginecologia" },
];
