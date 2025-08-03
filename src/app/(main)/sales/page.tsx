
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { Sale } from '@/lib/definitions';
import { SalesClient } from '@/components/pages/sales/SalesClient';

export default function SalesPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const path = `artifacts/${appId}/public/data/sales`;
        const q = query(collection(db, path), orderBy('saleDate', 'desc'));
        
        const unsubscribe = onSnapshot(q, snapshot => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Sale[];
            setSales(items);
            setLoading(false);
        }, err => {
            console.error(`Error reading sales:`, err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-full">Chargement des ventes...</div>;
    }

    return <SalesClient sales={sales} />;
}
