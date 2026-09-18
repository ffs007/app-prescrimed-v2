import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const LoginSection = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials"
        ? "E-mail ou senha incorretos."
        : error.message);
      return;
    }
    toast.success("Login realizado com sucesso!");
    navigate("/app", { replace: true });
  };

  return (
    <section id="entrar" className="bg-paper border-t border-ink-soft scroll-mt-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-16 py-20 lg:py-28 grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-5">
          <span className="text-[11px] font-semibold tracking-editorial uppercase text-ink-muted">
            Acesso da conta
          </span>
          <h2 className="font-serif text-3xl lg:text-4xl text-ink leading-tight">
            Entrar na PrescriMed<sup className="text-sm ml-0.5">+</sup>
          </h2>
          <p className="text-ink-muted text-sm leading-relaxed max-w-md">
            Acesso individual e seguro. Recomendado para uso em estação pessoal —
            ao usar dispositivo compartilhado, lembre-se de encerrar a sessão.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-paper border border-ink-soft p-8 lg:p-10 space-y-5"
        >
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="block text-[11px] font-semibold tracking-editorial uppercase text-ink-muted"
            >
              E-mail
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-transparent border-b border-ink-soft py-2 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-ink transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="login-password"
              className="block text-[11px] font-semibold tracking-editorial uppercase text-ink-muted"
            >
              Senha
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent border-b border-ink-soft py-2 text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:border-ink transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-paper py-3 text-[11px] font-semibold tracking-editorial uppercase hover:bg-ink-muted transition-colors disabled:opacity-60"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>

          <div className="flex items-center justify-between text-xs text-ink-muted pt-1">
            <Link to="/login" className="hover:text-ink transition-colors">
              Esqueci minha senha
            </Link>
            <Link to="/cadastro" className="hover:text-ink transition-colors">
              Criar conta
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
};

export default LoginSection;
