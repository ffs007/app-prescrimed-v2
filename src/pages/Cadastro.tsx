import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PageMeta from "@/components/seo/PageMeta";

const Cadastro = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/app", { replace: true });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("already registered")
        ? "Este e-mail já está cadastrado."
        : error.message);
      return;
    }
    toast.success("Conta criada com sucesso!");
    navigate("/app", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <PageMeta
        title="Criar conta grátis no PrescriMed"
        description="Cadastre-se gratuitamente no PrescriMed e prescreva com rapidez e segurança em pronto atendimento, urgência e emergência."
        path="/cadastro"
      />
      <div className="w-full max-w-md bg-card rounded-2xl p-8 shadow-lg border border-border">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">PM+</span>
          <span className="font-bold text-xl text-foreground">
            Prescri<span className="text-primary">Med+</span>
          </span>
        </Link>

        <h1 className="text-2xl font-bold text-foreground text-center">Criar conta grátis</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Comece gratuitamente, sem cartão de crédito
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" type="text" placeholder="Dr. João Silva" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" minLength={8} />
          </div>
          <Button variant="hero" className="w-full" type="submit" disabled={loading}>
            {loading ? "Criando…" : "Criar conta"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-center text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Cadastro;
