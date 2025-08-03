
"use client";

import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken, User } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, query, addDoc, updateDoc, deleteDoc, runTransaction, setDoc, writeBatch } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { Product, Customer, Category, Sale, Payment, CompanyProfile, CartItem } from '@/lib/definitions';
import { SALE_STATUS, PRODUCT_TYPES } from '@/lib/constants';

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

const firebaseConfig = typeof (globalThis as any).__firebase_config !== 'undefined' ? JSON.parse((globalThis as any).__firebase_config) : {};
const appId = typeof (globalThis as any).__app_id !== 'undefined' ? (globalThis as any).__app_id : 'default-app-id';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

interface AppContextType {
  user: User | null;
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  categories: Category[];
  payments: Payment[];
  companyProfile: CompanyProfile | null;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addToCart: (product: Product, quantity: number, variant?: any) => void;
  productsToReorder: (Product | any)[];
  handleAddItem: (collectionName: string, data: any, onSuccess?: (newItem: any) => void) => Promise<void>;
  handleEditItem: (collectionName: string, id: string, data: any) => Promise<void>;
  handleDeleteItem: (collectionName: string, id: string) => void;
  handleSaveProfile: (profileData: Partial<CompanyProfile>) => Promise<void>;
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modal States
  const [productFormModalOpen, setProductFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  
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

  // Firestore subscriptions
  useEffect(() => {
    if (!isAuthReady) return;
    
    const collectionsToSubscribe = [
      { name: 'products', setter: setProducts },
      { name: 'customers', setter: setCustomers },
      { name: 'categories', setter: setCategories },
      { name: 'payments', setter: setPayments },
      { name: 'sales', setter: setSales }
    ];

    const unsubscribers = collectionsToSubscribe.map(({ name, setter }) => {
      const path = `artifacts/${appId}/public/data/${name}`;
      const q = query(collection(db, path));
      return onSnapshot(q, snapshot => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setter(items as any);
      }, err => console.error(`Error reading ${name}:`, err));
    });

    const profileDocRef = doc(db, `artifacts/${appId}/public/data/companyProfile`, 'main');
    const unsubProfile = onSnapshot(profileDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setCompanyProfile({ id: docSnap.id, ...docSnap.data() } as CompanyProfile);
      } else {
        const defaultProfile: Omit<CompanyProfile, 'id'> = {
          name: "SwiftSale",
          address: "Dakar - Sénégal",
          phone: "+221776523381",
          logo: null,
          invoicePrefix: "FAC-",
          refundPrefix: "REM-",
          depositPrefix: "DEP-",
          invoiceFooterMessage: "Merci pour votre achat !",
          lastInvoiceNumber: 0
        };
        setDoc(profileDocRef, defaultProfile);
      }
    });

    unsubscribers.push(unsubProfile);

