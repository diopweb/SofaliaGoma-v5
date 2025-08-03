
"use client";

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { doc, onSnapshot, addDoc, updateDoc, deleteDoc, runTransaction, writeBatch, collection, query } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { Product, Customer, Category, Sale, CompanyProfile, CartItem, AppUser } from '@/lib/definitions';
import { SALE_STATUS } from '@/lib/constants';
import { db, appId } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

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

type DataState = {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  sales: Sale[];
  companyProfile: CompanyProfile | null;
  users: AppUser[];
}

interface AppContextType extends DataState {
  loading: boolean;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addToCart: (product: Product, quantity: number, variant?: any) => void;
  handleAddItem: (collectionName: string, data: any, onSuccess?: (newItem: any) => void) => Promise<void>;
  handleEditItem: (collectionName: string, id: string, data: any) => Promise<void>;
  handleDeleteItem: (collectionName: string, id: string) => void;
  handleAddSale: (saleData: any) => Promise<void>;
  handleMakePayment: (saleToPay: Sale, amountPaid: number, paymentType: string) => Promise<void>;
  handleAddDeposit: (customerId: string, amount: number) => Promise<void>;
  
  // Modal controls
  openProductFormModal: (product?: Product) => void;
  openCategoryFormModal: (category?: Category) => void;
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

type ModalState = {
    productForm: { open: boolean; product?: Product; };
    categoryForm: { open: boolean; category?: Category; };
    customerForm: { open: boolean; customer?: Customer; onSuccess?: (c: Customer) => void; };
    sale: { open: boolean; customer?: Customer | null; };
    payment: { open: boolean; sale?: Sale; };
    deposit: { open: boolean; customer?: Customer; };
    invoice: { open: boolean; sale?: Sale; };
    paymentReceipt: { open: boolean; data?: any; };
    depositReceipt: { open: boolean; data?: any; };
    productDetails: { open: boolean; product?: Product; };
    productSelection: { open: boolean; customerId?: string; };
    suggestReorder: { open: boolean; product?: Product; };
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<DataState>({
    products: [],
    categories: [],
    customers: [],
    sales: [],
    companyProfile: null,
    users: [],
  });
  
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [modalState, setModalState] = useState<ModalState>({
    productForm: { open: false },
    categoryForm: { open: false },
    customerForm: { open: false },
    sale: { open: false },
    payment: { open: false },
    deposit: { open: false },
    invoice: { open: false },
    paymentReceipt: { open: false },
    depositReceipt: { open: false },
    productDetails: { open: false },
    productSelection: { open: false },
    suggestReorder: { open: false },
  });

  const [confirmInfo, setConfirmInfo] = useState<{ show: boolean; message: string; onConfirm: (() => void) | null }>({ show: false, message: '', onConfirm: null });

  useEffect(() => {
    // Only subscribe to data if user is authenticated and auth is not loading
    if (!user || authLoading) {
      // If we're logged out, we should ensure loading is false.
      if (!authLoading) setLoading(false);
      return;
    }
    
    setLoading(true);

    const dataCollections: Array<{ name: keyof Omit<DataState, 'companyProfile'>}> = [
        { name: 'products' },
        { name: 'categories' },
        { name: 'customers' },
        { name: 'sales' },
        { name: 'users' },
    ];

    const unsubs = dataCollections.map(({ name }) => {
        const path = `artifacts/${appId}/public/data/${name}`;
        const q = query(collection(db, path));
        return onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setData(prev => ({ ...prev, [name]: items }));
        }, (err) => {
            console.error(`Error reading ${name}:`, err);
            toast({ variant: "destructive", title: `Erreur de chargement: ${name}`, description: "Veuillez vérifier votre connexion et réessayer." });
        });
    });

    const profileDocRef = doc(db, `artifacts/${appId}/public/data/companyProfile`, 'main');
    const unsubProfile = onSnapshot(profileDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setData(prev => ({ ...prev, companyProfile: { id: docSnap.id, ...docSnap.data() } as CompanyProfile }));
        }
    }, (err) => {
        console.error(`Error reading companyProfile:`, err);
        toast({ variant: "destructive", title: "Erreur de chargement du profil", description: "Veuillez vérifier votre connexion et réessayer." });
    });
    unsubs.push(unsubProfile);

    // Use a Promise to track when all initial data is loaded
    const allDataLoaded = Promise.all([
      new Promise(resolve => onSnapshot(query(collection(db, `artifacts/${appId}/public/data/products`)), s => resolve(s), e => resolve(e))),
      new Promise(resolve => onSnapshot(query(collection(db, `artifacts/${appId}/public/data/categories`)), s => resolve(s), e => resolve(e))),
      new Promise(resolve => onSnapshot(query(collection(db, `artifacts/${appId}/public/data/customers`)), s => resolve(s), e => resolve(e))),
      new Promise(resolve => onSnapshot(query(collection(db, `artifacts/${appId}/public/data/sales`)), s => resolve(s), e => resolve(e))),
      new Promise(resolve => onSnapshot(query(collection(db, `artifacts/${appId}/public/data/users`)), s => resolve(s), e => resolve(e))),
      new Promise(resolve => onSnapshot(doc(db, `artifacts/${appId}/public/data/companyProfile`, 'main'), s => resolve(s), e => resolve(e))),
    ]);

    allDataLoaded.then(() => {
        setLoading(false);
    });

    return () => {
        unsubs.forEach(unsub => unsub());
    };
}, [user, authLoading, toast]);


  const openModal = useCallback(<T extends keyof ModalState>(modal: T, props: Omit<ModalState[T], 'open'>) => {
    setModalState(prev => ({ ...prev, [modal]: { ...props, open: true } }));
  }, []);

  const closeModal = useCallback(<T extends keyof ModalState>(modal: T) => {
    setModalState(prev => ({ ...prev, [modal]: { open: false } }));
  }, []);

  const openProductFormModal = useCallback((product?: Product) => openModal('productForm', { product }), [openModal]);
  const openCategoryFormModal = useCallback((category?: Category) => openModal('categoryForm', { category }), [openModal]);
  const openCustomerFormModal = useCallback((customer?: Customer, onSuccess?: (newCustomer: Customer) => void) => openModal('customerForm', { customer, onSuccess }), [openModal]);
  const openSaleModal = useCallback((customer: Customer | null = null) => openModal('sale', { customer }), [openModal]);
  const openPaymentModal = useCallback((sale: Sale) => openModal('payment', { sale }), [openModal]);
  const openDepositModal = useCallback((customer: Customer) => openModal('deposit', { customer }), [openModal]);
  const openInvoiceModal = useCallback((sale: Sale) => openModal('invoice', { sale }), [openModal]);
  const openPaymentReceiptModal = useCallback((data: any) => openModal('paymentReceipt', { data }), [openModal]);
  const openDepositReceiptModal = useCallback((data: any) => openModal('depositReceipt', { data }), [openModal]);
  const openProductDetailsModal = useCallback((product: Product) => openModal('productDetails', { product }), [openModal]);
  const openProductSelectionModal = useCallback((customerId?: string) => openModal('productSelection', { customerId }), [openModal]);
  const openSuggestReorderModal = useCallback((product: Product) => openModal('suggestReorder', { product }), [openModal]);

  const showConfirm = useCallback((message: string, onConfirm: () => void) => {
    setConfirmInfo({ show: true, message, onConfirm });
  }, []);

  const handleAddSale = useCallback(async (saleData: any) => {
    if (!user) return;
    const { customerId, paymentType, items, totalPrice, discountAmount, vatAmount } = saleData;
    const customer = data.customers.find(c => c.id === customerId);
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
            
            const productUpdates = new Map<string, any>();

            for (const item of items) {
                const productRef = doc(db, `artifacts/${appId}/public/data/products`, item.id);
                const productDoc = await transaction.get(productRef);
                if (!productDoc.exists()) throw `Produit ${item.name} non trouvé !`;
                const productData = productDoc.data() as Product;


                if (item.variant) {
                    const variantIndex = productData.variants.findIndex((v: any) => v.id === item.variant.id);
                    if (variantIndex === -1 || productData.variants[variantIndex].quantity < item.quantity) {
                        throw `Stock insuffisant pour la gamme ${item.name}`;
                    }
                    const newVariants = [...productData.variants];
                    newVariants[variantIndex] = { ...newVariants[variantIndex], quantity: newVariants[variantIndex].quantity - item.quantity };
                    const newQuantity = newVariants.reduce((acc, v) => acc + v.quantity, 0);
                    transaction.update(productRef, { variants: newVariants, quantity: newQuantity });

                } else {
                    if (productData.quantity < item.quantity) {
                       throw `Stock insuffisant pour ${item.name} !`;
                    }
                    transaction.update(productRef, { quantity: productData.quantity - item.quantity });
                }
            }
            
            if (paymentType === 'Acompte Client') {
                const customerRef = doc(db, `artifacts/${appId}/public/data/customers`, customerId);
                const customerDoc = await transaction.get(customerRef);
                const customerBalance = customerDoc.data()?.balance || 0;
                if (customerBalance < totalPrice) throw "Acompte client insuffisant.";
                transaction.update(customerRef, { balance: customerBalance - totalPrice });
            }

            const lastInvoiceNumber = profileDoc.data().lastInvoiceNumber || 0;
            const newInvoiceNumber = lastInvoiceNumber + 1;
            const invoiceId = `${data.companyProfile?.invoicePrefix || 'FAC-'}${newInvoiceNumber.toString().padStart(5, '0')}`;
            const status = paymentType === 'Créance' ? SALE_STATUS.CREDIT : SALE_STATUS.COMPLETED;

            const finalSaleData = {
                invoiceId, customerId, customerName: customer.name, paymentType,
                items: items.map((i: CartItem) => ({ productId: i.id, productName: i.name, quantity: i.quantity, unitPrice: i.price, subtotal: i.price * i.quantity, variant: i.variant })),
                totalPrice, discountAmount, vatAmount, status,
                paidAmount: status === SALE_STATUS.COMPLETED ? totalPrice : 0,
                saleDate: new Date().toISOString(), userId: user.id, userPseudo: user.pseudo
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
  }, [user, data.customers, data.companyProfile, toast, openInvoiceModal, setCart]);

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

  const handleMakePayment = useCallback(async (saleToPay: Sale, amountPaid: number, paymentType: string) => {
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
      const customer = data.customers.find(c => c.id === saleToPay.customerId);

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
        companyProfile: data.companyProfile,
      });
      closeModal('payment');
    } catch (error: any) {
      console.error("Payment Error:", error);
      toast({ variant: "destructive", title: "Erreur lors du paiement", description: error.message });
    }
  }, [data.customers, data.companyProfile, toast, openPaymentReceiptModal, closeModal]);

  const handleAddDeposit = useCallback(async (customerId: string, amount: number) => {
    const customer = data.customers.find(c => c.id === customerId);
    if (!customer || !amount || amount <= 0) {
      toast({ variant: "destructive", title: "Informations invalides." });
      return;
    }
    const newBalance = (customer.balance || 0) + Number(amount);
    try {
      const customerRef = doc(db, `artifacts/${appId}/public/data/customers`, customerId);
      await updateDoc(customerRef, { balance: newBalance });
      toast({ title: "Succès", description: "Dépôt enregistré !" });
      closeModal('deposit');
      openDepositReceiptModal({
        customer: { ...customer, balance: newBalance },
        amount: Number(amount),
        companyProfile: data.companyProfile,
        depositDate: new Date().toISOString(),
        customerId
      });
    } catch (error: any) {
      console.error("Deposit Error:", error);
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  }, [data.companyProfile, data.customers, toast, openDepositReceiptModal, closeModal]);
  
  const value = {
    ...data,
    loading,
    cart, setCart, addToCart,
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
      <ProductFormModal 
        open={modalState.productForm.open} 
        onOpenChange={(open) => !open && closeModal('productForm')} 
        product={modalState.productForm.product} 
        allProducts={data.products || []} 
        allCategories={data.categories || []} 
      />
      <CategoryFormModal 
        open={modalState.categoryForm.open} 
        onOpenChange={(open) => !open && closeModal('categoryForm')} 
        category={modalState.categoryForm.category} 
        allCategories={data.categories || []} 
      />
      <CustomerFormModal 
        open={modalState.customerForm.open} 
        onOpenChange={(open) => !open && closeModal('customerForm')} 
        customer={modalState.customerForm.customer} 
        onSuccess={modalState.customerForm.onSuccess} 
      />
      <SaleModal 
        open={modalState.sale.open} 
        onOpenChange={(open) => !open && closeModal('sale')} 
        customer={modalState.sale.customer} 
      />
      <PaymentModal 
        open={modalState.payment.open} 
        onOpenChange={(open) => !open && closeModal('payment')} 
        sale={modalState.payment.sale} 
      />
      <DepositModal 
        open={modalState.deposit.open} 
        onOpenChange={(open) => !open && closeModal('deposit')} 
        customer={modalState.deposit.customer} 
      />
      <InvoiceModal 
        open={modalState.invoice.open} 
        onOpenChange={(open) => !open && closeModal('invoice')} 
        sale={modalState.invoice.sale} 
      />
      <PaymentReceiptModal 
        open={modalState.paymentReceipt.open} 
        onOpenChange={(open) => !open && closeModal('paymentReceipt')} 
        receiptData={modalState.paymentReceipt.data} 
      />
      <DepositReceiptModal 
        open={modalState.depositReceipt.open} 
        onOpenChange={(open) => !open && closeModal('depositReceipt')} 
        receiptData={modalState.depositReceipt.data} 
      />
      <ProductDetailModal 
        open={modalState.productDetails.open} 
        onOpenChange={(open) => !open && closeModal('productDetails')} 
        product={modalState.productDetails.product}
      />
      <ProductSelectionModal 
        open={modalState.productSelection.open} 
        onOpenChange={(open) => !open && closeModal('productSelection')} 
        preselectedCustomerId={modalState.productSelection.customerId} 
      />
      <SuggestReorderModal 
        open={modalState.suggestReorder.open} 
        onOpenChange={(open) => !open && closeModal('suggestReorder')} 
        product={modalState.suggestReorder.product}
      />

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
