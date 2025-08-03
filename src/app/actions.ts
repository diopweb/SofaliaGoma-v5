"use server"

import { getFirestore, collection, query, where, getDocs } from 'firebase-firestore';
import { app } from '@/lib/firebase';
import { suggestReorderQuantities, SuggestReorderQuantitiesInput } from '@/ai/flows/suggest-reorder-quantities';
import { Sale } from './lib/definitions';

const db = getFirestore(app);
const appId = typeof (globalThis as any).__app_id !== 'undefined' ? (globalThis as any).__app_id : 'default-app-id';

export async function getProductSales(productId: string): Promise<Sale[]> {
  try {
    const salesRef = collection(db, `artifacts/${appId}/public/data/sales`);
    const q = query(salesRef, where('items', 'array-contains-any', [{ productId }]));

    const querySnapshot = await getDocs(q);
    const sales: Sale[] = [];
    querySnapshot.forEach((doc) => {
      // This is a client-side approximation. Firestore 'array-contains-any' is not perfect.
      // We need to double-check here.
      const saleData = { id: doc.id, ...doc.data() } as Sale;
      if (saleData.items.some(item => item.productId === productId)) {
        sales.push(saleData);
      }
    });

    return sales;
  } catch (error) {
    console.error("Error fetching product sales:", error);
    throw new Error("Could not fetch product sales data.");
  }
}

export async function suggestReorderQuantitiesAction(input: SuggestReorderQuantitiesInput) {
    return await suggestReorderQuantities(input);
}