    return () => unsubscribers.forEach(unsub => unsub && unsub());
  }, [isAuthReady]);

  const productsToReorder = useMemo(() => {
    const toReorder: (Product | any)[] = [];
    products.forEach(p => {
        if (p.type === PRODUCT_TYPES.VARIANT) {
            p.variants?.forEach(v => {
                if (v.quantity <= (v.reorderThreshold || 0) && v.quantity > 0) {
                    toReorder.push({ id: `${p.id}-${v.id}`, name: `${p.name} - ${v.name}`, quantity: v.quantity, reorderThreshold: v.reorderThreshold || 0 });
                }
            })
        } else if (p.type === PRODUCT_TYPES.SIMPLE && p.quantity <= (p.reorderThreshold || 0) && p.quantity > 0) {
             toReorder.push(p);
        }
    });
    return toReorder;
  }, [products]);

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

  const handleSaveProfile = useCallback(async (profileData: Partial<CompanyProfile>) => {
    if (!user) return;
    try {
      const profileDocRef = doc(db, `artifacts/${appId}/public/data/companyProfile`, 'main');
      await setDoc(profileDocRef, profileData, { merge: true });
      toast({ title: "Succès", description: "Profil de l'entreprise mis à jour." });
    } catch (error: any) {
      console.error("Profile Save Error:", error);
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    }
  }, [user, toast]);

  const handleAddSale = useCallback(async (saleData: any) => {
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
            const productDocs = await Promise.all(productRefs.map((ref: any) => transaction.get(ref)));
            const productsData = productDocs.map(d => d.data());

            for (const [index, item] of items.entries()) {
                const productData = productsData[index] as Product;
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

            for (const [index, item] of items.entries()) {
                const productData = productsData[index] as Product;
                const productRef = doc(db, `artifacts/${appId}/public/data/products`, item.id);
                if (item.variant) {
                    const newVariants = [...productData.variants];
                    const variantIndex = newVariants.findIndex(v => v.id === item.variant.id);
                    newVariants[variantIndex].quantity -= item.quantity;
                    transaction.update(productRef, { variants: newVariants });
                } else {
                    const newQuantity = productData.quantity - item.quantity;
                    transaction.update(productRef, { quantity: newQuantity });
                }
            }

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
}, [user, customers, companyProfile, toast, openInvoiceModal]);


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

      if (paymentType === 'Acompte Client') {
        const customer = customers.find(c => c.id === saleToPay.customerId);
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
        customer: customers.find(c => c.id === saleToPay.customerId),
        remainingBalance: saleToPay.totalPrice - newPaidAmount,
        companyProfile,
      });
      setPaymentModalOpen(false);
    } catch (error: any) {
      console.error("Payment Error:", error);
      toast({ variant: "destructive", title: "Erreur lors du paiement", description: error.message });
    }
  }, [customers, companyProfile, toast, openPaymentReceiptModal]);

  const handleAddDeposit = useCallback(async (customerId: string, amount: number) => {
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
  }, [customers, companyProfile, toast, openDepositReceiptModal]);

  // Modal Openers
  const openProductFormModal = useCallback((product?: Product) => { setEditingProduct(product); setProductFormModalOpen(true); }, []);
  const openCategoryFormModal = useCallback((category?: Category) => { setEditingCategory(category); setCategoryFormModalOpen(true); }, []);
  const openCustomerFormModal = useCallback((customer?: Customer, onSuccess?: (newCustomer: Customer) => void) => { 
    setEditingCustomer(customer); 
    setCustomerSuccessCb(() => onSuccess); 
    setCustomerFormModalOpen(true); 
  }, []);
  const openSaleModal = useCallback((customer: Customer | null = null) => { setPreselectedCustomer(customer); setSaleModalOpen(true); }, []);
  const openPaymentModal = useCallback((sale: Sale) => { setSaleToPay(sale); setPaymentModalOpen(true); }, []);
  const openDepositModal = useCallback((customer: Customer) => { setCustomerForDeposit(customer); setDepositModalOpen(true); }, []);
  const openInvoiceModal = useCallback((sale: Sale) => { setSaleForInvoice(sale); setInvoiceModalOpen(true); }, []);
  const openPaymentReceiptModal = useCallback((data: any) => { setPaymentReceiptData(data); setPaymentReceiptModalOpen(true); }, []);
  const openDepositReceiptModal = useCallback((data: any) => { setDepositReceiptData(data); setDepositReceiptModalOpen(true); }, []);
  const openProductDetailsModal = useCallback((product: Product) => { setDetailedProduct(product); setProductDetailsModalOpen(true); }, []);
  const openProductSelectionModal = useCallback((preselectedCustomerId?: string) => { setPreselectedCustomerIdForSelection(preselectedCustomerId); setProductSelectionModalOpen(true); }, []);
  const openSuggestReorderModal = useCallback((product: Product) => { setProductForSuggestion(product); setSuggestReorderModalOpen(true); }, []);
  

  const value = {
    user, products, customers, sales, categories, payments, companyProfile,
    cart, setCart, addToCart, productsToReorder,
    handleAddItem, handleEditItem, handleDeleteItem, handleSaveProfile,
    handleAddSale, handleMakePayment, handleAddDeposit,
    openProductFormModal, openCategoryFormModal, openCustomerFormModal,
    openSaleModal, openPaymentModal, openDepositModal, openInvoiceModal,
    openPaymentReceiptModal, openDepositReceiptModal, openProductDetailsModal,
    openProductSelectionModal, openSuggestReorderModal
  };

  if (!isAuthReady || !companyProfile) {
    return <div className="flex justify-center items-center h-screen bg-background">Chargement de SwiftSale...</div>;
  }

  return (
    <AppContext.Provider value={value}>
      {children}
      
      {/* Modals */}
      <ProductFormModal open={productFormModalOpen} onOpenChange={setProductFormModalOpen} product={editingProduct} />
      <CategoryFormModal open={categoryFormModalOpen} onOpenChange={setCategoryFormModalOpen} category={editingCategory} />
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
