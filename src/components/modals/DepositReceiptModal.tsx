
"use client";

import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CompanyProfile, Customer } from "@/lib/definitions";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Printer, X } from "lucide-react";

interface DepositReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptData?: {
    customer: Customer;
    amount: number;
    companyProfile: CompanyProfile | null;
    depositDate: string;
  };
}

export function DepositReceiptModal({ open, onOpenChange, receiptData }: DepositReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (printContent && (window as any).html2canvas && (window as any).jspdf) {
      (window as any).html2canvas(printContent).then((canvas: any) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new (window as any).jspdf.jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`recu_depot_${receiptData?.customer?.name}.pdf`);
      });
    }
  };

  if (!receiptData) return null;

  const { customer, amount, companyProfile, depositDate } = receiptData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reçu de Dépôt</DialogTitle>
          <DialogDescription>
            Ceci est le reçu pour le dépôt effectué par {customer.name}.
          </DialogDescription>
        </DialogHeader>
        <div ref={receiptRef} className="p-4 bg-white text-black">
          <div className="text-center mb-4">
            {companyProfile?.logo && <img src={companyProfile.logo} alt="Logo" className="h-16 mx-auto mb-2" />}
            <h2 className="text-lg font-bold">{companyProfile?.name}</h2>
            <p className="text-xs">{companyProfile?.address}</p>
            <p className="text-xs">Tél: {companyProfile?.phone}</p>
          </div>
          <div className="border-t border-b border-dashed my-2 py-2">
            <h3 className="text-center font-bold text-base mb-2">REÇU DE DÉPÔT</h3>
            <p className="flex justify-between text-xs"><span>Date:</span><span>{formatDateTime(depositDate)}</span></p>
            <p className="flex justify-between text-xs"><span>Client:</span><span>{customer.name}</span></p>
          </div>
          <div className="my-2 text-xs">
            <div className="flex justify-between font-bold text-sm bg-gray-200 p-2">
                <span>Montant Déposé</span>
                <span>{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between mt-2 p-2">
                <span>Ancien Solde</span>
                <span>{formatCurrency((customer.balance || 0) - amount)}</span>
            </div>
             <div className="flex justify-between font-bold p-2 text-base">
                <span>Nouveau Solde</span>
                <span>{formatCurrency(customer.balance)}</span>
            </div>
          </div>
          <div className="text-center text-xs mt-4">
            <p>{companyProfile?.invoiceFooterMessage}</p>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" /> Fermer
          </Button>
          <Button type="button" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Imprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

