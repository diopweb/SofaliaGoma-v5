
"use client";

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken, User } from 'firebase/auth';
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, runTransaction, writeBatch } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { Product, Customer, Category, Sale, CompanyProfile, CartItem } from '@/lib/definitions';
import { SALE_STATUS } from '@/lib/constants';
import { auth, db, appId } from '@/lib/firebase';

import { ProductFormModal } from '@/components/modals/ProductFormModal';
import { CategoryFormModal } from '@/components/modals/CategoryFormModal';
import { CustomerFormModal } from '@/components/modals/CustomerFormModal';
import { SaleModal } from '@/components/modals/SaleModal';
import { PaymentModal } from '@/components/modals/PaymentModal';
import { DepositModal } from '@/components/modals/DepositModal';
import { InvoiceModal } from '@/components/modals/InvoiceModal';
import { PaymentReceiptModal } from '@/components/modals/PaymentReceiptModal';
import { DepositReceiptModal } from '@/components/modals/DepositReceiptModal';
import { ProductDetailModal } from '@/components/modals/ProductDetailModal';
import { ProductSelectionModal } from '@/components/modals/ProductSelectionModal';
import { SuggestReorderModal } from '@/components/modals/SuggestReorderModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface AppContextType {
  user: User | null;
  companyProfile: CompanyProfile | null;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addToCart: (product: Product, quantity: number, variant?: any) => void;
  handleAddItem: (collectionName: string, data: any, onSuccess?: (newItem: any) => void) => Promise<void>;
  handleEditItem: (collectionName: string, id: string, data: any) => Promise<void>;
  handleDeleteItem: (collectionName: string, id: string) => void;
  handleAddSale: (saleData: any, products: Product[], customers: Customer[]) => Promise<void>;
  handleMakePayment: (saleToPay: Sale, amountPaid: number, paymentType: string, customers: Customer[]) => Promise<void>;
  handleAddDeposit: (customerId: string, amount: number, customers: Customer[]) => Promise<void>;
  
  // Modal controls
  openProductFormModal: (product?: Product, products?: Product[], categories?: Category[]) => void;
  openCategoryFormModal: (category?: Category, categories?: Category[]) => void;
  openCustomerFormModal: (customer?: Customer, onSuccess?: (newCustomer: Customer) => void) => void;
  openSaleModal: (customer?: Customer | null) => void;
  openPaymentModal: (sale: Sale) => void;
  openDepositModal: (customer: Customer) => void;
  openInvoiceModal: (sale: Sale) => void;
  openPaymentReceiptModal: (receiptData: any) => void;
  openDepositReceiptModal: (receiptData: any) => void;
  openProductDetailsModal: (product: Product) => void;
  openProductSelectionModal: (preselectedCustomerId?: string) => void;
  openSuggestReorderModal: (product: Product) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modal States
  const [productFormModalOpen, setProductFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [modalProducts, setModalProducts] = useState<Product[]>([]);
  const [modalCategories, setModalCategories] = useState<Category[]>([]);
  
  const [categoryFormModalOpen, setCategoryFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);

  const [customerFormModalOpen, setCustomerFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
  const [customerSuccessCb, setCustomerSuccessCb] = useState<((newCustomer: Customer) => void) | undefined>(undefined);

  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [preselectedCustomer, setPreselectedCustomer] = useState<Customer | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [saleToPay, setSaleToPay] = useState<Sale | undefined>(undefined);

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [customerForDeposit, setCustomerForDeposit] = useState<Customer | undefined>(undefined);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [saleForInvoice, setSaleForInvoice] = useState<Sale | undefined>(undefined);

  const [paymentReceiptModalOpen, setPaymentReceiptModalOpen] = useState(false);
  const [paymentReceiptData, setPaymentReceiptData] = useState<any>(undefined);

  const [depositReceiptModalOpen, setDepositReceiptModalOpen] = useState(false);
  const [depositReceiptData, setDepositReceiptData] = useState<any>(undefined);
  
  const [productDetailsModalOpen, setProductDetailsModalOpen] = useState(false);
  const [detailedProduct, setDetailedProduct] = useState<Product | undefined>(undefined);

  const [productSelectionModalOpen, setProductSelectionModalOpen] = useState(false);
  const [preselectedCustomerIdForSelection, setPreselectedCustomerIdForSelection] = useState<string | undefined>(undefined);

  const [suggestReorderModalOpen, setSuggestReorderModalOpen] = useState(false);
  const [productForSuggestion, setProductForSuggestion] = useState<Product | undefined>(undefined);

  const [confirmInfo, setConfirmInfo] = useState<{ show: boolean; message: string; onConfirm: (() => void) | null }>({ show: false, message: '', onConfirm: null });

  // Authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
      } else {
        try {
          const token = (globalThis as any).__initial_auth_token;
          if (token) {
            await signInWithCustomToken(auth, token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error("Auth Error:", error);
          toast({ variant: "destructive", title: "Erreur d'authentification" });
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [toast]);
  
  useEffect(() => {
    if (!isAuthReady) return;
    const profileDocRef = doc(db, `artifacts/${appId}/public/data/companyProfile`, 'main');
    const unsubProfile = onSnapshot(profileDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setCompanyProfile({ id: docSnap.id, ...docSnap.data() } as CompanyProfile);
      }
    });

    return () => unsubProfile();
  }, [isAuthReady]);

  const openInvoiceModal = useCallback((sale: Sale) => { setSaleForInvoice(sale); setInvoiceModalOpen(true); }, []);
  const openPaymentReceiptModal = useCallback((data: any) => { setPaymentReceiptData(data); setPaymentReceiptModalOpen(true); }, []);
  const openDepositReceiptModal = useCallback((data: any) => { setDepositReceiptData(data); setDepositReceiptModalOpen(true); }, []);

  const handleAddSale = useCallback(async (saleData: any, products: Product[], customers: Customer[]) => {
    if (!user) return;
    const { customerId, paymentType, items, totalPrice, discountAmount, vatAmount } = saleData;
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        toast({ variant: "destructive", title: "Client non trouvé !" });
        return;
    }

    try {
        const newSaleRef = doc(collection(db, `artifacts/${appId}/public/data/sales`));
        const profileRef = doc(db, `artifacts/${appId}/public/data/companyProfile`, 'main');

        const newSaleData = await runTransaction(db, async (transaction) => {
            const profileDoc = await transaction.get(profileRef);
            if (!profileDoc.exists()) throw "Profil de l'entreprise introuvable.";

            const productRefs = items.map((item: CartItem) => doc(db, `artifacts/${appId}/public/data/products`, item.id));
            
            // Note: In a real high-concurrency app, it's better to read products inside the transaction.
            // For this app's purpose, using the passed `products` list is an optimization to reduce reads.
            const productsData = products.filter(p => productRefs.some(ref => ref.id === p.id));

            for (const item of items) {
                const productData = products.find(p => p.id === item.id);
                if (!productData) throw `Produit ${item.name} non trouvé !`;

                if (item.variant) {
                    const variantIndex = productData.variants.findIndex(v => v.id === item.variant.id);
                    if (variantIndex === -1 || productData.variants[variantIndex].quantity < item.quantity) {
                        throw `Stock insuffisant pour la gamme ${item.name}`;
                    }
                } else if (productData.quantity < item.quantity) {
                    throw `Stock insuffisant pour ${item.name} !`;
                }
            }
            
            const batch = writeBatch(db);

            for (const item of items) {
                const productData = products.find(p => p.id === item.id);
                const productRef = doc(db, `artifacts/${appId}/public/data/products`, item.id);
                if (item.variant) {
                    const newVariants = [...productData.variants];
                    const variantIndex = newVariants.findIndex(v => v.id === item.variant.id);
                    newVariants[variantIndex].quantity -= item.quantity;
                    batch.update(productRef, { variants: newVariants });
                } else {
                    const newQuantity = productData.quantity - item.quantity;
                    batch.update(productRef, { quantity: newQuantity });
                }
            }
            await batch.commit();

            if (paymentType === 'Acompte Client') {
                const customerBalance = customer.balance || 0;
                if (customerBalance < totalPrice) throw "Acompte client insuffisant.";
                const customerRef = doc(db, `artifacts/${appId}/public/data/customers`, customerId);
                transaction.update(customerRef, { balance: customerBalance - totalPrice });
            }

            const lastInvoiceNumber = profileDoc.data().lastInvoiceNumber || 0;
            const newInvoiceNumber = lastInvoiceNumber + 1;
            const invoiceId = `${companyProfile?.invoicePrefix || 'FAC-'}${newInvoiceNumber.toString().padStart(5, '0')}`;
            const status = paymentType === 'Créance' ? SALE_STATUS.CREDIT : SALE_STATUS.COMPLETED;

            const finalSaleData = {
                invoiceId, customerId, customerName: customer.name, paymentType,
                items: items.map((i: CartItem) => ({ productId: i.id, productName: i.name, quantity: i.quantity, unitPrice: i.price, subtotal: i.price * i.quantity, variant: i.variant })),
                totalPrice, discountAmount, vatAmount, status,
                paidAmount: status === SALE_STATUS.COMPLETED ? totalPrice : 0,
                saleDate: new Date().toISOString(), userId: user.uid, userPseudo: 'Admin'
            };
            transaction.set(newSaleRef, finalSaleData);
            transaction.update(profileRef, { lastInvoiceNumber: newInvoiceNumber });
            return finalSaleData;
        });
        
        setCart([]);
        openInvoiceModal({ ...newSaleData, id: newSaleRef.id, customer });

    } catch (error: any) {
        console.error("Sale Transaction Error:", error);
        toast({ variant: "destructive", title: "Erreur", description: error.toString() });
    }
}, [user, companyProfile, toast, openInvoiceModal, setCart]);
  
  // Modal Openers
  const openProductFormModal = useCallback((product?: Product, products?: Product[], categories?: Category[]) => { 
      setEditingProduct(product);
      setModalProducts(products || []);
      setModalCategories(categories || []);
      setProductFormModalOpen(true); 
  }, []);
  const openCategoryFormModal = useCallback((category?: Category, categories?: Category[]) => { 
      setEditingCategory(category);
      setModalCategories(categories || []);
      setCategoryFormModalOpen(true);
  }, []);
  const openCustomerFormModal = useCallback((customer?: Customer, onSuccess?: (newCustomer: Customer) => void) => { 
    setEditingCustomer(customer); 
    setCustomerSuccessCb(() => onSuccess); 
    setCustomerFormModalOpen(true); 
  }, []);
  const openSaleModal = useCallback((customer: Customer | null = null) => { setPreselectedCustomer(customer); setSaleModalOpen(true); }, []);
  const openPaymentModal = useCallback((sale: Sale) => { setSaleToPay(sale); setPaymentModalOpen(true); }, []);
  const openDepositModal = useCallback((customer: Customer) => { setCustomerForDeposit(customer); setDepositModalOpen(true); }, []);
  const openProductDetailsModal = useCallback((product: Product) => { setDetailedProduct(product); setProductDetailsModalOpen(true); }, []);
  const openProductSelectionModal = useCallback((preselectedCustomerId?: string) => { setPreselectedCustomerIdForSelection(preselectedCustomerId); setProductSelectionModalOpen(true); }, []);
  const openSuggestReorderModal = useCallback((product: Product) => { setProductForSuggestion(product); setSuggestReorderModalOpen(true); }, []);

  const showConfirm = useCallback((message: string, onConfirm: () => void) => {
    setConfirmInfo({ show: true, message, onConfirm });
  }, []);

  const addToCart = useCallback((product: Product, quantity: number, variant: any = null) => {
    setCart(currentCart => {
        const cartItemId = variant ? `${product.id}-${variant.id}` : product.id;
        const existingItem = currentCart.find(item => item.cartId === cartItemId);
        
        if (existingItem) {
            return currentCart.map(item => item.cartId === cartItemId ? { ...item, quantity: item.quantity + quantity } : item);
        }

        const newItem: CartItem = {
            ...product,
            cartId: cartItemId,
            name: variant ? `${product.name} - ${variant.name}` : product.name,
            price: variant ? (product.basePrice || product.price) + (variant.priceModifier || 0) : product.price,
            quantity,
            variants: product.variants || [],
            packItems: product.packItems || [],
            type: product.type,
            variant: variant ? { id: variant.id, name: variant.name } : null
        };
        return [...currentCart, newItem];
    });
  }, []);

  // CRUD Functions
  const handleAddItem = useCallback(async (collectionName: string, data: any, onSuccess?: (newItem: any) => void) => {
    if (!user) return;
    try {
      const path = `artifacts/${appId}/public/data/${collectionName}`;
      const docRef = await addDoc(collection(db, path), data);
      toast({ title: "Succès", description: "Élément ajouté avec succès." });
      if (onSuccess) onSuccess({ id: docRef.id, ...data });
    } catch (error: any) {
      console.error("Add Error:", error);
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  }, [user, toast]);

  const handleEditItem = useCallback(async (collectionName: string, id: string, data: any) => {
    if (!user) return;
    try {
      const path = `artifacts/${appId}/public/data/${collectionName}`;
      await updateDoc(doc(db, path, id), data);
      toast({ title: "Succès", description: "Élément mis à jour." });
    } catch (error: any) {
      console.error("Edit Error:", error);
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  }, [user, toast]);

  const handleDeleteItem = useCallback((collectionName: string, id: string) => {
    showConfirm("Êtes-vous sûr de vouloir supprimer cet élément ?", async () => {
      if (!user) return;
      try {
        const path = `artifacts/${appId}/public/data/${collectionName}`;
        await deleteDoc(doc(db, path, id));
        toast({ title: "Succès", description: "Élément supprimé." });
      } catch (error: any) {
        console.error("Delete Error:", error);
        toast({ variant: "destructive", title: "Erreur", description: error.message });
      }
    });
  }, [user, toast, showConfirm]);

  const handleMakePayment = useCallback(async (saleToPay: Sale, amountPaid: number, paymentType: string, customers: Customer[]) => {
    const currentPaidAmount = saleToPay.paidAmount || 0;
    const remainingBalance = saleToPay.totalPrice - currentPaidAmount;

    if (amountPaid > remainingBalance) {
      toast({ variant: "destructive", title: "Montant invalide", description: "Le montant payé ne peut pas dépasser le solde restant." });
      return;
    }

    const newPaidAmount = currentPaidAmount + amountPaid;
    const isFullyPaid = newPaidAmount >= saleToPay.totalPrice;
    const newStatus = isFullyPaid ? SALE_STATUS.COMPLETED : SALE_STATUS.CREDIT;

    try {
      const batch = writeBatch(db);
      const saleRef = doc(db, `artifacts/${appId}/public/data/sales`, saleToPay.id);
      const customer = customers.find(c => c.id === saleToPay.customerId);

      if (paymentType === 'Acompte Client') {
        if (!customer || (customer.balance || 0) < amountPaid) {
          toast({ variant: "destructive", title: "Acompte client insuffisant." });
          return;
        }
        const customerRef = doc(db, `artifacts/${appId}/public/data/customers`, saleToPay.customerId);
        batch.update(customerRef, { balance: customer.balance - amountPaid });
      }

      const paymentData = {
        saleId: saleToPay.id,
        invoiceId: saleToPay.invoiceId,
        customerName: saleToPay.customerName,
        amount: amountPaid,
        paymentType,
        paymentDate: new Date().toISOString()
      };
      batch.set(doc(collection(db, `artifacts/${appId}/public/data/payments`)), paymentData);
      batch.update(saleRef, { paidAmount: newPaidAmount, status: newStatus });
      await batch.commit();

      openPaymentReceiptModal({
        ...paymentData,
        customer: customer,
        remainingBalance: saleToPay.totalPrice - newPaidAmount,
        companyProfile,
      });
      setPaymentModalOpen(false);
    } catch (error: any) {
      console.error("Payment Error:", error);
      toast({ variant: "destructive", title: "Erreur lors du paiement", description: error.message });
    }
  }, [companyProfile, toast, openPaymentReceiptModal]);

  const handleAddDeposit = useCallback(async (customerId: string, amount: number, customers: Customer[]) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || !amount || amount <= 0) {
      toast({ variant: "destructive", title: "Informations invalides." });
      return;
    }
    const newBalance = (customer.balance || 0) + Number(amount);
    try {
      const customerRef = doc(db, `artifacts/${appId}/public/data/customers`, customerId);
      await updateDoc(customerRef, { balance: newBalance });
      toast({ title: "Succès", description: "Dépôt enregistré !" });
      setDepositModalOpen(false);
      openDepositReceiptModal({
        customer: { ...customer, balance: newBalance },
        amount: Number(amount),
        companyProfile,
        depositDate: new Date().toISOString(),
        customerId
      });
    } catch (error: any) {
      console.error("Deposit Error:", error);
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  }, [companyProfile, toast, openDepositReceiptModal]);
  
  const value = {
    user, companyProfile, cart, setCart, addToCart,
    handleAddItem, handleEditItem, handleDeleteItem,
    handleAddSale, handleMakePayment, handleAddDeposit,
    openProductFormModal, openCategoryFormModal, openCustomerFormModal,
    openSaleModal, openPaymentModal, openDepositModal, openInvoiceModal,
    openPaymentReceiptModal, openDepositReceiptModal, openProductDetailsModal,
    openProductSelectionModal, openSuggestReorderModal
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      
      {/* Modals */}
      <ProductFormModal open={productFormModalOpen} onOpenChange={setProductFormModalOpen} product={editingProduct} allProducts={modalProducts} allCategories={modalCategories} />
      <CategoryFormModal open={categoryFormModalOpen} onOpenChange={setCategoryFormModalOpen} category={editingCategory} allCategories={modalCategories} />
      <CustomerFormModal open={customerFormModalOpen} onOpenChange={setCustomerFormModalOpen} customer={editingCustomer} onSuccess={customerSuccessCb} />
      <SaleModal open={saleModalOpen} onOpenChange={setSaleModalOpen} customer={preselectedCustomer} />
      <PaymentModal open={paymentModalOpen} onOpenChange={setPaymentModalOpen} sale={saleToPay} />
      <DepositModal open={depositModalOpen} onOpenChange={setDepositModalOpen} customer={customerForDeposit} />
      <InvoiceModal open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen} sale={saleForInvoice} />
      <PaymentReceiptModal open={paymentReceiptModalOpen} onOpenChange={setPaymentReceiptModalOpen} receiptData={paymentReceiptData} />
      <DepositReceiptModal open={depositReceiptModalOpen} onOpenChange={setDepositReceiptModalOpen} receiptData={depositReceiptData} />
      <ProductDetailModal open={productDetailsModalOpen} onOpenChange={setProductDetailsModalOpen} product={detailedProduct}/>
      <ProductSelectionModal open={productSelectionModalOpen} onOpenChange={setProductSelectionModalOpen} preselectedCustomerId={preselectedCustomerIdForSelection} />
      <SuggestReorderModal open={suggestReorderModalOpen} onOpenChange={setSuggestReorderModalOpen} product={productForSuggestion}/>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmInfo.show} onOpenChange={(open) => !open && setConfirmInfo({ ...confirmInfo, show: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation requise</AlertDialogTitle>
            <AlertDialogDescription>{confirmInfo.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmInfo({ show: false, message: '', onConfirm: null })}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              confirmInfo.onConfirm?.();
              setConfirmInfo({ show: false, message: '', onConfirm: null });
            }}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppContext.Provider>
  );
}
