import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus } from "lucide-react";

export default function Patients() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <p className="text-sm text-muted-foreground">
          Identifique o paciente diretamente na tela de prescrição.
        </p>
      </div>
      <Card>
        <CardContent className="p-8 flex flex-col items-center text-center gap-3">
          <Users className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground max-w-md">
            No PrescriMed, cada atendimento começa pela "Nova Prescrição". Você pode
            cadastrar dados mínimos do paciente (nome, idade, peso, alergias) ou seguir
            sem cadastro completo, com aviso de segurança.
          </p>
          <Button asChild>
            <Link to="/app/prescricao/nova">
              <Plus className="h-4 w-4 mr-1" /> Nova Prescrição
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
