/**
 * Perfis de acesso e permissões granulares por módulo.
 *
 * Os papéis vêm da tabela `user_roles` (nunca do perfil do usuário) e são
 * combinados: quem tem mais de um papel acumula as permissões.
 */

export type AppRole =
  | "admin"
  | "revisor"
  | "medico"
  | "residente"
  | "enfermagem"
  | "farmacia"
  | "administrativo"
  | "moderator"
  | "user";

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrador do sistema",
  revisor: "Revisor clínico",
  medico: "Médico",
  residente: "Residente",
  enfermagem: "Enfermagem",
  farmacia: "Farmácia",
  administrativo: "Administrativo",
  moderator: "Moderador",
  user: "Usuário",
};

export const ROLE_DESCRIPTION: Partial<Record<AppRole, string>> = {
  medico: "Acesso completo: emite todos os documentos e assina.",
  residente: "Mesmo alcance do médico, com documentos sujeitos a supervisão.",
  enfermagem: "Visualização clínica e registros de cuidado; não emite documentos.",
  administrativo: "Gestão documental, dados institucionais e configurações básicas.",
  farmacia: "Consulta de medicamentos, diluições e preparo.",
  revisor: "Curadoria e aprovação de conteúdo clínico.",
  admin: "Administração total, incluindo perfis, auditoria e conformidade.",
};

export const PERMISSIONS = [
  "prescricao.emitir",
  "prescricao.visualizar",
  "documentos.emitir",
  "documentos.editar_emitido",
  "documentos.visualizar",
  "internacao.registrar",
  "internacao.visualizar",
  "notificacao.emitir",
  "notificacao.visualizar",
  "conteudo_clinico.editar",
  "conteudo_clinico.visualizar",
  "paciente.visualizar",
  "paciente.editar",
  "configuracoes.institucionais",
  "configuracoes.sistema",
  "auditoria.visualizar",
  "conformidade.gerenciar",
  "assinatura.assinar",
  "supervisao.validar",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABEL: Record<Permission, string> = {
  "prescricao.emitir": "Emitir prescrições",
  "prescricao.visualizar": "Ver prescrições",
  "documentos.emitir": "Emitir documentos",
  "documentos.editar_emitido": "Alterar documento já emitido",
  "documentos.visualizar": "Ver documentos",
  "internacao.registrar": "Registrar internação (AIH)",
  "internacao.visualizar": "Ver internações",
  "notificacao.emitir": "Emitir notificação compulsória",
  "notificacao.visualizar": "Ver notificações",
  "conteudo_clinico.editar": "Editar protocolos e conteúdo clínico",
  "conteudo_clinico.visualizar": "Consultar protocolos e escores",
  "paciente.visualizar": "Ver dados de paciente",
  "paciente.editar": "Editar dados de paciente",
  "configuracoes.institucionais": "Configurações institucionais",
  "configuracoes.sistema": "Configurações do sistema",
  "auditoria.visualizar": "Consultar trilha de auditoria",
  "conformidade.gerenciar": "Gerenciar conformidade e LGPD",
  "assinatura.assinar": "Assinar digitalmente",
  "supervisao.validar": "Validar documento de residente",
};

export const PERMISSION_MODULE: Record<Permission, string> = {
  "prescricao.emitir": "Prescrição",
  "prescricao.visualizar": "Prescrição",
  "documentos.emitir": "Documentos",
  "documentos.editar_emitido": "Documentos",
  "documentos.visualizar": "Documentos",
  "internacao.registrar": "Internação",
  "internacao.visualizar": "Internação",
  "notificacao.emitir": "Notificações",
  "notificacao.visualizar": "Notificações",
  "conteudo_clinico.editar": "Conteúdo clínico",
  "conteudo_clinico.visualizar": "Conteúdo clínico",
  "paciente.visualizar": "Pacientes",
  "paciente.editar": "Pacientes",
  "configuracoes.institucionais": "Configurações",
  "configuracoes.sistema": "Configurações",
  "auditoria.visualizar": "Segurança",
  "conformidade.gerenciar": "Segurança",
  "assinatura.assinar": "Assinatura",
  "supervisao.validar": "Supervisão",
};

const MEDICO: Permission[] = [
  "prescricao.emitir",
  "prescricao.visualizar",
  "documentos.emitir",
  "documentos.editar_emitido",
  "documentos.visualizar",
  "internacao.registrar",
  "internacao.visualizar",
  "notificacao.emitir",
  "notificacao.visualizar",
  "conteudo_clinico.visualizar",
  "paciente.visualizar",
  "paciente.editar",
  "assinatura.assinar",
  "supervisao.validar",
];

const RESIDENTE: Permission[] = MEDICO.filter(
  (p) => p !== "supervisao.validar" && p !== "documentos.editar_emitido",
);

const ENFERMAGEM: Permission[] = [
  "prescricao.visualizar",
  "documentos.visualizar",
  "internacao.visualizar",
  "notificacao.visualizar",
  "conteudo_clinico.visualizar",
  "paciente.visualizar",
];

const ADMINISTRATIVO: Permission[] = [
  "documentos.visualizar",
  "internacao.visualizar",
  "configuracoes.institucionais",
  "paciente.visualizar",
];

const FARMACIA: Permission[] = [
  "prescricao.visualizar",
  "conteudo_clinico.visualizar",
  "documentos.visualizar",
];

const REVISOR: Permission[] = [
  "conteudo_clinico.visualizar",
  "conteudo_clinico.editar",
  "documentos.visualizar",
  "prescricao.visualizar",
];

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  admin: [...PERMISSIONS],
  moderator: REVISOR,
  revisor: REVISOR,
  medico: MEDICO,
  residente: RESIDENTE,
  enfermagem: ENFERMAGEM,
  farmacia: FARMACIA,
  administrativo: ADMINISTRATIVO,
  user: ["conteudo_clinico.visualizar"],
};

/** Papel padrão de quem ainda não tem papel atribuído. */
export const DEFAULT_ROLE: AppRole = "medico";

export function permissionsForRoles(roles: string[]): Set<Permission> {
  const list = roles.length > 0 ? roles : [DEFAULT_ROLE];
  const set = new Set<Permission>();
  for (const role of list) {
    for (const p of ROLE_PERMISSIONS[role as AppRole] ?? []) set.add(p);
  }
  return set;
}

/** Papel principal exibido na interface. */
export function primaryRole(roles: string[]): AppRole {
  const order: AppRole[] = [
    "admin",
    "revisor",
    "medico",
    "residente",
    "farmacia",
    "enfermagem",
    "administrativo",
    "moderator",
    "user",
  ];
  return order.find((r) => roles.includes(r)) ?? DEFAULT_ROLE;
}

/** Residente emite, mas o documento nasce marcado para supervisão. */
export const requiresSupervision = (roles: string[]) =>
  roles.includes("residente") && !roles.includes("medico") && !roles.includes("admin");
