
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/hooks/useAppContext";
import { Customer } from "@/lib/definitions";
import { useEffect } from "react";

const customerSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  nickname: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email({ message: "Adresse e-mail invalide." }).optional().or(z.literal('')),
  phone: z.string().optional(),
});

interface CustomerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
  onSuccess?: (newCustomer: Customer) => void;
}

export function CustomerFormModal({ open, onOpenChange, customer, onSuccess }: CustomerFormModalProps) {
  const { handleAddItem, handleEditItem } = useAppContext();

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      nickname: "",
      address: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name,
        nickname: customer.nickname || "",
        address: customer.address || "",
        email: customer.email || "",
        phone: customer.phone || "",
      });
    } else {
      form.reset({
        name: "",
        nickname: "",
        address: "",
        email: "",
        phone: "",
      });
    }
  }, [customer, form, open]);

  const onSubmit = async (values: z.infer<typeof customerSchema>) => {
    if (customer) {
      await handleEditItem("customers", customer.id, values);
    } else {
      await handleAddItem("customers", { ...values, balance: 0 }, (newCustomer) => {
        if (onSuccess) {
          onSuccess(newCustomer as Customer);
        }
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{customer ? "Modifier le client" : "Ajouter un client"}</DialogTitle>
          <DialogDescription>
            {customer ? "Modifiez les informations du client." : "Enregistrez un nouveau client dans votre base de données."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom complet</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Jean Dupont" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Surnom (Optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Jeannot" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone (Optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 77 123 45 67" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse (Optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Cité Keur Gorgui" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: client@email.com" {...field} />
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
