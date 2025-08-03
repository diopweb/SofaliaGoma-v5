
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
import { useAppContext } from "@/hooks/useAppContext";
import { Customer } from "@/lib/definitions";
import { useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

const depositSchema = z.object({
  amount: z.coerce.number().min(1, "Le montant doit être supérieur à 0."),
});

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
}

export function DepositModal({ open, onOpenChange, customer }: DepositModalProps) {
  const { handleAddDeposit } = useAppContext();

  const form = useForm<z.infer<typeof depositSchema>>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 0,
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({ amount: 0 });
    }
  }, [open, form]);

  const onSubmit = async (values: z.infer<typeof depositSchema>) => {
    if (customer) {
      await handleAddDeposit(customer.id, values.amount);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Faire un Dépôt</DialogTitle>
          <DialogDescription>
            Ajoutez un montant au solde du client :{" "}
            <strong>{customer?.name}</strong>
          </DialogDescription>
        </DialogHeader>
        {customer && (
            <div className="text-sm">
                Solde actuel: <strong className="text-primary">{formatCurrency(customer.balance)}</strong>
            </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant du dépôt</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 10000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
