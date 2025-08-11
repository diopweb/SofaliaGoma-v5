
"use server"

import { getDb } from '@/lib/firebase';
import { suggestReorderQuantities, SuggestReorderQuantitiesInput } from '@/ai/flows/suggest-reorder-quantities';
import { Sale } from '@/lib/definitions';
import * as admin from 'firebase-admin';

export async function getProductSales(productId: string): Promise<Sale[]> {
  try {
    const db = getDb() as admin.firestore.Firestore;
    const salesRef = db.collection('sales');
    const q = salesRef.where('productIds', 'array-contains', productId);
    const querySnapshot = await q.get();
    const sales: Sale[] = [];
    querySnapshot.forEach((doc: admin.firestore.DocumentData) => {
      sales.push({ id: doc.id, ...doc.data() } as Sale);
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
