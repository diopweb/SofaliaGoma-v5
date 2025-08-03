"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RefundsClient() {

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Remboursements</h1>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Bientôt disponible</CardTitle>
        </CardHeader>
        <CardContent>
            <p>La fonctionnalité de gestion des remboursements est en cours de développement.</p>
        </CardContent>
      </Card>
    </div>
  );
}
