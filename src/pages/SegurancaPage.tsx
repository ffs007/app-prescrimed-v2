/**
 * Segurança e conformidade: perfis e permissões, trilha de auditoria,
 * termos/privacidade, retenção de dados e direitos do titular.
 */
import { useMemo, useState } from "react";
import { Check, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import PageMeta from "@/components/seo/PageMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { usePermissions } from "@/modules/security/hooks/usePermissions";
import { useAuditTrail } from "@/modules/security/hooks/useAuditLog";
import { AUDIT_ACTION_LABEL } from "@/modules/security/lib/auditActions";
import {
  PERMISSIONS,
  PERMISSION_LABEL,
  PERMISSION_MODULE,
  ROLE_DESCRIPTION,
  ROLE_LABEL,
  ROLE_PERMISSIONS,
  type AppRole,
} from "@/modules/security/lib/permissions";
import {
  REQUEST_STATUS_LABEL,
  REQUEST_TYPES,
  useConsents,
  useDataRequests,
  useRetentionPolicies,
} from "@/modules/security/hooks/useLgpd";
import { LEGAL_VERSION, PRIVACY_POLICY, TERMS_OF_USE } from "@/modules/security/lib/legalTexts";

const SHOWN_ROLES: AppRole[] = ["medico", "residente", "enfermagem", "administrativo", "farmacia", "revisor", "admin"];

function PermissionMatrix() {
  const { role } = usePermissions();
  const modules = useMemo(
    () => Array.from(new Set(PERMISSIONS.map((p) => PERMISSION_MODULE[p]))),
    [],
  );
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SHOWN_ROLES.map((r) => (
          <Card key={r} className={r === role ? "border-primary" : undefined}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                {ROLE_LABEL[r]}
                {r === role && <Badge>seu perfil</Badge>}
              </CardTitle>
              <CardDescription>{ROLE_DESCRIPTION[r]}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {ROLE_PERMISSIONS[r].length} permissões ativas
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-56">Permissão</TableHead>
              {SHOWN_ROLES.map((r) => (
                <TableHead key={r} className="text-center text-xs">{ROLE_LABEL[r]}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.map((mod) => (
              <>
                <TableRow key={`mod-${mod}`} className="bg-muted/50">
                  <TableCell colSpan={SHOWN_ROLES.length + 1} className="font-medium text-xs uppercase tracking-wide">
                    {mod}
                  </TableCell>
                </TableRow>
                {PERMISSIONS.filter((p) => PERMISSION_MODULE[p] === mod).map((p) => (
                  <TableRow key={p}>
                    <TableCell className="text-sm">{PERMISSION_LABEL[p]}</TableCell>
                    {SHOWN_ROLES.map((r) => (
                      <TableCell key={r} className="text-center">
                        {ROLE_PERMISSIONS[r].includes(p) ? (
                          <Check className="h-4 w-4 mx-auto text-primary" aria-label="permitido" />
                        ) : (
                          <span className="text-muted-foreground" aria-label="não permitido">—</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Os perfis são atribuídos por um administrador e valem também no banco de dados, não só na tela.
      </p>
    </div>
  );
}

function AuditTrail() {
  const [busca, setBusca] = useState("");
  const [modulo, setModulo] = useState("todos");
  const { data, isLoading, refetch, isFetching } = useAuditTrail({
    busca,
    modulo: modulo === "todos" ? undefined : modulo,
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-48">
          <Label className="text-xs">Buscar</Label>
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="ação, registro, usuário…" />
        </div>
        <div className="min-w-44">
          <Label className="text-xs">Módulo</Label>
          <Select value={modulo} onValueChange={setModulo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="documentos">Documentos</SelectItem>
              <SelectItem value="internacao">Internação</SelectItem>
              <SelectItem value="notificacoes">Notificações</SelectItem>
              <SelectItem value="conteudo_clinico">Conteúdo clínico</SelectItem>
              <SelectItem value="seguranca">Segurança</SelectItem>
              <SelectItem value="conformidade">Conformidade</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando registros…</p>
      ) : (data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum registro ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs">
                    {new Date(row.criado_em).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-xs">{row.user_email ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {AUDIT_ACTION_LABEL[row.acao] ?? row.acao}
                    {row.severidade !== "info" && (
                      <Badge variant="destructive" className="ml-2 text-[10px]">{row.severidade}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{row.modulo}</TableCell>
                  <TableCell className="text-xs">{row.entidade_id ?? row.entidade ?? "—"}</TableCell>
                  <TableCell className="text-xs">{row.ip ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Registros não podem ser editados nem apagados por nenhum usuário. Cada pessoa vê os próprios registros; administradores veem todos.
      </p>
    </div>
  );
}

function Compliance() {
  const { list, create } = useDataRequests();
  const { data: policies } = useRetentionPolicies();
  const { accept, hasAccepted } = useConsents(LEGAL_VERSION);
  const [tipo, setTipo] = useState(REQUEST_TYPES[0].value);
  const [descricao, setDescricao] = useState("");

  const submit = async () => {
    try {
      await create.mutateAsync({ tipo, descricao });
      setDescricao("");
      toast.success("Solicitação registrada. Resposta em até 15 dias.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível registrar.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {([
          ["termos_de_uso", "Termos de uso", TERMS_OF_USE],
          ["politica_privacidade", "Política de privacidade", PRIVACY_POLICY],
        ] as const).map(([key, title, text]) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                {title}
                <Badge variant="outline">versão {LEGAL_VERSION}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-h-64 overflow-y-auto whitespace-pre-wrap text-sm text-muted-foreground">
                {text}
              </div>
              {hasAccepted(key) ? (
                <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> Aceito</Badge>
              ) : (
                <Button size="sm" onClick={() => accept.mutate(key)} disabled={accept.isPending}>
                  Li e aceito
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Retenção de dados por módulo</CardTitle>
          <CardDescription>Prazo, base legal e se os dados são anonimizados ao expirar.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Módulo</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Base legal</TableHead>
                <TableHead>Ao expirar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(policies ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm">{p.descricao}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {p.meses_retencao >= 12
                      ? `${Math.round(p.meses_retencao / 12)} ano(s)`
                      : `${p.meses_retencao} meses`}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.base_legal}</TableCell>
                  <TableCell className="text-xs">
                    {p.anonimizar_ao_expirar ? "Anonimizar" : "Manter (guarda legal)"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Meus direitos como titular</CardTitle>
          <CardDescription>Exclusão, portabilidade, anonimização, correção ou relatório de tratamento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs">Tipo de solicitação</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REQUEST_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">Detalhes</Label>
              <Textarea rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
          </div>
          <Button size="sm" onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Enviar solicitação
          </Button>

          {(list.data ?? []).length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Aberta em</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(list.data ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">
                      {REQUEST_TYPES.find((t) => t.value === r.tipo)?.label ?? r.tipo}
                    </TableCell>
                    <TableCell className="text-xs">{new Date(r.criado_em).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-xs">{new Date(r.prazo_legal).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell><Badge variant="outline">{REQUEST_STATUS_LABEL[r.status] ?? r.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SegurancaPage() {
  const { roleLabel, needsSupervision } = usePermissions();
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl space-y-4">
      <PageMeta
        title="Segurança e conformidade | PrescriMed"
        description="Perfis de acesso, trilha de auditoria imutável, retenção de dados e direitos do titular conforme a LGPD."
        path="/app/seguranca"
      />
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Segurança e conformidade</h1>
        <p className="text-sm text-muted-foreground">
          Seu perfil: <strong>{roleLabel}</strong>
          {needsSupervision && " — documentos emitidos ficam marcados para supervisão."}
        </p>
      </header>

      <Tabs defaultValue="perfis">
        <TabsList>
          <TabsTrigger value="perfis">Perfis e permissões</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
          <TabsTrigger value="conformidade">LGPD</TabsTrigger>
        </TabsList>
        <TabsContent value="perfis" className="pt-4"><PermissionMatrix /></TabsContent>
        <TabsContent value="auditoria" className="pt-4"><AuditTrail /></TabsContent>
        <TabsContent value="conformidade" className="pt-4"><Compliance /></TabsContent>
      </Tabs>
    </div>
  );
}
