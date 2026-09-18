import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import AppSidebar from "./AppSidebar";
import MobileBottomNav from "./MobileBottomNav";
import { useBetaSettings } from "@/modules/beta/hooks/useBetaSettings";
import BetaBadge from "@/modules/beta/BetaBadge";
import BetaTermsGate from "@/modules/beta/BetaTermsGate";
import FeedbackButton from "@/modules/beta/feedback/FeedbackButton";
import ChatbotWidget from "@/modules/ai/ChatbotWidget";
import UnifiedSearchDialog from "@/modules/search/UnifiedSearchDialog";
import UsageTracker from "@/modules/usage/UsageTracker";
import { useSubscription } from "@/hooks/useSubscription";
import InstallAppBanner from "./InstallAppBanner";

export default function AppShell() {
  const navigate = useNavigate();
  const { settings } = useBetaSettings();
  const betaAtivo = !!settings?.modo_beta_ativo;
  const [searchOpen, setSearchOpen] = useState(false);
  const { isActive: planoAtivo } = useSubscription();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <SidebarProvider>
      <UsageTracker />
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          <InstallAppBanner />
          <header className="h-14 flex items-center justify-between border-b bg-card px-3 sticky top-0 z-30">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger />
              <NavLink to="/app" className="font-semibold tracking-tight truncate">
                PrescriMed
              </NavLink>
              {betaAtivo && <BetaBadge />}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchOpen(true)}
                aria-label="Abrir busca unificada"
              >
                <Search className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Buscar</span>
                <kbd className="ml-2 hidden md:inline text-[10px] text-muted-foreground">Ctrl K</kbd>
              </Button>
              <Button size="sm" onClick={() => navigate("/app/prescricao/nova")}>
                <Plus className="h-4 w-4 mr-1" /> Nova Prescrição
              </Button>
            </div>
          </header>
          <main className="flex-1 pb-20 md:pb-4">
            <Outlet />
          </main>
          <MobileBottomNav />
          {planoAtivo && <ChatbotWidget />}
          <UnifiedSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
          {betaAtivo && <BetaTermsGate />}
          {betaAtivo && <FeedbackButton />}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

