import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-ink text-paper">
      {/* Final CTA inside footer */}
      <div className="border-b border-paper/10">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-16 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-8">
            <p className="text-[11px] font-medium tracking-editorial uppercase text-paper/50 mb-6">
              Pronto para experimentar
            </p>
            <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-balance">
              Teste a plataforma no
              <span className="italic text-paper/70"> seu próximo atendimento.</span>
            </h2>
            <p className="mt-6 text-base text-paper/60 leading-relaxed max-w-[52ch]">
              Em poucos minutos você emite a primeira receita, exame ou atestado
              dentro de um fluxo desenhado para a rotina médica.
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-4">
            <Link
              to="/cadastro"
              className="bg-paper text-ink px-7 py-4 text-xs font-semibold tracking-editorial uppercase hover:bg-paper/90 transition-colors text-center"
            >
              Criar conta grátis
            </Link>
            <p className="text-xs text-paper/50 text-center">
              Recursos básicos gratuitos. Plano Pro opcional.
            </p>
          </div>
        </div>
      </div>

      {/* Footer meta */}
      <div className="max-w-[1200px] mx-auto px-6 lg:px-16 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <Link to="/" className="font-serif text-xl tracking-tight flex items-baseline">
          PrescriMed<sup className="text-[10px] ml-0.5 text-paper/60">+</sup>
        </Link>

        <div className="flex flex-wrap gap-6 text-[11px] uppercase tracking-editorial text-paper/60">
          <a href="#" className="hover:text-paper transition-colors">Termos</a>
          <a href="#" className="hover:text-paper transition-colors">Privacidade</a>
          <a href="#" className="hover:text-paper transition-colors">LGPD</a>
          <a href="#" className="hover:text-paper transition-colors">Contato</a>
        </div>

        <p className="text-[11px] text-paper/50">
          © {new Date().getFullYear()} PrescriMed+
        </p>
      </div>
    </footer>
  );
};

export default Footer;
