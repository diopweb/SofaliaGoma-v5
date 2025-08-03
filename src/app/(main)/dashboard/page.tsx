
'use client';

import { useMemo } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { Product, Sale } from '@/lib/definitions';
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { PRODUCT_TYPES, SALE_STATUS } from '@/lib/constants';

export default function DashboardPage() {
    const { sales, products, customers, categories } = useAppContext();
    
    const productsToReorder = useMemo(() => {
        if (!products) return [];
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
