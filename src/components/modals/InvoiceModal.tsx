
"use client";

import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sale } from '@/lib/definitions';
import { useAppContext } from '@/hooks/useAppContext';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Printer, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: Sale;
}

export function InvoiceModal({ open, onOpenChange, sale }: InvoiceModalProps) {
  const { companyProfile, openPaymentModal } = useAppContext();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (printContent && (window as any).html2canvas && (window as any).jspdf) {
      (window as any).html2canvas(printContent, { scale: 2 }).then((canvas: any) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new (window as any).jspdf.jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`facture_${sale?.invoiceId}.pdf`);
      });
    }
  };

  const remainingBalance = sale ? sale.totalPrice - (sale.paidAmount || 0) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {sale && (
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Facture: {sale.invoiceId}</DialogTitle>
            <DialogDescription>
              Détails de la vente pour {sale.customerName}.
            </DialogDescription>
          </DialogHeader>
          <div ref={invoiceRef} className="p-4 bg-white text-black text-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                {companyProfile?.logo && <img src={companyProfile.logo} alt="Logo" className="h-16 mb-2" />}
                <h2 className="text-lg font-bold">{companyProfile?.name}</h2>
                <p className="text-xs">{companyProfile?.address}</p>
                <p className="text-xs">Tél: {companyProfile?.phone}</p>
              </div>
              <div className="text-right">
                <h3 className="font-bold text-lg">FACTURE</h3>
                <p className="text-xs">#{sale.invoiceId}</p>
                <p className="text-xs">Date: {formatDateTime(sale.saleDate)}</p>
              </div>
            </div>
            <div className="my-4 p-2 border-t border-b border-gray-200">
              <h4 className="font-bold">Client:</h4>
              <p className="text-xs">{sale.customerName}</p>
              {sale.customer?.address && <p className="text-xs">{sale.customer.address}</p>}
            </div>

            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead className="w-[50%]">Produit</TableHead>
                  <TableHead className="text-right">Qte</TableHead>
                  <TableHead className="text-right">P.U.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end mt-4">
              <div className="w-1/2">
                <div className="flex justify-between py-1 border-b"><span>Sous-total</span><span>{formatCurrency(sale.totalPrice + (sale.discountAmount || 0))}</span></div>
                {sale.discountAmount > 0 && <div className="flex justify-between py-1 border-b"><span>Remise</span><span>- {formatCurrency(sale.discountAmount)}</span></div>}
                {sale.vatAmount > 0 && <div className="flex justify-between py-1 border-b"><span>TVA</span><span>{formatCurrency(sale.vatAmount)}</span></div>}
                <div className="flex justify-between font-bold py-2 text-base"><span>TOTAL</span><span>{formatCurrency(sale.totalPrice)}</span></div>
                <div className="flex justify-between py-1 border-t"><span>Payé</span><span>{formatCurrency(sale.paidAmount || 0)}</span></div>
                <div className="flex justify-between font-bold text-lg text-red-600 bg-red-100 p-2 rounded"><span>Solde Restant</span><span>{formatCurrency(remainingBalance)}</span></div>
              </div>
            </div>
            <div className="text-center text-xs mt-8">
              <p>{companyProfile?.invoiceFooterMessage}</p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" /> Fermer
            </Button>
            {remainingBalance > 0 && (
              <Button type="button" variant="destructive" onClick={() => { onOpenChange(false); openPaymentModal(sale); }}>
                Payer la créance
              </Button>
            )}
            <Button type="button" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Imprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
