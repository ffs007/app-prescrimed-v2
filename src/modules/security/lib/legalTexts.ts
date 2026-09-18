/** Termos de uso e política de privacidade exibidos no app. */
export const LEGAL_VERSION = "2026-09";

export const TERMS_OF_USE = `
### Termos de uso — PrescriMed

1. **Natureza da ferramenta.** O PrescriMed é um apoio à decisão e à emissão de documentos clínicos. Todo conteúdo — sugestões, escores, protocolos e rascunhos de IA — é revisável e não substitui o julgamento do profissional responsável.
2. **Responsabilidade profissional.** A responsabilidade pelo diagnóstico, pela conduta e pelo documento emitido é integralmente do profissional que assina.
3. **Uso da conta.** A conta é pessoal e intransferível. O compartilhamento de credenciais é vedado e pode ser detectado pela trilha de auditoria.
4. **Perfis de acesso.** As funções disponíveis dependem do perfil atribuído (médico, residente, enfermagem, administrativo, farmácia, revisor, administrador).
5. **Documentos de residentes.** Documentos emitidos por residentes ficam marcados para supervisão, conforme regra institucional.
6. **Disponibilidade.** O serviço pode ser interrompido para manutenção; nenhuma indisponibilidade dispensa o registro em prontuário oficial.
7. **Vedações.** É proibido usar o app para gerar documentos falsos, alterar registros já emitidos sem rastro ou extrair dados de pacientes para finalidade estranha ao cuidado.
`.trim();

export const PRIVACY_POLICY = `
### Política de privacidade e proteção de dados

**Controlador e finalidade.** Os dados tratados servem exclusivamente à assistência em saúde, à emissão de documentos e ao cumprimento de obrigações legais e regulatórias (LGPD, art. 7º, II e 11, II).

**Dados tratados.** Identificação do profissional, dados clínicos e demográficos dos pacientes inseridos por ele, documentos emitidos e registros técnicos de auditoria (data/hora, ação, IP, identificador do registro).

**Segurança.** Tráfego cifrado por TLS; armazenamento cifrado em repouso pela infraestrutura do banco de dados; acesso a cada registro controlado por regras por usuário no próprio banco; chaves de IA guardadas por conta, nunca devolvidas à tela.

**Assistentes de IA.** Não enviamos identificação de paciente às ferramentas de IA. Os registros de uso guardam apenas módulo, provedor, modelo e assunto resumido.

**Retenção.** Cada módulo tem prazo próprio, listado na aba de retenção — prontuário e documentos assistenciais seguem a guarda de 20 anos; registros técnicos e logs de IA são eliminados ou anonimizados antes disso.

**Anonimização.** Dados que perderam a finalidade assistencial são anonimizados: removem-se identificadores diretos, mantendo-se apenas informação agregada para indicadores de qualidade.

**Direitos do titular.** Confirmação de tratamento, acesso, correção, portabilidade, anonimização e eliminação podem ser solicitados na aba "Meus direitos", com resposta em até 15 dias.

**Auditoria.** Todas as ações críticas ficam em trilha imutável, disponível a auditorias clínicas e de segurança.
`.trim();
