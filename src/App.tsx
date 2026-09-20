import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
const Index = lazy(() => import("./pages/Index.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const Cadastro = lazy(() => import("./pages/Cadastro.tsx"));
const RecuperarSenha = lazy(() => import("./pages/RecuperarSenha.tsx"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha.tsx"));
const Home = lazy(() => import("./pages/Home.tsx"));
const QuickTemplates = lazy(() => import("./pages/QuickTemplates.tsx"));
const HistoryPage = lazy(() => import("./pages/HistoryPage.tsx"));
const PrescricoesPage = lazy(() => import("./pages/PrescricoesPage"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage.tsx"));
const MedicationsBrowse = lazy(() => import("./pages/MedicationsBrowse.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AppShell from "./components/app-shell/AppShell";
const IVDilutionAdminPage = lazy(() => import("./modules/iv-dilution/IVDilutionAdminPage"));
const NewPrescriptionPage = lazy(() => import("./modules/prescription/mvp/NewPrescriptionPage"));
const RequisitosPage = lazy(() => import("./pages/RequisitosPage"));
const SegurancaPage = lazy(() => import("./pages/SegurancaPage"));
const IndicatorsPage = lazy(() => import("./pages/IndicatorsPage"));
const InternacoesPage = lazy(() => import("./pages/InternacoesPage"));
const NotificacoesPage = lazy(() => import("./pages/NotificacoesPage"));
const ClinicalTestsPage = lazy(() => import("./pages/ClinicalTestsPage"));
const PublicDocumentPage = lazy(() => import("./pages/PublicDocumentPage"));
const ImportarLotePage = lazy(() => import("./pages/ImportarLotePage"));
const CuradoriaPage = lazy(() => import("./pages/CuradoriaPage"));
const VinculoExamesPage = lazy(() => import("./pages/VinculoExamesPage"));
const VinculoMedicamentosPage = lazy(() => import("./pages/VinculoMedicamentosPage"));
const ChecklistProtocoloPage = lazy(() => import("./pages/ChecklistProtocoloPage"));
const RevisaoDosesPage = lazy(() => import("./pages/RevisaoDosesPage"));
const EscoresTraumaPage = lazy(() => import("./pages/EscoresTraumaPage"));
const EscoresServidorPage = lazy(() => import("./pages/EscoresServidorPage"));
const ProtocoloPSPage = lazy(() => import("./pages/ProtocoloPSPage"));
const AuditoriaProtocolosPage = lazy(() => import("./pages/AuditoriaProtocolosPage"));
const EtapasProtocoloPage = lazy(() => import("./pages/EtapasProtocoloPage"));
const IndicadoresQualidadePage = lazy(() => import("./pages/IndicadoresQualidadePage"));
const ResultadoEscorePage = lazy(() => import("./pages/ResultadoEscorePage"));
const PromocaoBasePage = lazy(() => import("./pages/PromocaoBasePage"));
const AuditoriaBaseClinicaPage = lazy(() => import("./pages/AuditoriaBaseClinicaPage"));
const RevisaoClinicaPage = lazy(() => import("./pages/RevisaoClinicaPage"));
const MinhasPatologiasPage = lazy(() => import("./pages/MinhasPatologiasPage"));
const ProtocolosEscoresPage = lazy(() => import("./pages/ProtocolosEscoresPage"));
const AtualizacoesPage = lazy(() => import("./pages/AtualizacoesPage"));
const AssinaturaPage = lazy(() => import("./pages/AssinaturaPage"));
const AssinaturaRetornoPage = lazy(() => import("./pages/AssinaturaRetornoPage"));
import RequireSubscription from "./modules/billing/components/RequireSubscription";
import { AuthProvider } from "./components/providers/AuthProvider";
const LegalPage = lazy(() => import("./pages/LegalPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<div className="grid min-h-[40vh] place-items-center" role="status" aria-label="Carregando tela"><span className="size-6 animate-spin rounded-full border-2 border-muted border-t-primary" /></div>}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/termos" element={<LegalPage kind="terms" />} />
          <Route path="/privacidade" element={<LegalPage kind="privacy" />} />

          <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Home />} />
            <Route path="prescricao/nova" element={<NewPrescriptionPage />} />
            <Route path="prescricoes" element={<PrescricoesPage />} />
            <Route path="modelos" element={<QuickTemplates />} />
            <Route path="medicamentos" element={<MedicationsBrowse />} />
            <Route path="patologias" element={<MinhasPatologiasPage />} />
            <Route path="historico" element={<HistoryPage />} />
            <Route path="documentos" element={<DocumentsPage />} />
            <Route path="internacoes" element={<RequireSubscription recurso="Internações e AIH"><InternacoesPage /></RequireSubscription>} />
            <Route path="notificacoes" element={<RequireSubscription recurso="Notificações compulsórias"><NotificacoesPage /></RequireSubscription>} />
            <Route path="atualizacoes" element={<RequireSubscription recurso="Atualizações clínicas automáticas"><AtualizacoesPage /></RequireSubscription>} />
            <Route path="assinatura" element={<AssinaturaPage />} />
            <Route path="assinatura/retorno" element={<AssinaturaRetornoPage />} />
            <Route path="indicadores" element={<IndicatorsPage />} />
            <Route path="requisitos" element={<RequisitosPage />} />
            <Route path="seguranca" element={<SegurancaPage />} />
            <Route path="escores-trauma" element={<EscoresTraumaPage />} />
            <Route path="escores" element={<EscoresServidorPage />} />
            <Route path="protocolos-escores" element={<ProtocolosEscoresPage />} />
            <Route path="protocolos" element={<ProtocoloPSPage />} />
            <Route path="protocolos/:codigo" element={<ProtocoloPSPage />} />
            <Route path="auditoria-protocolos" element={<AuditoriaProtocolosPage />} />
            <Route path="protocolos-etapas" element={<AdminRoute><EtapasProtocoloPage /></AdminRoute>} />
            <Route path="indicadores-qualidade" element={<IndicadoresQualidadePage />} />
            <Route path="testes-clinicos" element={<AdminRoute><ClinicalTestsPage /></AdminRoute>} />
          </Route>

          <Route path="/d/:token" element={<PublicDocumentPage />} />
          <Route path="/escore/:token" element={<ResultadoEscorePage />} />

          <Route path="/admin/iv-dilution" element={<ProtectedRoute><AdminRoute><IVDilutionAdminPage /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/importar-lote" element={<ProtectedRoute><AdminRoute><ImportarLotePage /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/curadoria" element={<ProtectedRoute><AdminRoute><CuradoriaPage /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/medicamentos-patologia" element={<ProtectedRoute><AdminRoute><VinculoMedicamentosPage /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/exames-patologia" element={<ProtectedRoute><AdminRoute><VinculoExamesPage /></AdminRoute></ProtectedRoute>} />
          <Route path="/protocolo-checklist" element={<ProtectedRoute><AdminRoute><ChecklistProtocoloPage /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/revisao-doses" element={<ProtectedRoute><AdminRoute><RevisaoDosesPage /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/promocao-base" element={<ProtectedRoute><AdminRoute><PromocaoBasePage /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/auditoria-base" element={<ProtectedRoute><AdminRoute><AuditoriaBaseClinicaPage /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/revisao-clinica" element={<ProtectedRoute><AdminRoute><RevisaoClinicaPage /></AdminRoute></ProtectedRoute>} />
          <Route path="/admin/vinculos-clinicos" element={<ProtectedRoute><AdminRoute><VinculoMedicamentosPage /></AdminRoute></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
