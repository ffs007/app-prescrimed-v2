import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageMeta from "@/components/seo/PageMeta";
import { supabase } from "@/integrations/supabase/client";

export default function RedefinirSenha() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session));
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setChecking(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("O link expirou ou não é válido. Solicite uma nova recuperação.");
      return;
    }

    toast.success("Senha redefinida com sucesso.");
    navigate("/app", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <PageMeta
        title="Redefinir senha — PrescriMed"
        description="Defina uma nova senha segura para sua conta PrescriMed."
        path="/redefinir-senha"
      />
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">PM+</span>
          <span className="text-xl font-bold text-foreground">Prescri<span className="text-primary">Med+</span></span>
        </Link>

        <h1 className="text-center text-2xl font-bold text-foreground">Criar nova senha</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Use pelo menos 8 caracteres.</p>

        {checking ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">Validando link…</p>
        ) : ready ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-confirmation">Confirmar nova senha</Label>
              <Input
                id="password-confirmation"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required
              />
            </div>
            <Button variant="hero" className="w-full" type="submit" disabled={loading}>
              {loading ? "Salvando…" : "Salvar nova senha"}
            </Button>
          </form>
        ) : (
          <div className="mt-6 space-y-4 text-center">
            <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground">
              Este link é inválido ou expirou.
            </p>
            <Button asChild variant="hero" className="w-full">
              <Link to="/recuperar-senha">Solicitar novo link</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
