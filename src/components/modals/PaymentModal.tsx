
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppContext } from "@/hooks/useAppContext";
import { Customer, Sale } from "@/lib/definitions";
import { PAYMENT_TYPES } from "@/lib/constants";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db, appId } from "@/lib/firebase";

const paymentSchema = z.object({
  amount: z.coerce.number().min(1, "Le montant doit être supérieur à 0."),
  paymentType: z.string().min(1, "Le type de paiement est requis."),
});

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: Sale;
}

export function PaymentModal({ open, onOpenChange, sale }: PaymentModalProps) {
  const { handleMakePayment } = useAppContext();
  const [customers, setCustomers] = useState<Customer[]>([]);

  const remainingBalance = useMemo(() => {
    if (!sale) return 0;
    return sale.totalPrice - (sale.paidAmount || 0);
  }, [sale]);

  useEffect(() => {
    if(!open) return;
    const unsub = onSnapshot(query(collection(db, `artifacts/${appId}/public/data/customers`)), (snapshot) => {
        setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    });
    return () => unsub();
  }, [open]);

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema.refine(data => data.amount <= remainingBalance, {
        message: "Le montant ne peut pas dépasser le solde restant.",
        path: ["amount"],
    })),
    defaultValues: {
      amount: 0,
      paymentType: PAYMENT_TYPES[0],
    },
  });

  useEffect(() => {
    if (sale) {
      form.reset({
        amount: remainingBalance,
        paymentType: PAYMENT_TYPES[0],
      });
    } else {
       form.reset({
        amount: 0,
        paymentType: PAYMENT_TYPES[0],
      });
    }
  }, [sale, open, remainingBalance, form]);

  const onSubmit = async (values: z.infer<typeof paymentSchema>) => {
    if (sale) {
      await handleMakePayment(sale, values.amount, values.paymentType, customers);
    }
    onOpenChange(false);
  };
  
  const availablePaymentTypes = PAYMENT_TYPES.filter(type => type !== 'Créance');


  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Effectuer un Paiement</DialogTitle>
          <DialogDescription>
            Régler la créance pour la facture <strong>{sale.invoiceId}</strong> de{" "}
            <strong>{sale.customerName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="text-sm">
            Solde Restant: <strong className="text-destructive">{formatCurrency(remainingBalance)}</strong>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant à Payer</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de Paiement</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type de paiement" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       {availablePaymentTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer Paiement</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
