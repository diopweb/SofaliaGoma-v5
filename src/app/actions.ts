"use server"

import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { suggestReorderQuantities, SuggestReorderQuantitiesInput } from '@/ai/flows/suggest-reorder-quantities';
import { Sale } from './lib/definitions';

const db = getFirestore(app);
const appId = typeof (globalThis as any).__app_id !== 'undefined' ? (globalThis as any).__app_id : 'default-app-id';

export async function getProductSales(productId: string): Promise<Sale[]> {
  try {
    const salesRef = collection(db, `artifacts/${appId}/public/data/sales`);
    // Firestore's array-contains-any is not suitable for searching within an array of objects.
    // A proper solution would require restructuring data or using a different query approach.
    // For now, we fetch all sales and filter client-side, which is inefficient for large datasets.
    const querySnapshot = await getDocs(salesRef);
    const sales: Sale[] = [];
    querySnapshot.forEach((doc) => {
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
