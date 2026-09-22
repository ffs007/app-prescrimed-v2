import { useEffect, useState, type ComponentType } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ArrowRightLeft,
  BarChart3,
  BedDouble,
  BookOpen,
  Calculator,
  ChevronDown,
  ClipboardCheck,
  Clock,
  ContactRound,
  FilePlus2,
  FileText,
  FlaskConical,
  History,
  Home,
  Pill,
  RefreshCw,
  Settings,
  Siren,
  CreditCard,
  Sparkles,
  Stethoscope,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePermissions } from "@/modules/security/hooks/usePermissions";

interface NavigationItem {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
  comingSoon?: boolean;
}

const groups: Array<{ label: string; items: NavigationItem[] }> = [
  {
    label: "Atendimento",
    items: [
      { title: "Início", url: "/app", icon: Home, end: true },
      { title: "Nova Prescrição", url: "/app/prescricao/nova", icon: FilePlus2 },
      {
        title: "Pacientes / Prontuário Longitudinal",
        url: "/app/pacientes",
        icon: ContactRound,
        comingSoon: true,
      },
    ],
  },
  {
    label: "Documentos",
    items: [
      { title: "Documentos", url: "/app/documentos", icon: FileText },
      { title: "Prescrições", url: "/app/prescricoes", icon: FilePlus2 },
      { title: "Histórico", url: "/app/historico", icon: History },
      { title: "Internações (AIH)", url: "/app/internacoes", icon: BedDouble },
      { title: "Notificações", url: "/app/notificacoes", icon: Siren },
    ],
  },
  {
    label: "Base clínica",
    items: [
      { title: "Medicamentos", url: "/app/medicamentos", icon: Pill },
      { title: "Minhas Patologias", url: "/app/patologias", icon: Stethoscope },
      { title: "Modelos Rápidos", url: "/app/modelos", icon: Sparkles },
      { title: "Protocolos & Escores", url: "/app/protocolos-escores", icon: BookOpen },
      { title: "Calculadoras de escores", url: "/app/escores", icon: Calculator },
    ],
  },
  {
    label: "Qualidade clínica",
    items: [
      { title: "Atualizações", url: "/app/atualizacoes", icon: RefreshCw },
      { title: "Indicadores", url: "/app/indicadores", icon: BarChart3 },
      { title: "Auditoria de Protocolos", url: "/app/auditoria-protocolos", icon: ClipboardCheck },
    ],
  },
  {
    label: "Conta",
    items: [
      { title: "Assinatura", url: "/app/assinatura", icon: CreditCard },
    ],
  },
];

const adminItems: NavigationItem[] = [
  { title: "Configurações", url: "/admin/iv-dilution", icon: Settings },
  { title: "Importar Lote", url: "/admin/importar-lote", icon: Upload },
  { title: "Curadoria", url: "/admin/curadoria", icon: ClipboardCheck },
  { title: "Medicamentos por doença", url: "/admin/medicamentos-patologia", icon: ClipboardCheck },
  { title: "Exames por patologia", url: "/admin/exames-patologia", icon: FlaskConical },
  { title: "Promoção da Base", url: "/admin/promocao-base", icon: ArrowRightLeft },
  { title: "Auditoria da Base", url: "/admin/auditoria-base", icon: ClipboardCheck },
  { title: "Revisão Clínica", url: "/admin/revisao-clinica", icon: ClipboardCheck },
  { title: "Testes Clínicos", url: "/app/testes-clinicos", icon: FlaskConical },
];

function NavButton({ item, collapsed }: { item: NavigationItem; collapsed: boolean }) {
  if (collapsed) {
    return (
      <NavLink to={item.url} end={item.end}>
        <item.icon className="h-4 w-4" />
        <span>{item.title}</span>
      </NavLink>
    );
  }
  return (
    <NavLink to={item.url} end={item.end} className="flex w-full items-center gap-2 justify-between">
      <span className="flex items-center gap-2 min-w-0">
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{item.title}</span>
      </span>
      {item.comingSoon && (
        <Badge variant="outline" className="shrink-0 text-[9px] px-1.5 py-0 text-ink-faint border-ink-soft/80">
          <Clock className="h-2.5 w-2.5 mr-0.5" />
          Em breve
        </Badge>
      )}
    </NavLink>
  );
}

function NavigationGroup({ label, items, collapsed }: { label: string; items: NavigationItem[]; collapsed: boolean }) {
  const { pathname } = useLocation();
  const containsActive = items.some((item) =>
    item.end ? pathname === item.url : pathname === item.url || pathname.startsWith(`${item.url}/`),
  );
  const [open, setOpen] = useState(containsActive || label === "Atendimento");

  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  const isActive = (item: NavigationItem) =>
    item.end ? pathname === item.url : pathname === item.url || pathname.startsWith(`${item.url}/`);

  if (collapsed) {
    return (
      <SidebarGroup className="py-1">
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={isActive(item)} tooltip={item.title}>
                  <NavButton item={item} collapsed={true} />
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <SidebarGroup className="py-1">
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="group/trigger flex w-full cursor-pointer items-center justify-between">
            <span>{label}</span>
            <ChevronDown className="transition-transform group-data-[state=closed]/trigger:-rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item)}>
                    <NavButton item={item} collapsed={false} />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export default function AppSidebar() {
  const { state } = useSidebar();
  const { can } = usePermissions();
  const collapsed = state === "collapsed";
  const visibleGroups = can("configuracoes.sistema")
    ? [...groups, { label: "Administração", items: adminItems }]
    : groups;

  return (
    <Sidebar collapsible="icon" className="hidden md:flex">
      <SidebarContent>
        {visibleGroups.map((group) => (
          <NavigationGroup key={group.label} {...group} collapsed={collapsed} />
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
