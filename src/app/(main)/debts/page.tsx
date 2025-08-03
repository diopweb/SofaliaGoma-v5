
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { Sale } from '@/lib/definitions';
import { DebtsClient } from '@/components/pages/debts/DebtsClient';
import { SALE_STATUS } from '@/lib/constants';

export default function DebtsPage() {
    const [debtSales, setDebtSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const path = `artifacts/${appId}/public/data/sales`;
        const q = query(collection(db, path), where('status', '==', SALE_STATUS.CREDIT));
        
        const unsubscribe = onSnapshot(q, snapshot => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sale[];
            const sortedItems = items.sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime());
            setDebtSales(sortedItems);
            setLoading(false);
        }, err => {
            console.error(`Error reading debt sales:`, err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-full">Chargement des créances...</div>;
    }

    return <DebtsClient debtSales={debtSales} />;
}
