import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/85 backdrop-blur-xl border-b border-ink-soft">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 lg:px-16 h-16">
        <Link to="/" className="font-serif text-xl tracking-tight text-ink flex items-baseline">
          PrescriMed<sup className="text-[10px] ml-0.5 text-ink-muted">+</sup>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-10 text-sm font-medium text-ink-muted">
          <a href="#modulos" className="hover:text-ink transition-colors">Módulos</a>
          <a href="#metodologia" className="hover:text-ink transition-colors">Metodologia</a>
          <a href="#funcionalidades" className="hover:text-ink transition-colors">Funcionalidades</a>
          <a href="#planos" className="hover:text-ink transition-colors">Planos</a>
          <a href="#faq" className="hover:text-ink transition-colors">Perguntas</a>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <a
            href="#entrar"
            className="text-sm font-medium text-ink-muted hover:text-ink transition-colors uppercase tracking-wide"
          >
            Entrar
          </a>
          <Link
            to="/cadastro"
            className="bg-ink text-paper px-5 py-2.5 text-[11px] font-semibold tracking-editorial uppercase hover:bg-ink-muted transition-colors"
          >
            Criar conta
          </Link>
        </div>

        {/* Mobile actions */}
        <div className="md:hidden flex items-center gap-4">
          <a
            href="#entrar"
            className="text-[11px] font-semibold tracking-editorial uppercase text-ink"
          >
            Entrar
          </a>
          <button className="text-ink" onClick={() => setOpen(!open)} aria-label="Abrir menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-paper/95 backdrop-blur-xl border-b border-ink-soft px-6 pb-6 pt-2 space-y-4">
          <a href="#modulos" onClick={() => setOpen(false)} className="block text-sm text-ink-muted py-2">Módulos</a>
          <a href="#metodologia" onClick={() => setOpen(false)} className="block text-sm text-ink-muted py-2">Metodologia</a>
          <a href="#funcionalidades" onClick={() => setOpen(false)} className="block text-sm text-ink-muted py-2">Funcionalidades</a>
          <a href="#planos" onClick={() => setOpen(false)} className="block text-sm text-ink-muted py-2">Planos</a>
          <a href="#faq" onClick={() => setOpen(false)} className="block text-sm text-ink-muted py-2">Perguntas</a>
          <div className="pt-2 space-y-3">
            <a
              href="#entrar"
              onClick={() => setOpen(false)}
              className="block text-center border border-ink-soft px-5 py-3 text-[11px] font-semibold tracking-editorial uppercase text-ink"
            >
              Entrar
            </a>
            <Link
              to="/cadastro"
              onClick={() => setOpen(false)}
              className="block text-center bg-ink text-paper px-5 py-3 text-[11px] font-semibold tracking-editorial uppercase"
            >
              Criar conta
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
