"use client";

import { useState, useMemo } from "react";
import { useAppContext } from "@/hooks/useAppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, DollarSign } from "lucide-react";
import { Sale } from "@/lib/definitions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SALE_STATUS } from "@/lib/constants";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function DebtsClient() {
  const { sales, openPaymentModal } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");

  const debtSales = useMemo(() => {
    return sales
      .filter((sale) => sale.status === SALE_STATUS.CREDIT)
      .sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime());
  }, [sales]);

  const filteredDebts = useMemo(() => {
    return debtSales.filter(
      (sale) =>
        sale.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [debtSales, searchTerm]);
  
  const totalDebt = useMemo(() => {
    return debtSales.reduce((acc, sale) => acc + (sale.totalPrice - (sale.paidAmount || 0)), 0);
  }, [debtSales]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Créances</h1>
      </div>
      
       <Card>
          <CardHeader>
            <CardTitle>Total des Créances</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-destructive">{formatCurrency(totalDebt)}</p>
          </CardContent>
        </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher une créance..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Facture</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Montant Restant</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDebts.map((sale: Sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">{sale.invoiceId}</TableCell>
                <TableCell>{sale.customerName}</TableCell>
                <TableCell>{formatDate(sale.saleDate)}</TableCell>
                <TableCell>{formatCurrency(sale.totalPrice)}</TableCell>
                <TableCell className="font-semibold text-destructive">
                  {formatCurrency(sale.totalPrice - (sale.paidAmount || 0))}
                </TableCell>
                <TableCell className="text-right">
                  <Button onClick={() => openPaymentModal(sale)}>
                    <DollarSign className="mr-2 h-4 w-4" /> Encaisser
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
