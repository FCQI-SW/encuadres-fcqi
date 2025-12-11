"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function PreviewAdPage() {
  const router = useRouter();
  const params = useSearchParams();
  const titulo = params.get("titulo") ?? "";
  const mensaje = params.get("mensaje") ?? "";

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        ← Volver
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Vista Previa del Mensaje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h2 className="font-semibold">Título</h2>
            <p className="p-4 bg-gray-50 rounded border">{titulo}</p>
          </div>
          <div>
            <h2 className="font-semibold">Mensaje</h2>
            <p className="p-4 bg-gray-50 rounded border whitespace-pre-wrap">
              {mensaje}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
