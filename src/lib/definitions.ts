

export interface AppUser {
  id: string;
  email: string;
  role: 'admin' | 'seller';
  pseudo: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  priceModifier: number;
  quantity: number;
  reorderThreshold?: number;
}

export interface PackItem {
  productId: string;
  name: string;
  quantity: number;
  variant?: {
    id: string;
    name: string;
  }
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  basePrice?: number;
  quantity: number;
  reorderThreshold?: number;
  categoryId?: string;
  photoURL?: string | null;
  type: 'simple' | 'pack' | 'variant';
  variants: ProductVariant[];
  packItems: PackItem[];
}

export interface Category {
  id: string;
  name: string;
  parentId?: string | null;
}

export interface Customer {
  id: string;
  name: string;
  nickname?: string;
  address?: string;
  email?: string;
  phone?: string;
  balance?: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  variant?: {
    id: string;
    name: string;
  } | null;
}

export interface Sale {
  id: string;
  invoiceId: string;
  customerId: string;
  customerName: string;
  paymentType: string;
  items: SaleItem[];
  totalPrice: number;
  discountAmount: number;
  vatAmount: number;
  status: string;
  paidAmount?: number;
  saleDate: string;
  userId: string;
  userPseudo: string;
  customer?: Customer;
}

export interface Payment {
  id: string;
  saleId: string;
  invoiceId: string;
  customerName: string;
  amount: number;
  paymentType: string;
  paymentDate: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  address: string;
  phone: string;
  logo: string | null;
  invoicePrefix: string;
  refundPrefix: string;
  depositPrefix: string;
  invoiceFooterMessage: string;
  lastInvoiceNumber: number;
}

export interface CartItem {
  id: string;
  cartId: string;
  name: string;
  description?: string;
  price: number;
  quantity: number; // This is cart quantity, not stock quantity
  categoryId?: string;
  photoURL?: string | null;
  type: 'simple' | 'pack' | 'variant';
  variants: ProductVariant[];
  packItems: PackItem[];
  variant?: { id: string; name: string; } | null;
}
