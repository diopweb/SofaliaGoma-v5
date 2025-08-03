
'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where, limit, orderBy } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { Product, Customer, Sale, Category } from '@/lib/definitions';
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { PRODUCT_TYPES, SALE_STATUS } from '@/lib/constants';

export default function DashboardPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const collectionsToSubscribe = [
            { name: 'products', setter: setProducts },
            { name: 'customers', setter: setCustomers },
            { name: 'categories', setter: setCategories },
            { name: 'sales', setter: setSales },
        ];

        const unsubs = collectionsToSubscribe.map(({ name, setter }) => {
            const path = `artifacts/${appId}/public/data/${name}`;
            const q = query(collection(db, path));
            return onSnapshot(q, snapshot => {
                const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setter(items as any);
            }, err => console.error(`Error reading ${name}:`, err));
        });
        
        // This is a simple way to check if all initial data has been loaded.
        Promise.all(unsubs).then(() => {
            setLoading(false);
        }).catch(()=>setLoading(false));


        return () => unsubs.forEach(unsub => unsub());
    }, []);

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

    const totalCredit = useMemo(() => sales.filter(s => s.status === SALE_STATUS.CREDIT).reduce((acc, s) => acc + (s.totalPrice - (s.paidAmount || 0)), 0), [sales]);
  
    const totalSalesToday = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return sales.filter(s => s.saleDate && s.saleDate.startsWith(today)).reduce((acc, sale) => acc + sale.totalPrice, 0);
    }, [sales]);
    
    const displayedSales = useMemo(() => sales.sort((a,b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()).slice(0, 5), [sales]);

    if (loading && products.length === 0) {
        return <div className="flex justify-center items-center h-full">Chargement du tableau de bord...</div>;
    }

    return (
        <DashboardClient
            sales={sales}
            products={products}
            customers={customers}
            categories={categories}
            productsToReorder={productsToReorder}
            totalCredit={totalCredit}
            totalSalesToday={totalSalesToday}
            displayedSales={displayedSales}
        />
    );
}
