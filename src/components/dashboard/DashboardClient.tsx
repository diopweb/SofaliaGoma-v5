"use client";

import { useState, useMemo, useCallback } from "react";
import { useAppContext } from "@/hooks/useAppContext";
import { BarChart2, Package, ShoppingCart, DollarSign, Users, Tag, CreditCard, AlertCircle, Search, FileText } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SALE_STATUS } from "@/lib/constants";
import { useRouter } from "next/navigation";

export function DashboardClient() {
  const { sales, products, customers, categories, productsToReorder, openSaleModal, openProductDetailsModal, openInvoiceModal } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const searchResults = useMemo(() => {
    if (searchTerm.length < 2) return null;
    const term = searchTerm.toLowerCase();
    const foundProducts = products.filter(p => p.name.toLowerCase().includes(term));
    const foundCustomers = customers.filter(c => c.name.toLowerCase().includes(term));
    const foundSales = sales.filter(s => (s.invoiceId && s.invoiceId.toLowerCase().includes(term)) || s.customerName.toLowerCase().includes(term));
    return { products: foundProducts, customers: foundCustomers, sales: foundSales };
  }, [searchTerm, products, customers, sales]);

  const totalCredit = useMemo(() => sales.filter(s => s.status === SALE_STATUS.CREDIT).reduce((acc, s) => acc + (s.totalPrice - (s.paidAmount || 0)), 0), [sales]);
  
  const totalSalesToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sales.filter(s => s.saleDate && s.saleDate.startsWith(today)).reduce((acc, sale) => acc + sale.totalPrice, 0);
  }, [sales]);
  
  const displayedSales = useMemo(() => sales.sort((a,b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()).slice(0, 5), [sales]);

  const navigateToCustomer = useCallback((id: string) => {
    router.push(`/customers/${id}`);
    setSearchTerm('');
  }, [router]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Tableau de Bord</h1>
        <Button onClick={() => openSaleModal()} size="lg">
          <ShoppingCart className="mr-2" /> Nouvelle Vente
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input 
          type="text" 
          placeholder="Rechercher une facture, un client, un produit..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full pl-12 pr-4 py-3 h-12 text-lg rounded-full shadow-sm"
        />
      </div>

      {searchResults && (
        <Card>
          <CardHeader>
            <CardTitle>Résultats de la recherche</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {searchResults.products.length === 0 && searchResults.customers.length === 0 && searchResults.sales.length === 0 && <p>Aucun résultat trouvé.</p>}
            
            {searchResults.products.length > 0 && <div>
              <h4 className="font-semibold mb-2 text-primary">Produits</h4>
              <ul className="space-y-1 list-disc list-inside">{searchResults.products.map(p => <li key={p.id} onClick={() => openProductDetailsModal(p)} className="cursor-pointer hover:underline">{p.name}</li>)}</ul>
            </div>}
            
            {searchResults.customers.length > 0 && <div>
              <h4 className="font-semibold mb-2 text-green-600">Clients</h4>
              <ul className="space-y-1 list-disc list-inside">{searchResults.customers.map(c => <li key={c.id} onClick={() => navigateToCustomer(c.id)} className="cursor-pointer hover:underline">{c.name}</li>)}</ul>
            </div>}

            {searchResults.sales.length > 0 && <div>
              <h4 className="font-semibold mb-2 text-accent">Factures</h4>
              <ul className="space-y-1 list-disc list-inside">{searchResults.sales.map(s => <li key={s.id} onClick={() => openInvoiceModal(s)} className="cursor-pointer hover:underline">{s.invoiceId} pour {s.customerName} - {formatCurrency(s.totalPrice)}</li>)}</ul>
            </div>}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard icon={<DollarSign />} title="Ventes du Jour" value={formatCurrency(totalSalesToday)} color="border-yellow-500" />
        <StatCard icon={<CreditCard />} title="Créances" value={formatCurrency(totalCredit)} color="border-red-500" />
        <StatCard icon={<Package />} title="Produits" value={products.length} color="border-primary" />
        <StatCard icon={<Users />} title="Clients" value={customers.length} color="border-green-500" />
        <StatCard icon={<Tag />} title="Catégories" value={categories.length} color="border-indigo-500" />
        <StatCard icon={<ShoppingCart />} title="Total Ventes" value={sales.length} color="border-purple-500" />
      </div>

      {productsToReorder.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600 flex items-center"><AlertCircle className="mr-2"/>Stocks Faibles</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Stock Actuel</TableHead>
                  <TableHead>Seuil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsToReorder.slice(0, 5).map(p => (
                  <TableRow key={p.id} className="hover:bg-gray-50">
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="font-bold text-red-500">{p.quantity}</TableCell>
                    <TableCell className="text-sm text-gray-500">{p.reorderThreshold || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ventes Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facture</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedSales.map(sale => (
                <TableRow key={sale.id} className="hover:bg-gray-50">
                  <TableCell className="font-semibold">{sale.invoiceId}</TableCell>
                  <TableCell>{sale.customerName}</TableCell>
                  <TableCell className="font-medium text-green-600">{formatCurrency(sale.totalPrice)}</TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(sale.saleDate)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openInvoiceModal(sale)}>
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
