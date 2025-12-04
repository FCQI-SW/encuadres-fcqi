"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

type AvancesTabProps = {
  encuadreId: string;
  materiaNombre: string;
  grupo: string;
  periodo: string;
};

export default function AvancesTab({ encuadreId, materiaNombre, grupo, periodo }: AvancesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Registro de Avances
        </CardTitle>
        <CardDescription>
          Registra y da seguimiento al avance de los temas del curso
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Próximamente</p>
          <p className="text-sm">
            El módulo de registro de avances estará disponible pronto.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}