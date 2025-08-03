
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, appId } from '@/lib/firebase';
import { Customer } from '@/lib/definitions';
import { CustomersClient } from '@/components/pages/customers/CustomersClient';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const path = `artifacts/${appId}/public/data/customers`;
        const q = query(collection(db, path));
        const unsubscribe = onSnapshot(q, snapshot => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[];
            setCustomers(items);
            setLoading(false);
        }, err => {
            console.error(`Error reading customers:`, err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-full">Chargement des clients...</div>;
    }

    return <CustomersClient customers={customers} />;
}
