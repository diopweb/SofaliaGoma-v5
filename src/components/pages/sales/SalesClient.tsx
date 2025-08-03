
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Search,
  FileText,
  Trash2,
  Undo2,
  DollarSign
} from "lucide-react";
import { Sale } from "@/lib/definitions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SalesClientProps {
    sales: Sale[];
}

export function SalesClient({ sales }: SalesClientProps) {
  const { openInvoiceModal, handleDeleteItem, openPaymentModal } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSales = useMemo(() => {
    return sales
      .filter((sale) =>
        sale.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      )
  }, [sales, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Ventes</h1>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par N° de facture ou nom du client..."
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
              <TableHead>Payé</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.map((sale: Sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">{sale.invoiceId}</TableCell>
                <TableCell>{sale.customerName}</TableCell>
                <TableCell>{formatDate(sale.saleDate)}</TableCell>
                <TableCell>{formatCurrency(sale.totalPrice)}</TableCell>
                <TableCell className="text-green-600">{formatCurrency(sale.paidAmount)}</TableCell>
                <TableCell><Badge variant={sale.status === 'Créance' ? 'destructive' : 'default'}>{sale.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Ouvrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <DropdownMenuItem onClick={() => openInvoiceModal(sale)}>
                        <FileText className="mr-2 h-4 w-4" /> Voir Facture
                      </DropdownMenuItem>
                      {sale.status === 'Créance' && (
                        <DropdownMenuItem onClick={() => openPaymentModal(sale)}>
                            <DollarSign className="mr-2 h-4 w-4" /> Encaisser
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Undo2 className="mr-2 h-4 w-4" /> Retourner
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteItem("sales", sale.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
