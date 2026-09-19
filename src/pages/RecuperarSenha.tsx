import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageMeta from "@/components/seo/PageMeta";
import { supabase } from "@/integrations/supabase/client";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);

    if (error) {
      toast.error("Não foi possível enviar o link. Tente novamente em instantes.");
      return;
    }

    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <PageMeta
        title="Recuperar senha — PrescriMed"
        description="Receba por e-mail um link seguro para redefinir sua senha do PrescriMed."
        path="/recuperar-senha"
      />
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">PM+</span>
          <span className="text-xl font-bold text-foreground">Prescri<span className="text-primary">Med+</span></span>
        </Link>

        <h1 className="text-center text-2xl font-bold text-foreground">Recuperar senha</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {sent ? "Verifique sua caixa de entrada e o spam." : "Enviaremos um link seguro para seu e-mail."}
        </p>

        {sent ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground">
              Se existir uma conta para <strong>{email}</strong>, o link de redefinição será enviado.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
              Reenviar para outro e-mail
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recovery-email">E-mail</Label>
              <Input
                id="recovery-email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoFocus
              />
            </div>
            <Button variant="hero" className="w-full" type="submit" disabled={loading}>
              {loading ? "Enviando…" : "Enviar link de recuperação"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">Voltar ao login</Link>
        </p>
      </div>
    </div>
  );
}
