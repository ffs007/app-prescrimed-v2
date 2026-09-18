import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Cadastro from "./pages/Cadastro.tsx";
import Home from "./pages/Home.tsx";
import Patients from "./pages/Patients.tsx";
import QuickTemplates from "./pages/QuickTemplates.tsx";
import HistoryPage from "./pages/HistoryPage.tsx";
import PrescricoesPage from "./pages/PrescricoesPage";
import DocumentsPage from "./pages/DocumentsPage.tsx";
import MedicationsBrowse from "./pages/MedicationsBrowse.tsx";
import NotFound from "./pages/NotFound.tsx";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AppShell from "./components/app-shell/AppShell";
import IVDilutionAdminPage from "./modules/iv-dilution/IVDilutionAdminPage";
import NewPrescriptionPage from "./modules/prescription/mvp/NewPrescriptionPage";
import RequisitosPage from "./pages/RequisitosPage";
import SegurancaPage from "./pages/SegurancaPage";
import IndicatorsPage from "./pages/IndicatorsPage";
import InternacoesPage from "./pages/InternacoesPage";
import NotificacoesPage from "./pages/NotificacoesPage";
import ClinicalTestsPage from "./pages/ClinicalTestsPage";
import PublicDocumentPage from "./pages/PublicDocumentPage";
import ImportarLotePage from "./pages/ImportarLotePage";
import CuradoriaPage from "./pages/CuradoriaPage";
import VinculoExamesPage from "./pages/VinculoExamesPage";
import VinculoMedicamentosPage from "./pages/VinculoMedicamentosPage";
import ChecklistProtocoloPage from "./pages/ChecklistProtocoloPage";
import RevisaoDosesPage from "./pages/RevisaoDosesPage";
import EscoresTraumaPage from "./pages/EscoresTraumaPage";
import ProtocoloPSPage from "./pages/ProtocoloPSPage";
import AuditoriaProtocolosPage from "./pages/AuditoriaProtocolosPage";
import EtapasProtocoloPage from "./pages/EtapasProtocoloPage";
import IndicadoresQualidadePage from "./pages/IndicadoresQualidadePage";
import ResultadoEscorePage from "./pages/ResultadoEscorePage";
import PromocaoBasePage from "./pages/PromocaoBasePage";
import AuditoriaBaseClinicaPage from "./pages/AuditoriaBaseClinicaPage";
import RevisaoClinicaPage from "./pages/RevisaoClinicaPage";
import VinculosClinicosPage from "./pages/VinculosClinicosPage";
import MinhasPatologiasPage from "./pages/MinhasPatologiasPage";
import ProtocolosEscoresPage from "./pages/ProtocolosEscoresPage";
import AtualizacoesPage from "./pages/AtualizacoesPage";
import AssinaturaPage from "./pages/AssinaturaPage";
import AssinaturaRetornoPage from "./pages/AssinaturaRetornoPage";
import RequireSubscription from "./modules/billing/components/RequireSubscription";
import { AuthProvider } from "./components/providers/AuthProvider";

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
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Home />} />
            <Route path="prescricao/nova" element={<NewPrescriptionPage />} />
            <Route path="prescricoes" element={<PrescricoesPage />} />
            <Route path="pacientes" element={<Patients />} />
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
          <Route path="/admin/vinculos-clinicos" element={<ProtectedRoute><AdminRoute><VinculosClinicosPage /></AdminRoute></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
