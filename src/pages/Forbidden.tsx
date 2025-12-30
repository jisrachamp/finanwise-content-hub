import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>403 — Acceso denegado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tu cuenta no tiene permisos de administrador para entrar al CMS.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/login">Ir a Login</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Inicio</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
