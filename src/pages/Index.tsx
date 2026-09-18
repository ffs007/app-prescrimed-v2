import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import TrustSection from "@/components/landing/TrustSection";
import ModulesSection from "@/components/landing/ModulesSection";
import PainPointsSection from "@/components/landing/PainPointsSection";
import StepsSection from "@/components/landing/StepsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import LoginSection from "@/components/landing/LoginSection";
import Footer from "@/components/landing/Footer";
import PageMeta from "@/components/seo/PageMeta";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="PrescriMed — Prescrição rápida para urgência e emergência"
        description="Receitas, atestados e exames em segundos. Doses calculadas, alertas clínicos e modelos prontos para médicos de pronto atendimento."
        path="/"
      />
      <Navbar />
      <main>
        <HeroSection />
        <PainPointsSection />
        <ModulesSection />
        <StepsSection />
        <FeaturesSection />
        <TestimonialsSection />
        <TrustSection />
        <PricingSection />
        <FAQSection />
        <LoginSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
