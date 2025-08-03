
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAppContext } from "@/hooks/useAppContext";
import { Customer, CartItem, Product } from "@/lib/definitions";
import { PAYMENT_TYPES } from "@/lib/constants";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { PlusCircle, Trash2, UserPlus, X, ShoppingCart } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';


const saleSchema = z.object({
  customerId: z.string().min(1, "Un client est requis."),
  paymentType: z.string().min(1, "Le type de paiement est requis."),
  discountAmount: z.coerce.number().min(0).default(0),
  vatAmount: z.coerce.number().min(0).default(0),
});

interface SaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
}

export function SaleModal({ open, onOpenChange, customer: preselectedCustomer }: SaleModalProps) {
  const { cart, setCart, handleAddSale, openCustomerFormModal, openProductSelectionModal } = useAppContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      customerId: "",
      paymentType: PAYMENT_TYPES[0],
      discountAmount: 0,
      vatAmount: 0,
    },
  });
  
  useEffect(() => {
    if(!open) return;

    const unsubCustomers = onSnapshot(query(collection(db, `artifacts/${appId}/public/data/customers`)), (snapshot) => {
        setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    });

    const unsubProducts = onSnapshot(query(collection(db, `artifacts/${appId}/public/data/products`)), (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    return () => {
        unsubCustomers();
        unsubProducts();
    };
  }, [open]);

  const discountAmount = form.watch("discountAmount");
  
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.quantity, 0), [cart]);
  const total = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);

  useEffect(() => {
    if (preselectedCustomer) {
      form.setValue("customerId", preselectedCustomer.id);
      setSelectedCustomerId(preselectedCustomer.id);
    } else {
        form.resetField("customerId");
        setSelectedCustomerId(null);
    }
  }, [preselectedCustomer, form, open]);

  const handleQuantityChange = (cartId: string, newQuantity: number) => {
    setCart(currentCart => currentCart.map(item => item.cartId === cartId ? { ...item, quantity: Math.max(1, newQuantity)} : item).filter(item => item.quantity > 0));
  }

  const handleRemoveItem = (cartId: string) => {
    setCart(currentCart => currentCart.filter(item => item.cartId !== cartId));
  }

  const handleNewCustomerSuccess = (newCustomer: Customer) => {
    setCustomers(c => [...c, newCustomer]);
    form.setValue("customerId", newCustomer.id);
    setSelectedCustomerId(newCustomer.id);
  }

  const onSubmit = async (values: z.infer<typeof saleSchema>) => {
    if (cart.length === 0) {
        // Maybe show toast
        return;
    }
    await handleAddSale({
        ...values,
        items: cart,
        totalPrice: total,
    }, products, customers);
    form.reset();
    onOpenChange(false);
  };
  
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Finaliser la Vente</DialogTitle>
          <DialogDescription>Vérifiez le panier et les informations de paiement.</DialogDescription>
        </DialogHeader>
        
        {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4"/>
                <h3 className="text-xl font-semibold">Votre panier est vide</h3>
                <p className="text-muted-foreground mb-4">Ajoutez des produits pour continuer.</p>
                <Button onClick={() => {onOpenChange(false); openProductSelectionModal()}}>
                    <PlusCircle className="mr-2"/> Ajouter des produits
                </Button>
            </div>
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col md:flex-row gap-8 overflow-hidden">
            <div className="md:w-2/3 flex flex-col">
                <h3 className="font-semibold mb-2">Panier</h3>
                <ScrollArea className="flex-1 -mx-4">
                    <Table className="mx-4">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50%]">Produit</TableHead>
                                <TableHead>Qte</TableHead>
                                <TableHead>Prix</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cart.map(item => (
                                <TableRow key={item.cartId}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>
                                        <Input type="number" value={item.quantity} onChange={e => handleQuantityChange(item.cartId, parseInt(e.target.value))} className="w-16 h-8"/>
                                    </TableCell>
                                    <TableCell>{formatCurrency(item.price)}</TableCell>
                                    <TableCell>{formatCurrency(item.price * item.quantity)}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.cartId)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
                 <Button type="button" variant="outline" className="mt-4" onClick={() => {onOpenChange(false); openProductSelectionModal()}}>
                    <PlusCircle className="mr-2"/> Ajouter d'autres produits
                </Button>
            </div>

            <div className="md:w-1/3 flex flex-col space-y-4">
                <h3 className="font-semibold">Informations Client & Paiement</h3>
                <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Client</FormLabel>
                            <div className="flex gap-2">
                                <Select onValueChange={(value) => { field.onChange(value); setSelectedCustomerId(value); }} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Sélectionner un client"/></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button type="button" variant="outline" size="icon" onClick={() => openCustomerFormModal(undefined, handleNewCustomerSuccess)}>
                                    <UserPlus/>
                                </Button>
                            </div>
                            {selectedCustomer && selectedCustomer.balance > 0 && (
                                <p className="text-xs text-green-600 mt-1">Acompte disponible: {formatCurrency(selectedCustomer.balance)}</p>
                            )}
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
                            <FormControl><SelectTrigger><SelectValue placeholder="Choisir un type"/></SelectTrigger></FormControl>
                            <SelectContent>
                                {PAYMENT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="discountAmount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Remise</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-2 text-sm p-4 bg-secondary rounded-lg">
                    <div className="flex justify-between"><span>Sous-total:</span><span>{formatCurrency(subtotal)}</span></div>
                    <div className="flex justify-between"><span>Remise:</span><span className="text-destructive">- {formatCurrency(discountAmount)}</span></div>
                    <div className="flex justify-between font-bold text-lg"><span>TOTAL:</span><span>{formatCurrency(total)}</span></div>
                </div>

                <DialogFooter className="mt-auto !justify-between">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}><X className="mr-2"/>Annuler</Button>
                    <Button type="submit">Valider la Vente</Button>
                </DialogFooter>
            </div>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
